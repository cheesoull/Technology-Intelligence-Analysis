import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Divider, Modal, message, Typography, Avatar, Upload, Radio } from 'antd';
import { SendOutlined, PlusOutlined, DeleteOutlined, ExportOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UploadOutlined, PaperClipOutlined } from '@ant-design/icons';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { API } from '../api';

const { Text, Title } = Typography;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachment?: {
    id: string;
    title: string;
    type: 'paper' | 'blog';
  };
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  paperOrBlogId?: string;
  paperOrBlogTitle?: string;
  type?: 'paper' | 'blog';
}

const api = {
  // 获取聊天历史 
  getChatHistory: async () => {
    try {
      // 从本地存储获取聊天历史
      const savedSessions = localStorage.getItem('chatSessions');
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions);
        console.log('从本地存储加载聊天历史:', sessions.length, '个会话');
        return sessions;
      }
      console.log('本地存储中没有聊天历史，创建新会话');
      return [];
    } catch (error) {
      console.error('获取聊天历史失败:', error);
      return [];
    }
  },

  // 发送聊天消息
  sendMessage: async (message: string, paperOrBlogId?: string, type?: 'paper' | 'blog') => {
    try {
      if (paperOrBlogId && type) {
        // 使用论文/博客上下文的对话
        const response = await API.chat.ask(type, paperOrBlogId, message);
        return response;
      } else {
        // 纯文本对话
        const response = await API.chat.generate(message);
        return response;
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    }
  },

  // 上传文件
  uploadFile: async (file: File, type: 'paper' | 'blog') => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      if (type === 'paper') {
        return await API.papers.upload(formData);
      } else {
        return await API.blogs.upload(formData);
      }
    } catch (error) {
      console.error('上传文件失败:', error);
      throw error;
    }
  }
};

// API响应处理
async function fetchChatResponse(prompt: string, sourceId?: string, sourceType?: 'paper' | 'blog') {
  try {
    const response = await api.sendMessage(prompt, sourceId, sourceType);
    if (typeof response === 'string') {
      return response;
    } else if (response.report) {
      return response.report;
    } else if (response.content) {
      return response.content;
    } else {
      return JSON.stringify(response);
    }
  } catch (error) {
    console.error('获取聊天响应失败:', error);
    return '抱歉，获取响应失败，请稍后再试。';
  }
}

