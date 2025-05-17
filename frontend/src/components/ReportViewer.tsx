import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { exportToMarkdown } from '../utils/exportToMarkdown';
import exportMarkdownToPDF from '../utils/exportToPDF';

interface ReportViewerProps {
  content: string;
  title: string;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ content, title }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  // 导出为Markdown
  const handleExportMarkdown = () => {
    exportToMarkdown(content, title);
  };

  // 导出为PDF
  const handleExportPDF = async () => {
    if (reportRef.current) {
      try {
        await exportMarkdownToPDF(content, title);
      } catch (error) {
        console.error('导出PDF失败:', error);
        alert('导出PDF失败，请稍后重试');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title || 'AI报告'}</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleExportMarkdown}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
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
            导出Markdown
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
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
            导出PDF
          </button>
        </div>
      </div>
      
      <div 
        ref={reportRef}
        className="prose max-w-none dark:prose-invert border rounded-lg p-6 bg-gray-50"
      >
        <ReactMarkdown>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ReportViewer;
