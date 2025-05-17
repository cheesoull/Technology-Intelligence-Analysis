import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useChat from '../hooks/useChat';
import Sidebar from '../components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import FileUpload from '../components/FileUpload';
import { motion, AnimatePresence } from 'framer-motion';

const Chat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    conversations,
    currentConversation,
    isLoading,
    sendMessage,
    createNewConversation,
    selectConversation,
    loadConversationHistory,
  } = useChat();
  
  const [message, setMessage] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // 处理侧边栏展开状态变化
  const handleSidebarExpandChange = (expanded: boolean) => {
    setSidebarExpanded(expanded);
  };

  // 加载对话历史
  useEffect(() => {
    if (id) {
      loadConversationHistory(id);
    }
  }, [id, loadConversationHistory]);

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  // 处理消息发送
  const handleSendMessage = async () => {
    if (!message.trim() && !uploadedFile) return;
    
    // 构建上下文（如果有上传的文件）
    let context = '';
    if (uploadedFile) {
      context = JSON.stringify({
        type: 'file',
        data: uploadedFile
      });
    }
    
    await sendMessage(message, context);
    setMessage('');
    setUploadedFile(null);
  };

  // 处理按键事件（Enter发送消息）
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理文件上传成功
  const handleFileUploaded = (fileData: any) => {
    setUploadedFile(fileData);
    setShowFileUpload(false);
    setErrorMessage(null);
    
    // 添加到上传文件列表
    setUploadedFiles(prev => [fileData, ...prev]);
    
    // 自动填充消息，提示用户基于上传的文件提问
    setMessage(`请基于我上传的${fileData.title}进行分析`);
  };

  // 处理上传错误
  const handleUploadError = (error: string) => {
    setErrorMessage(error);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 侧边栏 */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversation?.id || null}
        onSelectConversation={selectConversation}
        onCreateNewConversation={createNewConversation}
        onExpandChange={handleSidebarExpandChange}
      />
      
      {/* 主内容区域 */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarExpanded ? 'ml-64' : 'ml-16'}`}>
        {/* 聊天区域 */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6"
        >
          {currentConversation?.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mb-4"
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
              <p className="text-xl font-medium">开始一个新对话</p>
              <p className="mt-2 text-center max-w-md">
                你可以向AI提问任何问题，或者上传论文/博客进行分析
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {currentConversation?.messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChatMessage message={msg} />
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* 错误提示 */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-6"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{errorMessage}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      onClick={() => setErrorMessage(null)}
                      className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-200 focus:outline-none"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 文件上传区域 */}
        <AnimatePresence>
          {showFileUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mb-4 overflow-hidden"
            >
              <FileUpload
                onFileUploaded={handleFileUploaded}
                onError={handleUploadError}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 上传文件列表 */}
        {uploadedFiles.length > 0 && (
          <div className="mx-6 mb-4">
            <h3 className="text-lg font-medium text-gray-700 mb-2">已上传文件</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {uploadedFiles.map((file, index) => (
                <div 
                  key={index} 
                  className={`p-3 flex items-start ${index !== 0 ? 'border-t border-gray-200' : ''}`}
                >
                  <div className="flex-shrink-0 mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-800">
                      {file.title}
                    </h4>
                    {file.author && (
                      <p className="text-xs text-gray-600 mt-1">
                        作者: {file.author}
                      </p>
                    )}
                    {file.abstract && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        摘要: {file.abstract}
                      </p>
                    )}
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setUploadedFile(file);
                          setMessage(`请基于我上传的${file.title}进行分析`);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 mr-3"
                      >
                        使用此文件提问
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 上传的文件信息 */}
        <AnimatePresence>
          {uploadedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-6 mb-4 flex items-start"
            >
              <div className="flex-shrink-0 mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-800">
                  {uploadedFile.title}
                </h4>
                {uploadedFile.author && (
                  <p className="text-xs text-blue-600 mt-1">
                    作者: {uploadedFile.author}
                  </p>
                )}
                {uploadedFile.abstract && (
                  <p className="text-xs text-blue-600 mt-1 line-clamp-2">
                    摘要: {uploadedFile.abstract}
                  </p>
                )}
              </div>
              <button
                onClick={() => setUploadedFile(null)}
                className="text-blue-500 hover:text-blue-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 输入区域 */}
        <div className="bg-white border-t border-gray-200 p-4 mx-6 mb-6 rounded-lg shadow-md">
          <div className="flex items-end">
            <button
              onClick={() => setShowFileUpload(!showFileUpload)}
              className="p-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>
            <div className="flex-1 mx-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={(!message.trim() && !uploadedFile) || isLoading}
              className={`p-2 rounded-full ${
                (!message.trim() && !uploadedFile) || isLoading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } transition-colors`}
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5"
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
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            按 Enter 发送，Shift + Enter 换行
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