const AI_AVATAR = <Avatar style={{ background: '#1677ff', boxShadow: '0 2px 8px rgba(22, 119, 255, 0.2)' }} size={40} icon={<span>🤖</span>} />;
const USER_AVATAR = <Avatar style={{ background: '#f0f2f5', color: '#666', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }} size={40} icon={<span>👤</span>} />;

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [contentType, setContentType] = useState<'paper' | 'blog'>('paper');
  const [selectedPaperOrBlog, setSelectedPaperOrBlog] = useState<string>('');
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'paper' | 'blog'>('paper');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // 修改初始化聊天会话
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const history = await api.getChatHistory();
        if (history.length > 0) {
          setChatSessions(history);
          setCurrentSession(history[0]);
          setMessages(history[0].messages);
        } else {
          const initialSession: ChatSession = {
            id: Date.now().toString(),
            title: '新对话 1',
            messages: [],
            createdAt: new Date(),
          };
          setChatSessions([initialSession]);
          setCurrentSession(initialSession);
        }
      } catch (error) {
        console.error('初始化聊天失败:', error);
        message.error('加载聊天历史失败');
      }
    };

    initializeChat();
  }, []);
  
  // 保存会话到本地存储
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
    }
  }, [chatSessions]);
  
  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse]);
  
  // 检查是否有从论文页面选择的论文
  useEffect(() => {
    // 检查是否有选中的论文或博客
    const selectedPaperId = localStorage.getItem('selectedPaperForAIChat');
    const selectedPaperTitle = localStorage.getItem('selectedPaperTitleForAIChat');
    const selectedContentType = localStorage.getItem('selectedContentTypeForAIChat') as 'paper' | 'blog' | null;
    
    if (selectedPaperId && selectedPaperTitle && selectedContentType) {
      console.log('检测到选中的内容:', { selectedPaperId, selectedPaperTitle, selectedContentType });
      
      // 更新当前会话的论文或博客信息
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          paperOrBlogId: selectedPaperId,
          paperOrBlogTitle: selectedPaperTitle,
          type: selectedContentType
        };
        
        // 更新会话列表
        const updatedSessions = chatSessions.map(session =>
          session.id === currentSession.id ? updatedSession : session
        );
        
        setCurrentSession(updatedSession);
        setChatSessions(updatedSessions);
        setSelectedPaperOrBlog(selectedPaperId);
        setContentType(selectedContentType);
        
        // 显示成功消息
        message.success(`已选择${selectedContentType === 'paper' ? '论文' : '技术博客'}: ${selectedPaperTitle}`);
        
        // 清除 localStorage 中的数据，防止重复加载
        localStorage.removeItem('selectedPaperForAIChat');
        localStorage.removeItem('selectedPaperTitleForAIChat');
        localStorage.removeItem('selectedContentTypeForAIChat');
        localStorage.removeItem('returnToAIChat');
      }
    }
  }, [currentSession, chatSessions]); 
  
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `新对话 ${chatSessions.length + 1}`,
      messages: [],
      createdAt: new Date(),
    };
    
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
    setMessages([]);
    setSelectedPaperOrBlog('');
    setContentType('paper');
    setShowNewChatModal(false);
  };
  
  const selectSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      setMessages(session.messages);
      setSelectedPaperOrBlog(session.paperOrBlogId || '');
      setContentType(session.type || 'paper');
    }
  };
  

  // 更新会话标题
  const updateSessionTitle = (title: string) => {
    if (currentSession && title.trim()) {
      const updatedSession = { ...currentSession, title };
      const updatedSessions = chatSessions.map(s => 
        s.id === currentSession.id ? updatedSession : s
      );
      
      setChatSessions(updatedSessions);
      setCurrentSession(updatedSession);
      
      // 保存到本地存储
      localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
    }
  };
  
  // 处理会话标题双击编辑
  const handleTitleDoubleClick = () => {
    if (currentSession) {
      const newTitle = prompt('请输入新的会话标题', currentSession.title);
      if (newTitle) {
        updateSessionTitle(newTitle);
      }
    }
  };
  
  // 处理发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    setIsLoading(true);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    
    if (selectedPaperOrBlog && currentSession?.paperOrBlogTitle) {
      userMessage.attachment = {
        id: selectedPaperOrBlog,
        title: currentSession.paperOrBlogTitle,
        type: contentType
      };
    }
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    
    try {
      // 获取当前会话的附加信息
      const sourceId = currentSession?.paperOrBlogId;
      const sourceType = currentSession?.type;

      // 设置初始响应状态
      setStreamingResponse('正在生成回答...');

      // 获取实际响应
      const response = await fetchChatResponse(inputValue, sourceId, sourceType);
      setStreamingResponse(response);

      // 添加AI响应到消息列表
      const aiMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      setStreamingResponse('');

      // 更新当前会话
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          messages: finalMessages,
        };
        setCurrentSession(updatedSession);

        // 更新会话列表
        const updatedSessions = chatSessions.map(session =>
          session.id === currentSession.id ? updatedSession : session
        );
        setChatSessions(updatedSessions);

        // 保存到本地存储
        localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送消息失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理文件上传
  const handleFileUpload = async () => {
    if (!uploadFile) {
      message.error('请选择文件');
      return;
    }

    setUploadLoading(true);

    try {
      // 调用API上传文件
      const result = await api.uploadFile(
        uploadFile,
        uploadType
      );

      if (result && result.data) {
        // 创建新会话或更新当前会话
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: `上传的${uploadType === 'paper' ? '论文' : '技术博客'}`,
          messages: [],
          createdAt: new Date(),
          paperOrBlogId: result.data._id,
          paperOrBlogTitle: result.data.title,
          type: uploadType
        };
        
        setChatSessions(prev => [newSession, ...prev]);
        setCurrentSession(newSession);
        setMessages([]);
        
        // 重置上传表单
        setUploadFile(null);
        setUploadType('paper');
        setShowUploadModal(false);
        
        message.success(`${uploadType === 'paper' ? '论文' : '技术博客'}上传成功`);
        
        // 设置选中的论文或博客ID
        setSelectedPaperOrBlog(result.data._id);
      }
    } catch (error) {
      console.error('上传文件失败:', error);
      message.error('上传文件失败，请重试');
    } finally {
      setUploadLoading(false);
    }
  };

  const exportToMarkdown = () => {
    if (!currentSession) return;
    const aiResponses = messages.filter(m => m.role === 'assistant');
    if (aiResponses.length === 0) return;
    const lastResponse = aiResponses[aiResponses.length - 1].content;
    const title = currentSession.paperOrBlogTitle
      ? `${contentType === 'paper' ? '论文' : '技术博客'}：${currentSession.paperOrBlogTitle}`
      : '';
    const mdContent = `# AI解读报告\n\n${title ? `## ${title}\n\n` : ''}${lastResponse}\n\n---\n生成时间：${new Date().toLocaleString()}\n`;
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `对话报告_${currentSession.title || '未命名'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`对话报告_${currentSession?.title || '未命名'}.pdf`);
      message.success('报告已成功导出为PDF');
    } catch (error) {
      console.error('导出PDF失败:', error);
      message.error('导出PDF失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };
  
  const generateReportContent = () => {
    if (!currentSession) return null;
    
    // 提取AI回复中的主要内容
    const aiResponses = messages.filter(m => m.role === 'assistant');
    if (aiResponses.length === 0) return null;
    
    // 获取最后一条AI回复
    const lastResponse = aiResponses[aiResponses.length - 1].content;
    
    return (
      <div className="report-content" style={{ width: '100%', maxWidth: '100%' }}>
        <Title level={2}>AI解读报告</Title>
        
        {currentSession.paperOrBlogTitle && (
          <div className="mb-4">
            <Title level={4}>
              {contentType === 'paper' ? '论文' : '技术博客'}：{currentSession.paperOrBlogTitle}
            </Title>
          </div>
        )}
        
        <Divider />
        
        <div className="markdown-content" style={{ width: '100%', overflowX: 'auto' }}>
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >{lastResponse}</ReactMarkdown>
        </div>
        
        <Divider />
        
        <div className="report-footer">
          <Text type="secondary">生成时间：{new Date().toLocaleString()}</Text>
        </div>
      </div>
    );
  };

  return (
    <div
      className="ai-chat-container"
      style={{
        height: '100%',
        width: '98%',
        background: '#f6f8fa',
        overflow: 'hidden',
        display: 'flex',
        position: 'fixed'
      }}
    >
      {/* 对话历史列表 - 支持收缩/展开 */}
      <div
        className="bg-white flex flex-col transition-all duration-200"
        style={{
          height: '100%',
          width: historyCollapsed ? 80 : 280,
          boxShadow: '2px 0 8px -2px rgba(0,0,0,0.06)',
          zIndex: 100,
          borderRight: '1px solid #e5e7eb',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
          flexShrink: 0,
        }}
      >
        {/* 顶部导航栏 - 包含标题、新建按钮和收缩按钮 */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ height: 56 }}>
          {!historyCollapsed ? (
            <>
              <span className="font-bold text-xl tracking-wide text-[#1a237e]">对话历史</span>
              <div className="flex items-center">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowNewChatModal(true)}
                  size="small"
                  style={{ borderRadius: 24, fontWeight: 500, marginRight: 8 }}
                >
                  新建对话
                </Button>
                <div
                  style={{
                    cursor: 'pointer',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666'
                  }}
                  onClick={() => setHistoryCollapsed((v: boolean) => !v)}
                >
                  <MenuFoldOutlined />
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  cursor: 'pointer',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666'
                }}
                onClick={() => setHistoryCollapsed((v: boolean) => !v)}
              >
                <MenuUnfoldOutlined />
              </div>
            </div>
          )}
        </div>
        {/* 会话列表 */}
        <div
          className="flex-1 px-2 py-3 space-y-2 overflow-y-auto"
          style={{
            paddingLeft: historyCollapsed ? 4 : 8,
            paddingRight: historyCollapsed ? 4 : 8,
            width: '100%',
            overflowX: 'hidden',
            height: 'calc(100% - 56px)',
          }}
        >
          {historyCollapsed ? (
            chatSessions.map(session => (
              <div
                key={session.id}
                className={`flex items-center justify-center rounded-lg cursor-pointer transition-all
                  ${currentSession?.id === session.id
                    ? 'bg-[#e3f2fd] font-semibold text-[#1976d2]'
                    : 'hover:bg-[#f5faff] text-gray-700'
                  }`}
                style={{ minHeight: 44, width: 40, margin: '0 auto' }}
                onClick={() => selectSession(session.id)}
                title={session.title}
              >
                <span style={{ fontSize: 18 }}>💬</span>
              </div>
            ))
          ) : (
            chatSessions.map(session => (
              <div
                key={session.id}
                className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all
                  ${currentSession?.id === session.id
                    ? 'bg-[#e3f2fd] font-semibold text-[#1976d2]'
                    : 'hover:bg-[#f5faff] text-gray-700'
                  }`}
                style={{ minHeight: 48, marginRight: '8px' }}
                onClick={() => selectSession(session.id)}
              >
                <span 
                  className="truncate flex-1" 
                  onDoubleClick={currentSession?.id === session.id ? handleTitleDoubleClick : undefined}
                  style={{ cursor: currentSession?.id === session.id ? 'pointer' : 'default' }}
                  title={currentSession?.id === session.id ? '双击编辑标题' : session.title}
                >
                  {session.title}
                </span>
                {currentSession?.id === session.id && (
                  <span className="ml-2 text-xs text-[#1976d2]">●</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 主内容区和报告区 */}
      <div
        className="overflow-hidden"
        style={{
          transition: 'all 0.2s ease',
          zIndex: 20,
          display: 'flex',
          flex: 1,
          width: '100%',
        }}
      >
        {/* 聊天区域 */}
        <div
          className="chat-main flex flex-col bg-[#f6f8fa] overflow-hidden"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            minWidth: 0, 
          }}
        >
          {/* 聊天头部 */}
          <div className="chat-header flex-shrink-0 px-4 py-3 border-b border-gray-100 bg-white flex items-center"
            style={{
              height: 56, 
              width: '100%',
              minWidth: '100%',
              margin: '0 auto',
              boxSizing: 'border-box',
              position: 'sticky',
              top: 0,
              zIndex: 50,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div className="flex flex-col w-full">
              <div className="font-semibold text-lg text-gray-900 mb-1" style={{ marginTop: 6 }}>{currentSession?.title || 'AI助手对话'}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                type="primary" 
                size="small"
                onClick={() => {
                  // 打开上传文件对话框
                  setShowUploadModal(true);
                }}
                style={{ marginRight: 8 }}
              >
                上传文件
              </Button>
              <Button 
                type="default" 
                size="small"
                onClick={() => {
                  setContentType('paper');
                  // 导航到论文页面选择
                  localStorage.setItem('returnToAIChat', 'true');
                  window.location.href = '/papers';
                }}
                style={{ marginRight: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className={contentType === 'paper' ? 'bg-blue-50 border-blue-300 text-blue-600' : ''}
              >
                论文
              </Button>
              <Button 
                type="default" 
                size="small"
                onClick={() => {
                  setContentType('blog');
                  // 导航到技术博客页面选择
                  localStorage.setItem('returnToAIChat', 'true');
                  window.location.href = '/tech-blogs';
                }}
                className={contentType === 'blog' ? 'bg-blue-50 border-blue-300 text-blue-600' : ''}
              >
                技术博客
              </Button>
            </div>
          </div>
          {/* 聊天消息区域 */}
          <div
            className="chat-messages flex-1 w-full"
            style={{
              scrollbarWidth: 'thin',
              minHeight: 0,
              height: 'calc(100% - 64px - 70px)', 
              background: '#f6f8fa',
              overflowY: 'auto',
              overflowX: 'hidden',
              minWidth: 0,
              paddingBottom: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start', // 改为顶部对齐，解决滚动限制问题
              paddingTop: '20px', // 减少顶部内边距
            }}
          >
            <div
              className="flex flex-col gap-4 py-6"
              style={{
                width: '100%',
                maxWidth: '1200px', 
                minWidth: '600px',
                margin: '0 auto',
                paddingLeft: '40px',
                paddingRight: '40px',
              }}
            >
              {messages.length === 0 && !streamingResponse ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 select-none" style={{ minHeight: '40vh', marginTop: '30px' }}>
                  <div className="text-5xl mb-4">🤖</div>
                  <div className="text-2xl mb-3 font-light">欢迎开始新的对话</div>
                  <div className="text-base text-center max-w-md">请选择或上传论文/技术博客，然后输入您的问题，AI助手将为您解读分析</div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 py-6">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'} items-start`}
                    >
                      {message.role === 'assistant' ? (
                        <>
                        <div className="mr-4 ml-2 flex-shrink-0 flex items-start pt-0.5">{AI_AVATAR}</div>
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '95%',
                            background: 'none',
                            color: '#222',
                            fontSize: 16,
                            lineHeight: 1.7,
                            padding: 0,
                          }}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                          >{message.content}</ReactMarkdown>
                        </div>
                        </>
                      ) : (
                        <>
                          <div
                            className="rounded-2xl px-5 py-3 shadow-sm border bg-blue-500 border-blue-500 text-white"
                            style={{ borderRadius: 20, maxWidth: '75%' }}
                          >
                            {/* 如果有附件，显示附件信息 */}
                            {message.attachment && (
                              <div className="mb-2 pb-2 border-b border-blue-400">
                                <div className="flex items-center">
                                  <PaperClipOutlined style={{ marginRight: 5 }} />
                                  <span className="font-medium">
                                    {message.attachment.type === 'paper' ? '论文' : '技术博客'}：
                                  </span>
                                  <span className="ml-1 truncate">{message.attachment.title}</span>
                                </div>
                              </div>
                            )}
                            <div className="whitespace-pre-wrap break-words">
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                              >{message.content}</ReactMarkdown>
                            </div>
                          </div>
                          <div className="ml-4 mr-2 flex-shrink-0 flex items-start pt-0.5">{USER_AVATAR}</div>
                        </>
                      )}
                    </div>
                  ))}
                  {/* 流式响应 */}
                  {streamingResponse && (
                    <div className="flex justify-start items-start">
                      <div className="mr-4 ml-2 flex-shrink-0 flex items-start pt-0.5">{AI_AVATAR}</div>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '75%',
                          background: 'none',
                          color: '#222',
                          fontSize: 16,
                          lineHeight: 1.7,
                          padding: 0,
                        }}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >{streamingResponse}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>
          {/* 聊天输入区域 - 缩小宽度，只在聊天界面底部居中 */}
          <div
            className="chat-input-container w-full px-4 py-4 flex-shrink-0"
            style={{
              zIndex: 10,
              position: 'sticky',
              bottom: 0,
              borderTop: 'none', 
              borderRadius: '0',
              transition: 'all 0.3s ease',
              display: 'flex',
              justifyContent: 'center',
              background: 'transparent', 
              height: '70px', 
            }}
          >
            <div
              className="flex items-center"
              style={{
                width: '100%',
                maxWidth: 600,
                minWidth: 260,
                margin: '0 auto',
              }}
            >
              <Input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onPressEnter={handleSend}
                placeholder="请输入您的问题..."
                disabled={isLoading}
                className="flex-1 resize-none"
                size="large"
                style={{
                  borderRadius: 24,
                  background: '#fff',
                  fontSize: 16,
                  paddingRight: 40,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  height: 50,
                  border: 'none', // 去掉边框
                }}
                suffix={
                  <SendOutlined
                    onClick={handleSend}
                    style={{
                      color: inputValue.trim() && !isLoading ? '#1677ff' : '#ccc',
                      fontSize: 20,
                      cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed'
                    }}
                  />
                }
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
        </div>
        {/* 右侧报告预览区域 */}
        <div
          className="report-preview-sidebar bg-white border-l border-gray-200 flex flex-col"
          style={{
            width: 360,
            overflow: 'hidden',
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          <div className="p-3 border-b border-gray-200 flex-shrink-0" style={{ height: 56 }}>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">报告预览</h2>
              <div className="flex gap-2">
                <Button
                  type="default"
                  onClick={exportToMarkdown}
                  disabled={messages.filter(m => m.role === 'assistant').length === 0}
                >
                  导出Markdown
                </Button>
                <Button 
                  type="primary" 
                  icon={<ExportOutlined />} 
                  onClick={exportToPDF}
                  loading={isExporting}
                  disabled={messages.filter(m => m.role === 'assistant').length === 0}
                >
                  导出PDF
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <div className="report-preview" ref={reportRef}>
              {messages.filter(m => m.role === 'assistant').length > 0 ? (
                generateReportContent()
              ) : (
                <div className="text-center py-8">
                  <Text type="secondary">开始对话后将在此处显示解读报告</Text>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 新建对话模态框 */}
      <Modal
        title="创建新对话"
        open={showNewChatModal}
        onOk={createNewSession}
        onCancel={() => setShowNewChatModal(false)}
        okText="创建"
        cancelText="取消"
      >
        <p>创建新的AI对话会话？</p>
        <p className="text-gray-500">您可以选择论文或技术博客进行解读分析。</p>
      </Modal>
      
      {/* 上传文件模态框 */}
      <Modal
        title="上传文件"
        open={showUploadModal}
        onOk={handleFileUpload}
        confirmLoading={uploadLoading}
        onCancel={() => {
          setShowUploadModal(false);
          setUploadFile(null);
          setUploadType('paper');
        }}
      >
        <div className="mb-4">
          <div className="mb-2">文件类型：</div>
          <Radio.Group value={uploadType} onChange={e => setUploadType(e.target.value)}>
            <Radio.Button value="paper">论文</Radio.Button>
            <Radio.Button value="blog">博客</Radio.Button>
          </Radio.Group>
        </div>
        <Upload
          beforeUpload={(file) => {
            setUploadFile(file);
            return false;
          }}
          onRemove={() => setUploadFile(null)}
          fileList={uploadFile ? [{
            uid: '-1',
            name: uploadFile.name,
            status: 'done',
            size: uploadFile.size,
            type: uploadFile.type
          }] : []}
        >
          <Button icon={<UploadOutlined />}>选择文件</Button>
        </Upload>
      </Modal>
    </div>
  );
};

export default AIChat;
