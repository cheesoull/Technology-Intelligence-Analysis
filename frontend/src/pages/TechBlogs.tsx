import React, { useState, useEffect } from 'react';
import { List, Card, Input, Spin, Empty, Pagination, Tag } from 'antd';
import { SearchOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

interface TechBlog {
  _id: string;
  title: string;
  author: string;
  summary: string;
  content?: string;
  publishDate: string;
  tags: string[];
  url?: string;
  readTime?: number;
}

// 模拟数据，实际项目中应从API获取
const mockTechBlogs: TechBlog[] = [
  {
    _id: '1',
    title: '深度学习在自然语言处理中的应用',
    author: '张三',
    summary: '本文介绍了深度学习技术如何应用于自然语言处理领域，包括Transformer架构和BERT模型的详细解析。',
    publishDate: '2025-04-15',
    tags: ['深度学习', 'NLP', 'Transformer'],
    readTime: 8
  },
  {
    _id: '2',
    title: 'React 18新特性详解',
    author: '李四',
    summary: '详细介绍React 18带来的并发渲染、自动批处理和Suspense等新特性，以及如何在项目中应用这些特性提升性能。',
    publishDate: '2025-05-01',
    tags: ['React', '前端', 'JavaScript'],
    readTime: 6
  },
  {
    _id: '3',
    title: '大规模分布式系统设计原则',
    author: '王五',
    summary: '探讨构建可靠、可扩展的分布式系统的核心原则，包括一致性、可用性和分区容错性之间的权衡。',
    publishDate: '2025-04-20',
    tags: ['分布式系统', '系统设计', '可扩展性'],
    readTime: 10
  },
  {
    _id: '4',
    title: 'TypeScript高级类型系统详解',
    author: '赵六',
    summary: '深入探讨TypeScript的类型系统，包括条件类型、映射类型和类型推断机制，帮助开发者编写更健壮的代码。',
    publishDate: '2025-05-10',
    tags: ['TypeScript', '前端', '类型系统'],
    readTime: 7
  },
  {
    _id: '5',
    title: '机器学习模型部署最佳实践',
    author: '孙七',
    summary: '介绍将机器学习模型从研发环境部署到生产环境的最佳实践，包括模型服务化、版本控制和性能监控。',
    publishDate: '2025-04-25',
    tags: ['机器学习', '模型部署', 'MLOps'],
    readTime: 9
  }
];

const TechBlogs: React.FC = () => {
  const [blogs, setBlogs] = useState<TechBlog[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchBlogs = async (searchKeyword = keyword, currentPage = page) => {
    try {
      setLoading(true);
      
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟搜索功能
      const filteredBlogs = mockTechBlogs.filter(blog => 
        blog.title.toLowerCase().includes(searchKeyword.toLowerCase()) || 
        blog.summary.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        blog.tags.some(tag => tag.toLowerCase().includes(searchKeyword.toLowerCase()))
      );
      
      setBlogs(filteredBlogs);
      setTotal(filteredBlogs.length);
      
      // 实际项目中应使用真实API
      // const response = await axios.get('/api/tech-blogs', {
      //   params: {
      //     keyword: searchKeyword,
      //     page: currentPage,
      //     size: pageSize
      //   }
      // });
      // 
      // if (response.data.code === 200 && Array.isArray(response.data.data)) {
      //   setBlogs(response.data.data);
      //   setTotal(response.data.total || response.data.data.length);
      // } else {
      //   setBlogs([]);
      //   setTotal(0);
      // }
    } catch (error) {
      console.error('获取技术博客列表失败:', error);
      setBlogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchBlogs(keyword, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchBlogs(keyword, newPage);
  };

  return (
    <div className="tech-blogs-container">
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
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : blogs.length > 0 ? (
        <>
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
            dataSource={blogs}
            renderItem={(blog) => (
              <List.Item>
                <Card 
                  className="w-full hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  onClick={() => {
                    // 实际项目中应导航到博客详情页
                    console.log(`查看博客: ${blog._id}`);
                  }}
                >
                  <h2 className="text-lg font-semibold mb-2">{blog.title}</h2>
                  <div className="flex items-center text-gray-500 mb-3">
                    <UserOutlined className="mr-1" />
                    <span className="mr-4">{blog.author}</span>
                    <ClockCircleOutlined className="mr-1" />
                    <span className="mr-4">{blog.publishDate}</span>
                    {blog.readTime && (
                      <span>阅读时间: {blog.readTime} 分钟</span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3">{blog.summary}</p>
                  <div className="flex flex-wrap">
                    {blog.tags.map(tag => (
                      <Tag color="blue" key={tag} className="mr-1 mb-1">
                        {tag}
                      </Tag>
                    ))}
                  </div>
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
        <Empty description="暂无技术博客数据" />
      )}
    </div>
  );
};

export default TechBlogs;
