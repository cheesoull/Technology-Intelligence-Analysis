import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Conversation } from '../hooks/useChat';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateNewConversation: () => void;
  onExpandChange?: (expanded: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateNewConversation,
  onExpandChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  // 处理鼠标进入事件
  const handleMouseEnter = () => {
    setIsExpanded(true);
    onExpandChange?.(true);
  };

  // 处理鼠标离开事件
  const handleMouseLeave = () => {
    setIsExpanded(false);
    onExpandChange?.(false);
  };

  // 处理对话选择
  const handleConversationClick = (id: string) => {
    onSelectConversation(id);
    navigate(`/chat/${id}`);
  };

  // 处理新建对话
  const handleNewConversation = () => {
    onCreateNewConversation();
    navigate('/chat');
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-10 ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">
        {/* 侧边栏标题 */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-center">
          {isExpanded ? (
            <h2 className="text-xl font-semibold">AI对话系统</h2>
          ) : (
            <span className="text-xl">AI</span>
          )}
        </div>

        {/* 新建对话按钮 */}
        <button
          onClick={handleNewConversation}
          className="m-4 p-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center"
        >
          {isExpanded ? (
            <span>新建对话</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>

        {/* 对话列表 */}
        <div className="flex-1 overflow-y-auto py-2">
          {conversations.length === 0 ? (
            <div className="text-center text-gray-500 p-4">
              {isExpanded ? '暂无对话历史' : ''}
            </div>
          ) : (
            <ul>
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    onClick={() => handleConversationClick(conversation.id)}
                    className={`w-full text-left p-3 ${
                      currentConversationId === conversation.id
                        ? 'bg-blue-800'
                        : 'hover:bg-gray-800'
                    } transition-colors truncate ${isExpanded ? '' : 'justify-center'} flex items-center`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    {isExpanded && (
                      <span className="truncate">{conversation.title}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 底部导航 */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => navigate('/report')}
            className="w-full p-2 text-left hover:bg-gray-800 rounded-md transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isExpanded && <span>报告预览</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
