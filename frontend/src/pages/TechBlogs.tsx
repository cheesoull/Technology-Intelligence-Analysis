import React, { useState, useEffect } from 'react';
import { List, Card, Input, Spin, Empty, Pagination, Tag } from 'antd';
import { SearchOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { API } from '../api';

interface TechBlog {
  id: number;
  title: string;
  author: string;
  abstract: string;
  content: string;
  keywords: string[];
  fullText: string;
  uploadDate: string;
  islabeled: boolean;
  filePath: string;
}

const TechBlogs: React.FC = () => {
  const [blogs, setBlogs] = useState<TechBlog[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [fromAIChat, setFromAIChat] = useState(false);
  const pageSize = 10;

  const fetchBlogs = async (currentPage = page) => {
    setLoading(true);
    try {
      console.log('正在获取技术博客列表...');
      const response = await API.blogs.list(currentPage, pageSize);
      
      console.log('获取到技术博客数据:', response);
      
      if (Array.isArray(response)) {
        setBlogs(response);
        setTotal(response.length);
      } else if (response.data && Array.isArray(response.data)) {
        setBlogs(response.data);
        setTotal(response.total || response.data.length);
      } else if (response.blogs && Array.isArray(response.blogs)) {
        setBlogs(response.blogs);
        setTotal(response.total || response.blogs.length);
      } else {
        console.error('技术博客数据格式不符合预期:', response);
        setBlogs([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('获取技术博客列表失败:', error);
      setBlogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const returnToAIChat = localStorage.getItem('returnToAIChat');
    if (returnToAIChat === 'true') {
      setFromAIChat(true);
    }
    
    fetchBlogs();
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchBlogs(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchBlogs(newPage);
  };

  return (
    <div className="tech-blogs-container px-8 py-5">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">技术博客</h1>
        <div className="flex">
          <Input
            placeholder="搜索技术博客关键词"
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
        <div className="flex justify-center items-center h-80">
          <Spin size="large" />
        </div>
      ) : blogs.length > 0 ? (
        <>
          <div style={{ height: 650, overflowY: 'auto', marginBottom: 24 }}>
            <List
              grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
              dataSource={blogs}
              renderItem={(blog) => (
                <List.Item>
                  <Card 
                    className="w-full hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                    onClick={() => {
                      if (fromAIChat) {
                        localStorage.setItem('selectedPaperForAIChat', blog.id.toString());
                        localStorage.setItem('selectedPaperTitleForAIChat', blog.title);
                        localStorage.setItem('selectedContentTypeForAIChat', 'blog');
                        window.location.href = '/ai-chat';
                      } else {
                      }
                    }}
                  >
                    <h2 className="text-lg font-semibold mb-2">{blog.title}</h2>
                    <div className="flex items-center text-gray-500 mb-3">
                      <UserOutlined className="mr-1" />
                      <span className="mr-4">{blog.author}</span>
                      <ClockCircleOutlined className="mr-1" />
                      <span className="mr-4">{blog.uploadDate}</span>
                    </div>
                    <p className="text-gray-700 mb-3">{blog.abstract}</p>
                    <div className="flex flex-wrap">
                      {blog.keywords && Array.isArray(blog.keywords) ? (
                        blog.keywords.map(tag => (
                          <Tag key={tag} color="blue" className="mr-2 mb-2">{tag}</Tag>
                        ))
                      ) : null}
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </div>
          <div className="flex justify-center">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </>
      ) : (
        <Empty description="暂无技术博客" />
      )}
    </div>
  );
};

export default TechBlogs;
