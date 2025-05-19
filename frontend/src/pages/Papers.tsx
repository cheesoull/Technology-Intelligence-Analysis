import React, { useState, useEffect } from 'react';
import { List, Card, Input, Spin, Empty, Pagination } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { API } from '../api';

interface Paper {
  id: number; 
  _id?: string; 
  title: string;
  author: string; 
  abstract: string; 
  content: string; 
  fullText: string; 
  uploadDate: string; 
  islabeled: boolean; 
  filePath: string; 
}

const Papers: React.FC = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [fromAIChat, setFromAIChat] = useState(false);
  const pageSize = 10;


  const fetchPapers = async (currentPage = page) => {
    try {
      setLoading(true);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时，使用模拟数据')), 10000);
      });
      
      const response = await Promise.race([
        API.papers.list(currentPage, pageSize),
        timeoutPromise
      ]);

      if (response && response.data && Array.isArray(response.data)) {
        setPapers(response.data);
        setTotal(response.total || 0);
      } else if (Array.isArray(response)) {
        setPapers(response);
        setTotal(response.length);
      } else {
        console.error('论文数据格式不符合预期:', response);
        setPapers([]);
        setTotal(0);
      }
    } catch (error: any) { 
      console.error('获取论文列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const returnToAIChat = localStorage.getItem('returnToAIChat');
    if (returnToAIChat === 'true') {
      setFromAIChat(true);
    }
    
    fetchPapers();
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchPapers(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchPapers(newPage);
  };

  return (
    <div className="papers-container px-8 py-5">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">论文列表</h1>
        <div className="flex">
          <Input
            placeholder="搜索论文关键词"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined />}
            className="w-full max-w-md"
          />
          <button
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSearch}
          >
            搜索
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : papers.length > 0 ? (
        <>
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
            dataSource={papers}
            renderItem={(paper) => (
              <List.Item>
                <Card 
                  className="w-full hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  onClick={() => {
                    const paperId = paper.id ? paper.id.toString() : (paper._id || '');
                    
                    if (fromAIChat) {
                      localStorage.setItem('selectedPaperForAIChat', paperId);
                      localStorage.setItem('selectedPaperTitleForAIChat', paper.title);
                      localStorage.setItem('selectedContentTypeForAIChat', 'paper');
                      window.location.href = '/ai-chat';
                    } else {
                      window.location.href = `/papers/${paperId}`;
                    }
                  }}
                >
                  <h2 className="text-lg font-semibold mb-2">{paper.title}</h2>
                  <p className="text-gray-600 mb-2">
                    {paper.author || '作者暂无'}
                  </p>
                  {paper.uploadDate && (
                    <p className="text-gray-500 mb-2">上传日期: {new Date(paper.uploadDate).toLocaleDateString()}</p>
                  )}
                  {paper.abstract && (
                    <p className="text-gray-700 line-clamp-2">{paper.abstract}</p>
                  )}
                </Card>
              </List.Item>
            )}
          />
          <div className="mt-6 flex justify-center">
            <Pagination
              current={page}
              total={total}
              pageSize={pageSize}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </>
      ) : (
        <Empty description="暂无论文数据" />
      )}
    </div>
  );
};

export default Papers;
