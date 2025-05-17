import React, { useState, useEffect } from 'react';
import { List, Card, Input, Spin, Empty, Pagination } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';

interface Paper {
  _id: string;
  title: string;
  authors: Array<{name: string}>;
  abstract?: string;
  year?: number;
  venue?: string;
  url?: string;
}

const Papers: React.FC = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchPapers = async (searchKeyword = keyword, currentPage = page) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/paper/list', {
        params: {
          keyword: searchKeyword || 'AI',
          page: currentPage,
          size: pageSize
        }
      });

      if (response.data.code === 200 && Array.isArray(response.data.data)) {
        setPapers(response.data.data);
        setTotal(response.data.total || response.data.data.length);
      } else {
        setPapers([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('获取论文列表失败:', error);
      setPapers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchPapers(keyword, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchPapers(keyword, newPage);
  };

  return (
    <div className="papers-container">
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
                  className="w-full hover:shadow-lg transition-shadow duration-300"
                  onClick={() => window.location.href = `/paper/${paper._id}`}
                >
                  <h2 className="text-lg font-semibold mb-2">{paper.title}</h2>
                  <p className="text-gray-600 mb-2">
                    {paper.authors?.map(author => author.name).join(', ') || '作者暂无'}
                  </p>
                  {paper.venue && (
                    <p className="text-gray-500 mb-1">发表于: {paper.venue}</p>
                  )}
                  {paper.year && (
                    <p className="text-gray-500 mb-2">年份: {paper.year}</p>
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
