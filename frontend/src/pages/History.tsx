import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useChat from '../hooks/useChat';
import { motion, AnimatePresence } from 'framer-motion';

const History: React.FC = () => {
  const {
    conversations,
    loadConversations,
    selectConversation,
    isLoading,
    error,
  } = useChat();
  const navigate = useNavigate();

  // 加载对话列表
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 处理对话选择
  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    navigate(`/chat/${id}`);
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取对话预览
  const getConversationPreview = (messages: any[]) => {
    if (messages.length === 0) return '无消息';
    
    // 获取最后一条用户消息
    const lastUserMessage = [...messages]
      .reverse()
      .find(msg => msg.role === 'user');
      
    if (lastUserMessage) {
      return lastUserMessage.content.length > 50
        ? `${lastUserMessage.content.substring(0, 50)}...`
        : lastUserMessage.content;
    }
    
    return '无用户消息';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">对话历史</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-gray-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h2 className="text-xl font-medium text-gray-700 mb-2">暂无对话历史</h2>
          <p className="text-gray-500 mb-4">开始一个新对话，它将显示在这里</p>
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            开始新对话
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {conversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-2 truncate">
                    {conversation.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {getConversationPreview(conversation.messages)}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>消息数: {conversation.messages.length}</span>
                    <span>{formatDate(conversation.updatedAt)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default History;
