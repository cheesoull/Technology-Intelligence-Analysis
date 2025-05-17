import React from 'react';
import { exportToMarkdown } from '../utils/exportToMarkdown';
import exportMarkdownToPDF from '../utils/exportToPDF';

interface ExportButtonProps {
  content: string;
  filename: string;
  type: 'markdown' | 'pdf';
  className?: string;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  content,
  filename,
  type,
  className = '',
  disabled = false,
}) => {
  // 处理导出
  const handleExport = async () => {
    try {
      if (type === 'markdown') {
        exportToMarkdown(content, filename);
      } else if (type === 'pdf') {
        await exportMarkdownToPDF(content, filename);
      }
    } catch (error) {
      console.error(`导出${type === 'markdown' ? 'Markdown' : 'PDF'}失败:`, error);
      alert(`导出${type === 'markdown' ? 'Markdown' : 'PDF'}失败，请稍后重试`);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || !content}
      className={`px-4 py-2 rounded-md flex items-center justify-center transition-colors ${
        disabled || !content
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : type === 'markdown'
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-red-600 text-white hover:bg-red-700'
      } ${className}`}
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
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      导出{type === 'markdown' ? 'Markdown' : 'PDF'}
    </button>
  );
};

export default ExportButton;
