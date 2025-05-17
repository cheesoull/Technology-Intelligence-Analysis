import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useChat from '../hooks/useChat';
import ReportViewer from '../components/ReportViewer';
import { motion } from 'framer-motion';

const Report: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { conversations, loadConversationHistory, isLoading } = useChat();
  
  const [reportContent, setReportContent] = useState<string>('');
  const [reportTitle, setReportTitle] = useState<string>('AI报告');
  const [isGenerating, setIsGenerating] = useState(false);

  // 加载对话历史
  useEffect(() => {
    if (id) {
      loadConversationHistory(id);
    }
  }, [id, loadConversationHistory]);

  // 获取当前对话
  const currentConversation = conversations.find(conv => conv.id === id);

  // 生成报告内容
  const generateReport = () => {
    if (!currentConversation) return;
    
    setIsGenerating(true);
    
    // 模拟生成报告的过程
    setTimeout(() => {
      // 提取对话内容生成报告
      const assistantMessages = currentConversation.messages.filter(
        msg => msg.role === 'assistant'
      );
      
      // 设置报告标题
      setReportTitle(`AI对话报告 - ${currentConversation.title}`);
      
      // 构建Markdown格式的报告内容
      let content = `# ${currentConversation.title}\n\n`;
      content += `*生成时间: ${new Date().toLocaleString()}*\n\n`;
      content += `## 对话摘要\n\n`;
      
      // 添加对话内容
      content += `## 详细内容\n\n`;
      
      currentConversation.messages.forEach((msg, index) => {
        const role = msg.role === 'user' ? '👤 用户' : '🤖 AI';
        content += `### ${role} (${msg.timestamp.toLocaleString()})\n\n`;
        content += `${msg.content}\n\n`;
        
        // 在用户和AI消息之间添加分隔线
        if (index < currentConversation.messages.length - 1) {
          content += `---\n\n`;
        }
      });
      
      // 添加结论部分
      content += `## 结论\n\n`;
      
      if (assistantMessages.length > 0) {
        // 使用最后一条AI消息作为结论
        const lastMessage = assistantMessages[assistantMessages.length - 1];
        content += `${lastMessage.content}\n\n`;
      } else {
        content += `*本次对话没有AI回复*\n\n`;
      }
      
      // 设置报告内容
      setReportContent(content);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI报告预览</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            返回聊天
          </button>
        </div>
      </div>

      {!id ? (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="text-xl font-medium text-gray-700 mb-2">未选择对话</h2>
          <p className="text-gray-500 mb-4">请选择一个对话生成报告</p>
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            返回聊天
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : !currentConversation ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>未找到指定对话</p>
        </div>
      ) : reportContent ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ReportViewer content={reportContent} title={reportTitle} />
        </motion.div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-blue-500 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 className="text-xl font-medium text-gray-800 mb-2">
              {currentConversation.title}
            </h2>
            <p className="text-gray-600 mb-6">
              该对话包含 {currentConversation.messages.length} 条消息，
              创建于 {currentConversation.createdAt.toLocaleString()}
            </p>
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className={`px-6 py-3 rounded-md ${
                isGenerating
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } transition-colors`}
            >
              {isGenerating ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  生成报告中...
                </div>
              ) : (
                '生成AI报告'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
