import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Select, Divider, Tooltip, Modal, message, Typography, Avatar } from 'antd';
import { SendOutlined, PlusOutlined, DeleteOutlined, ExportOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

interface Paper {
  _id: string;
  title: string;
  authors: Array<{name: string}>;
}

interface TechBlog {
  _id: string;
  title: string;
  author: string;
}

// 模拟论文数据
const mockPapers: Paper[] = [
  { _id: '1', title: 'GPT-4: 大规模语言模型的架构与应用', authors: [{name: '张三'}, {name: '李四'}] },
  { _id: '2', title: '深度学习在计算机视觉中的最新进展', authors: [{name: '王五'}, {name: '赵六'}] },
  { _id: '3', title: '强化学习算法综述', authors: [{name: '孙七'}, {name: '周八'}] },
];

// 模拟技术博客数据
const mockBlogs: TechBlog[] = [
  { _id: '1', title: 'React 18新特性详解', author: '张三' },
  { _id: '2', title: 'TypeScript高级类型系统', author: '李四' },
  { _id: '3', title: '大规模分布式系统设计原则', author: '王五' },
];

// 模拟流式响应函数 - 在实际使用时调用
const simulateStreamResponse = (onUpdate: (text: string) => void, onComplete: () => void) => {
  const responses = [
    "我正在分析您提供的内容...\n\n",
    "这篇论文/博客主要讨论了以下几个方面：\n\n",
    "1. 核心概念与背景\n",
    "2. 主要方法与技术\n",
    "3. 实验结果与分析\n",
    "4. 结论与未来展望\n\n",
    "接下来我将详细解读每个部分：\n\n",
    "## 核心概念与背景\n\n",
    "该研究围绕人工智能和深度学习展开，特别关注了大型语言模型的发展。作者指出当前研究面临的主要挑战是模型规模与计算效率的平衡问题。\n\n",
    "## 主要方法与技术\n\n",
    "作者提出了一种新的注意力机制，能够在保持模型表现的同时显著降低计算复杂度。具体来说，该方法通过稀疏注意力和局部敏感哈希技术，将传统Transformer的计算复杂度从O(n²)降低到O(n log n)。\n\n",
    "## 实验结果与分析\n\n",
    "在多个基准测试中，该方法展现出了优异的性能，特别是在长序列处理任务上。与现有方法相比，新方法在GLUE基准测试上平均提升了2.3个百分点，同时训练时间减少了约40%。\n\n",
    "## 结论与未来展望\n\n",
    "研究表明，通过优化注意力机制，可以显著提升大型语言模型的效率。未来工作将探索如何将这一方法应用到多模态模型中，以及进一步降低模型的内存需求。\n\n",
    "您对这个解读有什么特别想了解的方面吗？"
  ];
  
  let fullResponse = '';
  
  for (const part of responses) {
    setTimeout(() => {
      onUpdate(part);
      fullResponse += part;
    }, 300 + Math.random() * 700);
  }
  
  setTimeout(onComplete, 300 + Math.random() * 700);
};

// 流式响应生成器
class StreamGenerator {
  private prompt: string;
  private responses: string[];
  private fullResponse: string;
  private index: number;

  constructor(prompt: string) {
    this.prompt = prompt;
    this.responses = [
      "我正在分析您提供的内容...\n\n",
      "这篇论文/博客主要讨论了以下几个方面：\n\n",
      "1. 核心概念与背景\n",
      "2. 主要方法与技术\n",
      "3. 实验结果与分析\n",
      "4. 结论与未来展望\n\n",
      "接下来我将详细解读每个部分：\n\n",
      "## 核心概念与背景\n\n",
      "该研究围绕人工智能和深度学习展开，特别关注了大型语言模型的发展。作者指出当前研究面临的主要挑战是模型规模与计算效率的平衡问题。\n\n",
      "## 主要方法与技术\n\n",
      "作者提出了一种新的注意力机制，能够在保持模型表现的同时显著降低计算复杂度。具体来说，该方法通过稀疏注意力和局部敏感哈希技术，将传统Transformer的计算复杂度从O(n²)降低到O(n log n)。\n\n",
      "## 实验结果与分析\n\n",
      "在多个基准测试中，该方法展现出了优异的性能，特别是在长序列处理任务上。与现有方法相比，新方法在GLUE基准测试上平均提升了2.3个百分点，同时训练时间减少了约40%。\n\n",
      "## 结论与未来展望\n\n",
      "研究表明，通过优化注意力机制，可以显著提升大型语言模型的效率。未来工作将探索如何将这一方法应用到多模态模型中，以及进一步降低模型的内存需求。\n\n",
      "您对这个解读有什么特别想了解的方面吗？"
    ];
    this.fullResponse = "";
    this.index = 0;
  }

  async next(): Promise<{value: string; done: boolean}> {
    if (this.index >= this.responses.length) {
      return { value: this.fullResponse, done: true };
    }

    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
    this.fullResponse += this.responses[this.index];
    this.index++;

    return { value: this.fullResponse, done: false };
  }
}

function streamGenerator(prompt: string): StreamGenerator {
  return new StreamGenerator(prompt);
}

const AI_AVATAR = <Avatar style={{ background: '#1677ff', boxShadow: '0 2px 8px rgba(22, 119, 255, 0.2)' }} size={40} icon={<span>🤖</span>} />;
const USER_AVATAR = <Avatar style={{ background: '#f0f2f5', color: '#666', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }} size={40} icon={<span>👤</span>} />;

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [selectedPaperOrBlog, setSelectedPaperOrBlog] = useState<string>('');
  const [contentType, setContentType] = useState<'paper' | 'blog'>('paper');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  // 报告相关状态
  const [isExporting, setIsExporting] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // 初始化聊天会话
  useEffect(() => {
    // 检查是否有从论文详情页传递过来的论文信息
    const selectedPaperId = localStorage.getItem('selectedPaperForAIChat');
    const selectedPaperTitle = localStorage.getItem('selectedPaperTitleForAIChat');
    const selectedContentType = localStorage.getItem('selectedContentTypeForAIChat') as 'paper' | 'blog' || 'paper';
    
    // 模拟从本地存储或API获取历史会话
    const savedSessions = localStorage.getItem('chatSessions');
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions);
        setChatSessions(parsedSessions);
        if (parsedSessions.length > 0) {
          setCurrentSession(parsedSessions[0]);
          setMessages(parsedSessions[0].messages);
        } else {
          createNewSession();
        }
      } catch (error) {
        console.error('解析会话数据失败:', error);
        createNewSession();
      }
    } else {
      createNewSession();
    }
    
    // 如果有论文信息，自动选择该论文
    if (selectedPaperId && selectedPaperTitle) {
      setSelectedPaperOrBlog(selectedPaperId);
      setContentType(selectedContentType);
      
      // 更新当前会话标题
      if (currentSession) {
        const updatedSession = { 
          ...currentSession, 
          title: `${selectedContentType === 'paper' ? '论文' : '博客'}解读: ${selectedPaperTitle.substring(0, 20)}${selectedPaperTitle.length > 20 ? '...' : ''}`,
          paperOrBlogId: selectedPaperId,
          paperOrBlogTitle: selectedPaperTitle,
          type: selectedContentType
        };
        
        const updatedSessions = chatSessions.map(s => 
          s.id === currentSession.id ? updatedSession : s
        );
        
        setChatSessions(updatedSessions);
        setCurrentSession(updatedSession);
      }
      
      // 清除localStorage中的信息，避免重复选择
      localStorage.removeItem('selectedPaperForAIChat');
      localStorage.removeItem('selectedPaperTitleForAIChat');
      localStorage.removeItem('selectedContentTypeForAIChat');
    }
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
  
  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
    setChatSessions(updatedSessions);
    
    if (currentSession?.id === sessionId) {
      if (updatedSessions.length > 0) {
        setCurrentSession(updatedSessions[0]);
        setMessages(updatedSessions[0].messages);
      } else {
        createNewSession();
      }
    }
  };
  
  const updateSessionTitle = (title: string) => {
    if (currentSession) {
      const updatedSession = { ...currentSession, title };
      const updatedSessions = chatSessions.map(s => 
        s.id === currentSession.id ? updatedSession : s
      );
      
      setChatSessions(updatedSessions);
      setCurrentSession(updatedSession);
    }
  };
  
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // 开始流式响应
      setStreamingResponse('');
      const generator = streamGenerator(inputValue);
      
      let result = await generator.next();
      while (!result.done) {
        setStreamingResponse(result.value);
        result = await generator.next();
      }
      
      // 流式响应完成，添加到消息列表
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.value,
        timestamp: new Date(),
      };
      
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      setStreamingResponse('');
      
      // 更新当前会话
      if (currentSession) {
        const updatedSession = { 
          ...currentSession, 
          messages: finalMessages,
          paperOrBlogId: selectedPaperOrBlog,
          type: contentType,
        };
        
        const updatedSessions = chatSessions.map(s => 
          s.id === currentSession.id ? updatedSession : s
        );
        
        setChatSessions(updatedSessions);
        setCurrentSession(updatedSession);
      }
      
    } catch (error) {
      console.error('AI响应出错:', error);
      message.error('获取AI响应时出错，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handlePaperOrBlogSelect = (value: string) => {
    setSelectedPaperOrBlog(value);
    
    // 查找选中的论文或博客标题
    let title = '';
    if (contentType === 'paper') {
      const paper = mockPapers.find(p => p._id === value);
      title = paper?.title || '';
    } else {
      const blog = mockBlogs.find(b => b._id === value);
      title = blog?.title || '';
    }
    
    // 更新当前会话
    if (currentSession) {
      const updatedSession = { 
        ...currentSession, 
        paperOrBlogId: value,
        paperOrBlogTitle: title,
        type: contentType,
      };
      
      const updatedSessions = chatSessions.map(s => 
        s.id === currentSession.id ? updatedSession : s
      );
      
      setChatSessions(updatedSessions);
      setCurrentSession(updatedSession);
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
      <div className="report-content">
        <Title level={2}>AI解读报告</Title>
        
        {currentSession.paperOrBlogTitle && (
          <div className="mb-4">
            <Title level={4}>
              {contentType === 'paper' ? '论文' : '技术博客'}：{currentSession.paperOrBlogTitle}
            </Title>
          </div>
        )}
        
        <Divider />
        
        <div className="markdown-content">
          <ReactMarkdown>{lastResponse}</ReactMarkdown>
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
        height: '100vh',
        width: '100%',
        background: '#f6f8fa',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* 对话历史列表 - 支持收缩/展开 */}
      <div
        className="bg-white flex flex-col transition-all duration-200"
        style={{
          height: '100vh',
          width: historyCollapsed ? 55 : 240,
          boxShadow: '2px 0 8px -2px rgba(0,0,0,0.06)',
          zIndex: 100,
          borderRight: '1px solid #e5e7eb',
          overflow: 'hidden',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          transition: 'width 0.2s ease',
        }}
      >
        {/* 收缩/展开按钮 */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: historyCollapsed ? 8 : -16, // 调整收缩时的位置，确保完全显示
            zIndex: 110,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e5e7eb',
            transition: 'right 0.2s',
          }}
          onClick={() => setHistoryCollapsed(v => !v)}
        >
          {historyCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
        {/* 顶部 */}
        {!historyCollapsed && (
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ height: 56 }}>
            <span className="font-bold text-xl tracking-wide text-[#1a237e]">对话历史</span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowNewChatModal(true)}
              size="small"
              style={{ borderRadius: 24, fontWeight: 500 }}
            >
              新建对话
            </Button>
          </div>
        )}
        {/* 会话列表 */}
        <div
          className="flex-1 px-2 py-3 space-y-2 overflow-y-auto"
          style={{
            paddingLeft: historyCollapsed ? 4 : 8, // 增加收缩时的内边距
            paddingRight: historyCollapsed ? 4 : 8, // 增加收缩时的内边距
            width: '100%', // 确保完全宽度
            overflowX: 'hidden', // 防止水平滚动
            position: 'absolute',
            top: 56, // 顶部标题区域高度
            bottom: 0,
            left: 0,
            right: 0,
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
                style={{ minHeight: 48 }}
                onClick={() => selectSession(session.id)}
              >
                <span className="truncate flex-1">{session.title}</span>
                {currentSession?.id === session.id && (
                  <span className="ml-2 text-xs text-[#1976d2]">●</span>
                )}
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={e => { e.stopPropagation(); deleteSession(session.id, e); }}
                  style={{ marginLeft: 8, visibility: currentSession?.id === session.id ? 'visible' : 'hidden' }}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* 主内容区和报告区 */}
      <div
        className="overflow-hidden"
        style={{
          position: 'absolute',
          left: historyCollapsed ? 55 : 240,
          top: 0,
          right: 0,
          bottom: 0,
          transition: 'all 0.2s ease',
          zIndex: 20,
          display: 'flex',
          width: `calc(100% - ${historyCollapsed ? 55 : 240}px)`,
        }}
      >
        {/* 聊天区域 */}
        <div
          className="chat-main flex flex-col bg-[#f6f8fa] overflow-hidden"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 360,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'auto',
          }}
        >
          {/* 聊天头部 */}
          <div className="chat-header flex-shrink-0 px-4 py-3 border-b border-gray-100 bg-white flex items-center justify-center"
            style={{
              height: 56, // 固定高度，与侧边栏保持一致
              width: '100%',
              minWidth: '100%',
              margin: '0 auto',
              boxSizing: 'border-box',
              position: 'sticky',
              top: 0,
              zIndex: 50,
            }}
          >
            <div className="flex flex-col items-center w-full">
              <div className="font-semibold text-lg text-gray-900 text-left">{currentSession?.title || 'AI助手对话'}</div>
              <div className="flex items-center justify-start gap-2 mt-2 w-full">
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => {
                    // 打开上传论文对话框
                    setContentType('paper');
                    setShowUploadModal(true);
                  }}
                  style={{ marginRight: 8 }}
                >
                  上传论文
                </Button>
                <Button 
                  type="default" 
                  size="small"
                  onClick={() => {
                    // 打开上传博客对话框
                    setContentType('blog');
                    setShowUploadModal(true);
                  }}
                >
                  上传博客
                </Button>
                <Select
                  value={selectedPaperOrBlog}
                  onChange={handlePaperOrBlogSelect}
                  placeholder={`选择${contentType === 'paper' ? '论文' : '博客'}`}
                  style={{ width: 200 }}
                  showSearch
                  optionFilterProp="children"
                  size="small"
                  bordered={false}
                >
                  {contentType === 'paper'
                    ? mockPapers.map(paper => (
                        <Option key={paper._id} value={paper._id}>
                          {paper.title}
                        </Option>
                      ))
                    : mockBlogs.map(blog => (
                        <Option key={blog._id} value={blog._id}>
                          {blog.title}
                        </Option>
                      ))}
                </Select>
              </div>
            </div>
          </div>
          {/* 聊天消息区域 */}
          <div
            className="chat-messages flex-1 w-full"
            style={{
              scrollbarWidth: 'thin',
              minHeight: 0,
              height: 'calc(100% - 56px - 70px)', // 调整高度以适应新的顶栏和输入框高度
              background: '#f6f8fa',
              overflowY: 'auto',
              overflowX: 'hidden',
              minWidth: 0,
              paddingBottom: '20px',
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '10px',
            }}
          >
            <div
              className="flex flex-col gap-4 py-6"
              style={{
                width: '100%',
                maxWidth: 900,
                minWidth: 340,
                margin: '0 auto',
                paddingLeft: '10px', // 增加左侧内边距
                paddingRight: '10px', // 增加右侧内边距
              }}
            >
              {messages.length === 0 && !streamingResponse ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 select-none">
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="text-lg mb-1">欢迎开始新的对话</div>
                  <div className="text-base">请输入您的问题，AI助手将为您解读论文或博客</div>
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
                            maxWidth: '75%',
                            background: 'none',
                            color: '#222',
                            fontSize: 16,
                            lineHeight: 1.7,
                            padding: 0,
                          }}
                        >
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                          {/* 移除时间戳 */}
                        </div>
                        </>
                      ) : (
                        <>
                          <div
                            className="rounded-2xl px-5 py-3 shadow-sm border bg-blue-500 border-blue-500 text-white"
                            style={{ borderRadius: 20, maxWidth: '75%' }}
                          >
                            <div className="whitespace-pre-wrap break-words">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                            {/* 移除时间戳 */}
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
                        <ReactMarkdown>{streamingResponse}</ReactMarkdown>
                        {/* 移除时间戳 */}
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
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              borderTop: 'none', // 去除顶部的灰色线
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
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 360,
            overflow: 'hidden',
            zIndex: 10,
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
        title={contentType === 'paper' ? "上传论文" : "上传技术博客"}
        open={showUploadModal}
        onOk={() => {
          // 处理文件上传逻辑
          message.success(`${contentType === 'paper' ? '论文' : '博客'}上传成功！`);
          setShowUploadModal(false);
          
          // 创建新会话并关联上传的文件
          const newSession: ChatSession = {
            id: Date.now().toString(),
            title: `新对话 ${chatSessions.length + 1}`,
            messages: [],
            createdAt: new Date(),
            type: contentType,
            // 这里应该设置真实上传的文件ID和标题
            paperOrBlogId: '上传的文件ID',
            paperOrBlogTitle: '上传的文件标题'
          };
          
          setChatSessions(prev => [newSession, ...prev]);
          setCurrentSession(newSession);
          setMessages([]);
        }}
        onCancel={() => setShowUploadModal(false)}
        okText="上传"
        cancelText="取消"
      >
        <div className="mb-4">
          <p>{contentType === 'paper' ? '请选择要上传的论文文件：' : '请选择要上传的技术博客文件：'}</p>
          <Input type="file" className="mt-2" />
        </div>
        <div>
          <p>文件描述（可选）：</p>
          <Input.TextArea rows={3} placeholder="请输入文件的简要描述..." className="mt-2" />
        </div>
      </Modal>
    </div>
  );
};

export default AIChat;
