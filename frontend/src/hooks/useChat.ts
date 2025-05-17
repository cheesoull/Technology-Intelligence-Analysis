import { useState, useEffect, useCallback } from 'react';
import { API } from '../api';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseChatReturn extends ChatState {
  sendMessage: (content: string, context?: string) => Promise<void>;
  createNewConversation: () => void;
  selectConversation: (id: string) => void;
  loadConversations: () => Promise<void>;
  loadConversationHistory: (id: string) => Promise<void>;
}

export const useChat = (): UseChatReturn => {
  const [state, setState] = useState<ChatState>({
    conversations: [],
    currentConversation: null,
    isLoading: false,
    error: null,
  });

  // 加载所有对话列表
  const loadConversations = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const conversations = await API.chat.list();
      setState(prev => ({ 
        ...prev, 
        conversations, 
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '加载对话列表失败', 
        isLoading: false 
      }));
    }
  }, []);

  // 加载特定对话的历史记录
  const loadConversationHistory = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const history = await API.chat.history(id);
      const conversation = { 
        ...history,
        messages: history.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        createdAt: new Date(history.createdAt),
        updatedAt: new Date(history.updatedAt)
      };
      
      setState(prev => ({ 
        ...prev, 
        currentConversation: conversation, 
        isLoading: false,
        conversations: prev.conversations.map(conv => 
          conv.id === id ? conversation : conv
        )
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '加载对话历史失败', 
        isLoading: false 
      }));
    }
  }, []);

  // 创建新对话
  const createNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      title: `新对话 ${new Date().toLocaleString()}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setState(prev => ({
      ...prev,
      currentConversation: newConversation,
      conversations: [newConversation, ...prev.conversations],
    }));
  }, []);

  // 选择对话
  const selectConversation = useCallback((id: string) => {
    const conversation = state.conversations.find(conv => conv.id === id);
    if (conversation) {
      setState(prev => ({ ...prev, currentConversation: conversation }));
    }
  }, [state.conversations]);

  // 发送消息
  const sendMessage = useCallback(async (content: string, context?: string) => {
    if (!state.currentConversation) {
      createNewConversation();
    }
    
    // 创建用户消息
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date(),
    };
    
    // 创建临时AI消息（显示加载状态）
    const tempAiMessage: Message = {
      id: `msg_${Date.now() + 1}`,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isLoading: true,
    };
    
    // 更新状态，添加用户消息和临时AI消息
    setState(prev => {
      const currentConv = prev.currentConversation || {
        id: `conv_${Date.now()}`,
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updatedConv = {
        ...currentConv,
        messages: [...currentConv.messages, userMessage, tempAiMessage],
        updatedAt: new Date(),
      };
      
      return {
        ...prev,
        currentConversation: updatedConv,
        conversations: prev.currentConversation 
          ? prev.conversations.map(conv => conv.id === updatedConv.id ? updatedConv : conv)
          : [updatedConv, ...prev.conversations],
        isLoading: true,
        error: null,
      };
    });
    
    // 发送请求到API
    try {
      const response = await API.chat.send(content, context);
      
      // 更新状态，替换临时AI消息为实际响应
      setState(prev => {
        if (!prev.currentConversation) return prev;
        
        const updatedMessages = prev.currentConversation.messages.map(msg => 
          msg.id === tempAiMessage.id 
            ? { 
                ...msg, 
                content: response.content || response, 
                isLoading: false,
                timestamp: new Date() 
              } 
            : msg
        );
        
        const updatedConv = {
          ...prev.currentConversation,
          messages: updatedMessages,
          updatedAt: new Date(),
        };
        
        return {
          ...prev,
          currentConversation: updatedConv,
          conversations: prev.conversations.map(conv => 
            conv.id === updatedConv.id ? updatedConv : conv
          ),
          isLoading: false,
        };
      });
    } catch (error) {
      // 更新状态，显示错误消息
      setState(prev => {
        if (!prev.currentConversation) return prev;
        
        const errorMessage = error instanceof Error ? error.message : '发送消息失败';
        
        const updatedMessages = prev.currentConversation.messages.map(msg => 
          msg.id === tempAiMessage.id 
            ? { 
                ...msg, 
                content: `错误: ${errorMessage}`, 
                isLoading: false,
                timestamp: new Date() 
              } 
            : msg
        );
        
        const updatedConv = {
          ...prev.currentConversation,
          messages: updatedMessages,
          updatedAt: new Date(),
        };
        
        return {
          ...prev,
          currentConversation: updatedConv,
          conversations: prev.conversations.map(conv => 
            conv.id === updatedConv.id ? updatedConv : conv
          ),
          isLoading: false,
          error: errorMessage,
        };
      });
    }
  }, [state.currentConversation, createNewConversation]);

  // 初始加载对话列表
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    ...state,
    sendMessage,
    createNewConversation,
    selectConversation,
    loadConversations,
    loadConversationHistory,
  };
};

export default useChat;
