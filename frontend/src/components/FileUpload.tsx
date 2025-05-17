import React, { useState, useRef, ChangeEvent } from 'react';
import { API } from '../api';

interface FileUploadProps {
  onFileUploaded: (fileData: any) => void;
  onError: (error: string) => void;
}

type FileType = 'paper' | 'blog';

interface FileInfo {
  title: string;
  author: string;
  abstract: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, onError }) => {
  const [fileType, setFileType] = useState<FileType>('paper');
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo>({
    title: '',
    author: '',
    abstract: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        onError('只支持PDF文件上传');
        return;
      }
      setFile(selectedFile);
    }
  };

  // 处理文件类型切换
  const handleTypeChange = (type: FileType) => {
    setFileType(type);
  };

  // 处理表单字段变化
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFileInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 处理文件上传
  const handleUpload = async () => {
    if (!file) {
      onError('请选择文件');
      return;
    }

    if (!fileInfo.title.trim()) {
      onError('请输入标题');
      return;
    }

    try {
      setIsUploading(true);
      
      // 创建FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', fileInfo.title);
      formData.append('author', fileInfo.author);
      formData.append('abstract', fileInfo.abstract);

      // 根据文件类型选择上传接口
      const response = fileType === 'paper'
        ? await API.papers.upload(formData)
        : await API.blogs.upload(formData);

      // 上传成功后回调
      onFileUploaded(response);
      
      // 重置表单
      setFile(null);
      setFileInfo({
        title: '',
        author: '',
        abstract: '',
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : '文件上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  // 处理拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf') {
        onError('只支持PDF文件上传');
        return;
      }
      setFile(droppedFile);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* 文件类型选择 */}
      <div className="flex mb-4">
        <button
          className={`flex-1 py-2 px-4 rounded-l-lg ${
            fileType === 'paper'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } transition-colors`}
          onClick={() => handleTypeChange('paper')}
        >
          论文
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-r-lg ${
            fileType === 'blog'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } transition-colors`}
          onClick={() => handleTypeChange('blog')}
        >
          博客
        </button>
      </div>

      {/* 文件拖放区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : file
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-blue-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
        />
        {file ? (
          <div className="flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-green-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-sm text-gray-600">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-gray-400 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600">
              点击或拖放PDF文件至此处
            </p>
            <p className="text-xs text-gray-500">仅支持PDF格式</p>
          </div>
        )}
      </div>

      {/* 文件信息表单 */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={fileInfo.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`${fileType === 'paper' ? '论文' : '博客'}标题`}
            required
          />
        </div>
        <div>
          <label
            htmlFor="author"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            作者
          </label>
          <input
            type="text"
            id="author"
            name="author"
            value={fileInfo.author}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="作者姓名"
          />
        </div>
        <div>
          <label
            htmlFor="abstract"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            摘要
          </label>
          <textarea
            id="abstract"
            name="abstract"
            value={fileInfo.abstract}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="摘要内容"
          ></textarea>
        </div>
        <button
          onClick={handleUpload}
          disabled={isUploading || !file}
          className={`w-full py-2 px-4 rounded-md ${
            isUploading || !file
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } transition-colors`}
        >
          {isUploading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              上传中...
            </div>
          ) : (
            '上传文件'
          )}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
