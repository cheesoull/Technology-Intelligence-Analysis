import React, { useEffect, useState, useRef } from 'react';
import { Typography, Spin, Input, Select, Button, message, Checkbox, Tag } from 'antd';
import { Paper } from '../types/paper';
import { ApiResult } from '../types/api';
import {
  SearchOutlined,
  StarOutlined,
  StarFilled,
  ArrowUpOutlined,
  UserOutlined,
  DownOutlined
} from '@ant-design/icons';
import { getPaperList, getPaperDetails } from '../services/paperService';
import { useNavigate } from 'react-router-dom';
import '../styles/custom.css';

const { Title } = Typography;
const { Option } = Select;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const paperListRef = useRef<HTMLDivElement>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [searching, setSearching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [processingFavorite, setProcessingFavorite] = useState(false);
  
  // 新增筛选条件
  const [filterRecentYears, setFilterRecentYears] = useState(false); // 近两年
  const [filterCitationCount, setFilterCitationCount] = useState(false); // 引用次数不为0

  // 获取论文列表数据
  const fetchPapers = async (page = 1, paperSize = 20, keywords: string[] = [], isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
      }

      // 将页码转换为API所需格式（从0开始）
      const apiPage = page - 1;

      // 使用固定关键词获取LLM和AI相关论文
      const searchKeywords = keywords.length > 0 ? keywords : ['LLM', 'AI'];
      console.log('使用关键词获取论文:', searchKeywords);

      // 获取更多论文数据
      const paperLimit = paperSize; // 已修改为20篇

      // 使用AMiner API获取真实论文数据
      let result: ApiResult;
      try {
        result = await getPaperList(apiPage, paperLimit, searchKeywords);
      } catch (error) {
        console.error('API请求失败，使用模拟数据:', error);
        // 使用模拟数据
        result = {
          code: 0,
          message: 'success',
          data: [
            {
              paper_id: 'mock_1',
              title: '大型语言模型的最新进展',
              abstract: '本文综述了大型语言模型的最新研究进展，包括模型架构、训练方法和应用场景等方面。',
              authors: ['张三', '李四', '王五'],
              year: 2023,
              keywords: ['LLM', '自然语言处理', '人工智能'],
              url: 'https://example.com/paper1',
              category: '人工智能',
              citationCount: 120,
              referenceCount: 45,
              references: [],
              citations: [],
              createdAt: new Date()
            },
            {
              paper_id: 'mock_2',
              title: '基于Transformer的多模态学习',
              abstract: '本文提出了一种基于Transformer架构的多模态学习方法，能够有效融合文本、图像和音频等多种模态的信息。',
              authors: ['赵六', '钱七'],
              year: 2022,
              keywords: ['多模态学习', 'Transformer', '深度学习'],
              url: 'https://example.com/paper2',
              category: '计算机视觉',
              citationCount: 85,
              referenceCount: 32,
              references: [],
              citations: [],
              createdAt: new Date()
            }
          ],
          total: 2
        };
      }

      // 检查返回的数据结构，处理不同的响应格式
      console.log('获取到的论文数据:', result);

      let newPapers: Paper[] = [];

      // 处理 {papers, total} 格式
      if ('papers' in result && Array.isArray(result.papers)) {
        console.log('成功解析论文数据（papers格式），数量:', result.papers.length);
        newPapers = result.papers;
        setTotal(result.total || 0);
      } 
      // 处理 {data, total} 格式
      else if ('data' in result && Array.isArray(result.data)) {
        console.log('成功解析论文数据（data格式），数量:', result.data.length);
        newPapers = result.data;
        setTotal(result.total || 0);
      } 
      // 处理直接返回数组的格式
      else if (Array.isArray(result)) {
        console.log('成功解析论文数据（数组格式），数量:', result.length);
        newPapers = result;
        setTotal(result.length);
      } 
      // 处理无数据的情况
      else {
        console.warn('无法识别的数据格式或无数据');
        if (!isLoadMore) {
          message.info('未找到相关论文');
        }
      }

      // 获取论文详细信息
      try {
        // 提取所有论文ID
        const paperIds = newPapers
          .filter(paper => paper.paper_id)
          .map(paper => paper.paper_id as string);

        if (paperIds.length > 0) {
          console.log('尝试获取论文详细信息，论文ID数量:', paperIds.length);
          const detailedPapers = await getPaperDetails(paperIds);

          if (detailedPapers.length > 0) {
            console.log('成功获取论文详细信息，数量:', detailedPapers.length);

            // 将详细信息合并到论文列表中
            const paperMap = new Map<string, Paper>();
            detailedPapers.forEach(paper => {
              if (paper.paper_id) {
                paperMap.set(paper.paper_id, paper);
              }
            });

            // 更新论文信息
            newPapers = newPapers.map(paper => {
              if (paper.paper_id && paperMap.has(paper.paper_id)) {
                const detailedPaper = paperMap.get(paper.paper_id)!;
                return {
                  ...paper,
                  authors: detailedPaper.authors || paper.authors,
                  abstract: detailedPaper.abstract || paper.abstract,
                  keywords: detailedPaper.keywords || paper.keywords,
                  year: detailedPaper.year || paper.year
                };
              }
              return paper;
            });
          }
        }
      } catch (error) {
        console.error('获取论文详细信息失败:', error);
      }

      // 更新论文列表
      if (isLoadMore) {
        setPapers(prev => [...prev, ...newPapers]);
      } else {
        setPapers(newPapers);
      }

      // 如果没有论文数据，显示提示
      if (newPapers.length === 0 && !isLoadMore) {
        message.info('未找到相关论文');
      }

      // 更新是否有更多数据
      setHasMore(newPapers.length === paperLimit);
    } catch (error) {
      console.error('获取论文列表失败:', error);
      if (!isLoadMore) {
        setError('获取论文列表失败，请稍后重试');
      }
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // 加载更多论文
  const loadMorePapers = () => {
    if (!hasMore || loading) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchPapers(nextPage, pageSize, searchKeyword ? searchKeyword.split(/\s+/).filter(k => k.trim().length > 0) : [], true);
  };

  // 监听滚动事件，实现无限滚动
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 200 && !loading && hasMore) {
      loadMorePapers();
    }
  };

  // 回到顶部
  const scrollToTop = () => {
    if (paperListRef.current) {
      paperListRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // 检查用户是否登录
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<{username?: string} | null>(null);

  // 检查登录状态
  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    const userInfoStr = localStorage.getItem('userInfo');
    
    if (token && userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        setIsLoggedIn(true);
        setUserInfo(userInfo);
      } catch (e) {
        console.error('解析用户信息失败:', e);
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  };

  // 跳转到登录页面
  const goToLogin = () => {
    navigate('/login');
  };

  // 初始化
  useEffect(() => {
    // 检查登录状态
    checkLoginStatus();
    
    // 从本地存储加载收藏列表
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      try {
        const favoritesArray = JSON.parse(savedFavorites);
        setFavorites(new Set(favoritesArray));
      } catch (e) {
        console.error('解析收藏列表失败:', e);
      }
    }

    // 确保使用默认关键词获取数据
    fetchPapers(1, pageSize, ['AI', 'LLM']);
  }, []);

  // 处理搜索
  const handleSearch = () => {
    if (!searchKeyword.trim()) {
      message.info('请输入搜索关键词');
      return;
    }

    setSearching(true);
    setCurrentPage(1); // 重置到第一页
    setHasMore(true); // 重置加载更多状态
    const keywords = searchKeyword.split(/[,\s]+/).filter(k => k);
    fetchPapers(1, 20, keywords).finally(() => {
      setSearching(false);
    });
  };

  // 处理论文点击
  const handlePaperClick = (paper: Paper) => {
    if (paper.paper_id) {
      navigate(`/paper/${paper.paper_id}`);
    } else {
      message.error('论文ID不存在，无法查看详情');
    }
  };

  // 保存收藏列表到本地存储
  const saveFavoritesToStorage = (favorites: Set<string>) => {
    localStorage.setItem('favorites', JSON.stringify([...favorites]));
  };

  // 处理收藏点击
  const handleFavoriteClick = (e: React.MouseEvent, paperId: string) => {
    e.stopPropagation(); // 阻止事件冒泡

    // 防止重复点击
    if (processingFavorite) return;

    setProcessingFavorite(true);

    // 更新收藏状态
    const isFavorited = favorites.has(paperId);
    const newFavorites = new Set(favorites);

    if (isFavorited) {
      newFavorites.delete(paperId);
      message.success('已取消收藏');
    } else {
      newFavorites.add(paperId);
      message.success('已添加到收藏');
    }

    // 更新状态
    setFavorites(newFavorites);
    saveFavoritesToStorage(newFavorites);

    // 将收藏数量发送到 MainLayout 组件
    const event = new CustomEvent('updateFavoriteCount', {
      detail: { count: newFavorites.size }
    });
    window.dispatchEvent(event);

    // 重置处理状态
    setTimeout(() => {
      setProcessingFavorite(false);
    }, 300);
  };

  // 初始化时更新收藏数量
  useEffect(() => {
    const event = new CustomEvent('updateFavoriteCount', {
      detail: { count: favorites.size }
    });
    window.dispatchEvent(event);
    
    // 监听登录状态变化
    const handleLoginStatusChange = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('loginStatusChanged', handleLoginStatusChange);
    
    return () => {
      window.removeEventListener('loginStatusChanged', handleLoginStatusChange);
    };
  }, []);

  // 加载中状态
  if (loading && papers.length === 0) {
    return (
      <div className="text-center p-[50px]">
        <Spin size="large" />
      </div>
    );
  }

  // 错误状态
  if (error && papers.length === 0) {
    return (
      <div className="text-center p-[50px]">
        <Title level={4} type="danger">{error}</Title>
      </div>
    );
  }

  return (
    <>
      <div className="w-full pt-[84px] bg-white">
        <div className="w-full max-w-[1600px] mx-auto relative">
          {/* 搜索区域 - 圆角输入框样式 */}
          <div className="w-[90%] max-w-[1000px] mx-auto mb-8 mt-4">
            <div className="flex items-center relative p-1 rounded-full border-2 border-blue-200 bg-white shadow-md">
              {/* 搜索输入框 */}
              <div className="flex-1 ml-4">
                <Input
                  placeholder="输入关键词"
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  onPressEnter={handleSearch}
                  prefix={<SearchOutlined className="text-gray-400" />}
                  className="w-full h-[40px] border-0 focus:border-0 hover:border-0 shadow-none"
                  style={{ boxShadow: 'none' }}
                />
              </div>

              {/* 搜索类型选择 */}
              <div className="mr-2">
                <Select
                  defaultValue="all"
                  value={searchType}
                  onChange={value => setSearchType(value)}
                  className="w-[100px] border-0"
                  bordered={false}
                  dropdownMatchSelectWidth={false}
                >
                  <Option value="all">全部</Option>
                  <Option value="title">标题</Option>
                  <Option value="author">作者</Option>
                  <Option value="keyword">关键词</Option>
                </Select>
              </div>

              {/* 搜索按钮 */}
              <div>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  loading={searching}
                  onClick={handleSearch}
                  className="h-[40px] w-[80px] flex items-center justify-center rounded-full"
                  style={{ backgroundColor: '#4285F4', borderColor: '#4285F4' }}
                >
                  搜索
                </Button>
              </div>
            </div>
            
            {/* 推荐区域 - 蓝色背景 */}
            <div className="p-4 bg-blue-50 rounded-b-lg">
              <div className="flex items-center mb-2">
                <span className="text-blue-800 font-medium mr-2">热门关键词:</span>
                <div className="flex flex-wrap gap-2">
                  {['LLM', 'GPT', '深度学习', '强化学习', 'Transformer'].map(tag => (
                    <Tag
                      key={tag}
                      color="blue"
                      className="cursor-pointer"
                      onClick={() => {
                        setSearchKeyword(tag);
                        handleSearch();
                      }}
                    >
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-blue-800 font-medium mr-2">排序方式:</span>
                  <div className="flex gap-2">
                    <Button size="small" type="link" className="text-blue-600 flex items-center">
                      引用量 <DownOutlined className="ml-1 text-xs" />
                    </Button>
                    <Button size="small" type="link" className="text-blue-600 flex items-center">
                      发表时间 <ArrowUpOutlined className="ml-1 text-xs" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 移除了用户登录/注册区域 */}
          
          {/* 论文列表区域 */}
          <div className="w-[98%] mx-auto bg-white rounded-lg">
            <div
              className="p-5 min-h-[calc(100vh-280px)] rounded-lg overflow-y-auto"
              style={{ backgroundColor: '#E3F2FD' }}
              ref={paperListRef}
              onScroll={handleScroll}
            >
              {/* 论文列表 */}
              <div className="grid grid-cols-1 gap-4 relative">
                {papers
                  .filter(paper => {
                    // 应用筛选条件
                    let passFilter = true;
                    
                    // 近两年筛选
                    if (filterRecentYears && paper.year) {
                      const currentYear = new Date().getFullYear();
                      passFilter = passFilter && (paper.year >= currentYear - 2);
                    }
                    
                    // 引用次数筛选
                    if (filterCitationCount) {
                      passFilter = passFilter && (paper.citationCount > 0);
                    }
                    
                    return passFilter;
                  })
                  .map((paper, index) => (
                  <div
                    key={paper.paper_id || index}
                    className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handlePaperClick(paper)}
                  >
                    <div className="flex justify-between">
                      <h3 className="text-lg font-medium text-blue-900 mb-2">{paper.title}</h3>
                      <div 
                        className="text-xl cursor-pointer" 
                        onClick={(e) => paper.paper_id && handleFavoriteClick(e, paper.paper_id)}
                      >
                        {paper.paper_id && favorites.has(paper.paper_id) ? (
                          <StarFilled className="text-yellow-500" />
                        ) : (
                          <StarOutlined className="text-gray-400 hover:text-yellow-500" />
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2 line-clamp-2">{paper.abstract}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {paper.keywords && paper.keywords.map(keyword => (
                        <Tag key={keyword} color="blue">{keyword}</Tag>
                      ))}
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <div className="flex-1">
                        <span>作者: </span>
                        <span className="text-blue-600">
                          {paper.authors && paper.authors.length > 0
                            ? paper.authors.slice(0, 3).join(', ') + (paper.authors.length > 3 ? ' 等' : '')
                            : '未知作者'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="mr-4 text-right">
                          <span>发表年份: </span>
                          <span className="text-blue-600 inline-block w-12 text-right">{paper.year || '未知'}</span>
                        </div>
                        <div className="text-right">
                          <span>引用量: </span>
                          <span className="text-blue-600 inline-block w-8 text-right">{paper.citationCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 加载更多指示器 */}
                {loading && papers.length > 0 && (
                  <div className="text-center py-4">
                    <Spin size="small" />
                    <span className="ml-2 text-gray-500">加载更多...</span>
                  </div>
                )}

                {/* 回到顶部按钮 */}
                {papers.length > 5 && (
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<ArrowUpOutlined />}
                    size="large"
                    className="fixed bottom-8 right-8 shadow-lg"
                    onClick={scrollToTop}
                    style={{ backgroundColor: '#0D47A1', borderColor: '#0D47A1' }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
