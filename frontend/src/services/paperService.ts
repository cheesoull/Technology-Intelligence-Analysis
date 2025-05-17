import { Paper } from '../types/paper';
import { ApiResult } from '../types/api';
import { getCache, setCache, generateCacheKey } from '../utils/cacheUtils';

// AMiner API 端点
const API_BASE_URL = 'https://datacenter.aminer.cn/gateway/open_platform';
const AMINER_API = {
  PAPER_INFO: `${API_BASE_URL}/api/paper/info`,               // 获取论文基本信息 (POST)
  PAPER_DETAIL: `${API_BASE_URL}/api/paper/detail`,           // 获取论文详情 (GET)
  PAPER_RELATION: `${API_BASE_URL}/api/paper/relation`,        // 获取论文引用关系 (GET)
  PAPER_SEARCH: `${API_BASE_URL}/api/paper/list/by/search/venue`, // 搜索论文 (GET)
  PAPER_BATCH: `${API_BASE_URL}/api/paper/batch`,             // 批量获取论文信息 (POST)
  PAPER_PDF: `${API_BASE_URL}/api/paper/pdf`                  // 获取论文PDF (GET)
};

// 添加请求头部
const API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDc0MTI2NTUsInRpbWVzdGFtcCI6MTc0Njk4MDY1OCwidXNlcl9pZCI6IjY3ZWUyZTM0NDliYWRiMGFjOTc4MGFmNiJ9.fMjzoN7Vs6OF0TgSU6ARbxazB3x1FSrG0MQeJoKLvho'
};

/**
 * 获取论文AI分析结果的接口
 */
export interface AIAnalysisResult {
  summary: string;
  keyPoints: string[];
  relatedFields: string[];
}

/**
 * 上传本地论文
 * @param file 论文PDF文件
 * @returns 上传后的论文信息
 */
export const uploadPaper = async (file: File): Promise<Paper> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/paper/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '上传论文失败');
    }
    
    const result = await response.json();
    console.log('上传论文成功:', result);
    
    // 处理新的响应格式，状态码为200
    if (result.code === 200 && result.data) {
      return result.data;
    } else if (result.code === 0) {
      // 兼容旧的响应格式
      if (result.data) {
        return result.data;
      } else {
        return result;
      }
    } else {
      // 如果有错误信息，抛出异常
      throw new Error(result.message || '上传论文失败');
    }
  } catch (error) {
    console.error('上传论文失败:', error);
    throw error;
  }
}

/**
 * 获取论文详细信息，包括作者信息
 * @param paperIds 论文ID数组
 * @returns 论文详细信息
 */
export const getPaperDetails = async (paperIds: string[]): Promise<Paper[]> => {
  if (!paperIds || paperIds.length === 0) {
    return [];
  }

  // 生成缓存键
  const cacheKey = `paper_details_${paperIds.join(',')}`;
  
  // 尝试从缓存中获取
  const cachedData = getCache<Paper[]>(cacheKey);
  if (cachedData) {
    console.log('从缓存中获取论文详细信息:', cachedData.length);
    return cachedData;
  }

  try {
    console.log('获取论文详细信息:', paperIds);
    
    // 使用AMiner API获取论文详细信息
    const response = await fetch(AMINER_API.PAPER_INFO, {
      method: 'POST',
      headers: {
        ...API_HEADERS,
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify({ ids: paperIds })
    });
    
    if (!response.ok) {
      console.error('获取论文详细信息失败:', response.status, response.statusText);
      return [];
    }
    
    const result = await response.json();
    console.log('获取论文详细信息结果:', result);
    
    // 处理API返回的数据
    let papers: Paper[] = [];
    
    // 支持不同的成功状态码，可能是 0 或 200
    if ((result.code === 0 || result.code === 200) && Array.isArray(result.data)) {
      papers = result.data.map((item: any) => {
        // 提取论文ID
        const paperId = item._id || '';
        
        // 处理作者数据
        let authors: string[] = [];
        if (item.authors && Array.isArray(item.authors)) {
          authors = item.authors.map((author: any) => {
            if (typeof author === 'string') return author;
            return author.name || author.name_zh || '';
          }).filter((name: string) => name.trim() !== '');
        }
        
        return {
          paper_id: paperId,
          title: item.title || '',
          authors: authors,
          year: item.year,
          venue: item.venue?.info?.name || item.venue?.raw || item.raw || '',
          abstract: item.abstract || '',
          keywords: item.keywords || [],
          url: item.url || `https://www.aminer.cn/pub/${paperId}`,
          citationCount: item.n_citation || 0,
          referenceCount: item.n_reference || 0,
          category: item.venue?.info?.name || '',
          createdAt: new Date(),
          references: [],
          citations: []
        };
      });
      
      // 缓存数据
      setCache(cacheKey, papers); // 使用默认缓存时间
    }
    
    return papers;
  } catch (error) {
    console.error('获取论文详细信息异常:', error);
    return [];
  }
};

/**
 * 根据ID获取论文详情
 */
export const getPaperById = async (id: string): Promise<Paper> => {
  // 生成缓存键
  const cacheKey = `paper_detail_${id}`;
  
  // 尝试从缓存中获取
  const cachedPaper = getCache<Paper>(cacheKey);
  if (cachedPaper) {
    console.log('从缓存中获取论文详情:', id);
    return cachedPaper;
  }
  
  // 如果是模拟数据请求，返回模拟数据
  if (id.startsWith('mock')) {
    console.log('返回模拟论文数据:', id);
    const mockPaper: Paper = {
      paper_id: id,
      title: id === 'mock1' ? '基于深度学习的图像识别研究' : '自然语言处理中的注意力机制研究',
      abstract: id === 'mock1' 
        ? '本文探讨了深度学习在图像识别领域的应用，提出了一种新的卷积神经网络模型，该模型在多个基准测试中表现优异。' 
        : '本研究分析了注意力机制在自然语言处理任务中的作用，并提出了一种改进的多头注意力模型，在机器翻译和文本摘要任务中取得了显著提升。',
      authors: id === 'mock1' ? ['张三', '李四', '王五'] : ['赵六', '钱七'],
      year: id === 'mock1' ? 2023 : 2022,
      keywords: id === 'mock1' ? ['深度学习', '图像识别', '卷积神经网络'] : ['自然语言处理', '注意力机制', 'Transformer'],
      category: '计算机科学',
      url: id === 'mock1' 
        ? 'https://example.com/papers/deep-learning-image-recognition' 
        : 'https://example.com/papers/attention-mechanism-nlp',
      citationCount: id === 'mock1' ? 42 : 28,
      referenceCount: id === 'mock1' ? 35 : 40,
      references: [],
      citations: [],
      createdAt: new Date(),
      venue: 'International Journal of Computer Science'
    };
    return mockPaper;
  }
  
  try {
    console.log('从 API 获取论文详情:', id);
    
    // 处理本地上传的论文（ID以local_开头）
    if (id.startsWith('local_')) {
      console.log('检测到本地论文ID，从后端获取详情:', id);
      const response = await fetch(`/api/paper/${id}`);
      
      if (!response.ok) {
        throw new Error('获取本地论文详情失败');
      }
      
      const result = await response.json();
      console.log('获取到本地论文数据:', result);
      
      if (result.code === 200 && result.data) {
        // 使用data字段中的论文数据
        const paper = result.data;
        
        // 缓存数据
        setCache(cacheKey, paper);
        
        return paper;
      } else if (result.code === 0 && !result.data) {
        // 兼容旧的响应格式，直接返回整个结果
        setCache(cacheKey, result);
        return result;
      } else if (result.data && result.data.code === 200 && result.data.data) {
        // 处理嵌套响应格式的情况
        const paper = result.data.data;
        setCache(cacheKey, paper);
        return paper;
      } else {
        throw new Error('响应格式不符合预期');
      }
    }
    
    // 先尝试使用详情API获取论文数据
    try {
      const response = await fetch(`${AMINER_API.PAPER_DETAIL}?id=${id}`, {
        method: 'GET',
        headers: API_HEADERS
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('使用PAPER_DETAIL API获取到的论文详情数据:', data);
        
        if (data && data.data) {
          const paperData = data.data;
          
          // 处理作者数据
          let authors: string[] = [];
          if (paperData.authors && Array.isArray(paperData.authors)) {
            authors = paperData.authors.map((author: any) => author.name || author.name_zh || '');
          } else if (paperData.authors && !Array.isArray(paperData.authors)) {
            authors = paperData.authors.split(',').map((author: string) => author.trim());
          }
          
          // 处理关键词
          let keywords: string[] = [];
          if (paperData.keywords) {
            if (Array.isArray(paperData.keywords)) {
              keywords = paperData.keywords;
            } else if (typeof paperData.keywords === 'string') {
              keywords = paperData.keywords.split(',').map((kw: string) => kw.trim());
            }
          }
          
          // 提取关键字段的详细日志
          console.log('论文关键词数据:', paperData.keywords);
          console.log('论文分类数据:', paperData.venue);
          console.log('论文引用数据:', paperData.n_citation);
          console.log('论文参考文献数据:', paperData.n_reference);
          
          // 处理分类信息
          let category = '未分类';
          if (paperData.venue) {
            if (typeof paperData.venue === 'string') {
              category = paperData.venue;
            } else if (paperData.venue.raw) {
              category = paperData.venue.raw;
            } else if (paperData.venue.info && paperData.venue.info.name) {
              category = paperData.venue.info.name;
            }
          }
          
          // 处理引用数和参考文献数
          const citationCount = typeof paperData.n_citation === 'number' ? paperData.n_citation : 0;
          const referenceCount = typeof paperData.n_reference === 'number' ? paperData.n_reference : 0;
          
          const paper: Paper = {
            paper_id: paperData._id || id,
            title: paperData.title || '未知标题',
            abstract: paperData.abstract || '暂无摘要',
            authors: authors,
            year: paperData.year || new Date().getFullYear(),
            keywords: keywords.length > 0 ? keywords : ['人工智能', '机器学习'],  // 提供默认关键词
            category: category,
            url: paperData.url || `https://www.aminer.cn/pub/${id}`,
            citationCount: citationCount,
            referenceCount: referenceCount,
            references: paperData.references || [],
            citations: paperData.citations || [],
            createdAt: new Date(),
            venue: typeof paperData.venue === 'string' ? paperData.venue : (paperData.venue?.raw || paperData.raw || '')
          };
          
          // 缓存数据
          setCache(cacheKey, paper);
          
          return paper;
        }
      }
    } catch (detailError) {
      console.warn('使用PAPER_DETAIL API获取论文详情失败:', detailError);
    }
    
    // 如果详情API失败，尝试使用批量获取API
    try {
      console.log('尝试使用批量获取API获取论文详情:', id);
      const detailedPapers = await getPaperDetails([id]);
      
      if (detailedPapers && detailedPapers.length > 0) {
        const paper = detailedPapers[0];
        console.log('使用批量获取API成功获取论文详情:', paper);
        
        // 缓存数据
        setCache(cacheKey, paper);
        
        return paper;
      } else {
        console.log('批量获取API返回的数据为空，使用增强版模拟数据');
        // 使用增强版模拟数据
        const pseudoRandom = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
        const mockPapers = [
          {
            title: 'Privacy and Security Challenges in Large Language Models',
            abstract: 'Large Language Models (LLMs) are at the forefront of artificial intelligence advancements, demonstrating exceptional capabilities in natural language understanding and generation across diverse domains such as healthcare, finance, and customer service. However, their deployment introduces substantial security and privacy risks, including prompt injection, data leakage, and unauthorized access to sensitive information.',
            authors: ['Alex Johnson', 'Maria Garcia', 'David Chen'],
            year: 2023,
            keywords: ['Artificial intelligence', 'Natural language processing', 'Large language models (LLM)'],
            citationCount: 42
          },
          {
            title: 'Correction: Unveiling the Evolution of Generative AI (GAI): a Comprehensive Survey',
            abstract: 'This paper provides a comprehensive survey of Generative AI (GAI), tracing its evolution from early statistical methods to modern deep learning approaches. We analyze key architectures, training methodologies, and application domains while highlighting ethical considerations and future research directions.',
            authors: ['Sarah Williams', 'James Lee', 'Emily Rodriguez'],
            year: 2024,
            keywords: ['Artificial intelligence (AI)', 'Computer vision', 'Deep learning (DL)'],
            citationCount: 38
          },
          {
            title: 'The Rise and Potential of Large Language Model Based Agents: A Comprehensive Survey',
            abstract: 'This survey examines the emerging field of LLM-based agents, which combine large language models with planning capabilities and tool use to solve complex tasks. We categorize agent architectures, analyze evaluation methodologies, and discuss challenges in reasoning, tool manipulation, and multi-agent collaboration.',
            authors: ['Michael Brown', 'Lisa Wang', 'Robert Taylor'],
            year: 2024,
            keywords: ['natural language processing', 'large language models', 'LLM-based agents'],
            citationCount: 56
          },
          {
            title: 'Action State Testing – A Model for Test Design Automation',
            abstract: 'Model-based testing (MBT) is essential in software testing, offering automation, comprehensive coverage, and defect prevention. This paper explores the action-state testing modeling technique for automated test design, representing system behavior through actions, responses, and states.',
            authors: ['Thomas Wilson', 'Jennifer Martinez', 'Daniel Kim'],
            year: 2023,
            keywords: ['Software testing', 'Model-based testing', 'Test automation'],
            citationCount: 29
          },
          {
            title: 'Towards Trustworthy AI: A Comprehensive Framework for Responsible Development',
            abstract: 'This paper proposes a holistic framework for developing trustworthy AI systems that addresses ethical considerations, bias mitigation, explainability, and robustness. We present case studies across healthcare, finance, and autonomous systems to demonstrate practical implementation strategies.',
            authors: ['Anna Patel', 'Carlos Mendez', 'Sophia Kim'],
            year: 2023,
            keywords: ['Artificial intelligence', 'Ethics', 'Responsible AI'],
            citationCount: 47
          }
        ];
        
        // 选择一个模拟论文
        const selectedMock = mockPapers[pseudoRandom];
        
        const mockPaper: Paper = {
          paper_id: id,
          title: selectedMock.title,
          abstract: selectedMock.abstract,
          authors: selectedMock.authors,
          year: selectedMock.year,
          keywords: selectedMock.keywords,
          category: '计算机科学',
          url: `https://www.aminer.cn/pub/${id}`,
          citationCount: selectedMock.citationCount,
          referenceCount: Math.floor(selectedMock.citationCount * 0.8),
          references: [],
          citations: [],
          createdAt: new Date(),
          venue: 'International Journal of Computer Science'
        };
        
        // 缓存模拟数据
        setCache(cacheKey, mockPaper);
        
        return mockPaper;
      }
    } catch (batchError) {
      console.warn('使用批量获取API获取论文详情失败:', batchError);
      
      // 如果批量获取API也失败，使用增强版模拟数据
      console.log('使用增强版模拟数据作为备选');
      const pseudoRandom = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
      const mockPapers = [
        {
          title: 'Privacy and Security Challenges in Large Language Models',
          abstract: 'Large Language Models (LLMs) are at the forefront of artificial intelligence advancements, demonstrating exceptional capabilities in natural language understanding and generation across diverse domains such as healthcare, finance, and customer service. However, their deployment introduces substantial security and privacy risks, including prompt injection, data leakage, and unauthorized access to sensitive information.',
          authors: ['Alex Johnson', 'Maria Garcia', 'David Chen'],
          year: 2023,
          keywords: ['Artificial intelligence', 'Natural language processing', 'Large language models (LLM)'],
          citationCount: 42
        },
        {
          title: 'Correction: Unveiling the Evolution of Generative AI (GAI): a Comprehensive Survey',
          abstract: 'This paper provides a comprehensive survey of Generative AI (GAI), tracing its evolution from early statistical methods to modern deep learning approaches. We analyze key architectures, training methodologies, and application domains while highlighting ethical considerations and future research directions.',
          authors: ['Sarah Williams', 'James Lee', 'Emily Rodriguez'],
          year: 2024,
          keywords: ['Artificial intelligence (AI)', 'Computer vision', 'Deep learning (DL)'],
          citationCount: 38
        },
        {
          title: 'The Rise and Potential of Large Language Model Based Agents: A Comprehensive Survey',
          abstract: 'This survey examines the emerging field of LLM-based agents, which combine large language models with planning capabilities and tool use to solve complex tasks. We categorize agent architectures, analyze evaluation methodologies, and discuss challenges in reasoning, tool manipulation, and multi-agent collaboration.',
          authors: ['Michael Brown', 'Lisa Wang', 'Robert Taylor'],
          year: 2024,
          keywords: ['natural language processing', 'large language models', 'LLM-based agents'],
          citationCount: 56
        },
        {
          title: 'Action State Testing – A Model for Test Design Automation',
          abstract: 'Model-based testing (MBT) is essential in software testing, offering automation, comprehensive coverage, and defect prevention. This paper explores the action-state testing modeling technique for automated test design, representing system behavior through actions, responses, and states.',
          authors: ['Thomas Wilson', 'Jennifer Martinez', 'Daniel Kim'],
          year: 2023,
          keywords: ['Software testing', 'Model-based testing', 'Test automation'],
          citationCount: 29
        },
        {
          title: 'Towards Trustworthy AI: A Comprehensive Framework for Responsible Development',
          abstract: 'This paper proposes a holistic framework for developing trustworthy AI systems that addresses ethical considerations, bias mitigation, explainability, and robustness. We present case studies across healthcare, finance, and autonomous systems to demonstrate practical implementation strategies.',
          authors: ['Anna Patel', 'Carlos Mendez', 'Sophia Kim'],
          year: 2023,
          keywords: ['Artificial intelligence', 'Ethics', 'Responsible AI'],
          citationCount: 47
        }
      ];
      
      // 选择一个模拟论文
      const selectedMock = mockPapers[pseudoRandom];
      
      const mockPaper: Paper = {
        paper_id: id,
        title: selectedMock.title,
        abstract: selectedMock.abstract,
        authors: selectedMock.authors,
        year: selectedMock.year,
        keywords: selectedMock.keywords,
        category: '计算机科学',
        url: `https://www.aminer.cn/pub/${id}`,
        citationCount: selectedMock.citationCount,
        referenceCount: Math.floor(selectedMock.citationCount * 0.8),
        references: [],
        citations: [],
        createdAt: new Date(),
        venue: 'International Journal of Computer Science'
      };
      
      // 缓存模拟数据
      setCache(cacheKey, mockPaper);
      
      return mockPaper;
    }
  } catch (error) {
    console.error('获取论文详情失败:', error);
    throw error;
  }
};

/**
 * 获取论文列表
 */
export const getPaperList = async (page: number = 0, size: number = 10, keywords: string[] = []): Promise<ApiResult> => {
  try {
    // 生成缓存键
    const cacheKey = generateCacheKey('paper_list', { page, size, keywords });
    const cachedData = getCache<{ papers: Paper[]; total: number }>(cacheKey);
    
    if (cachedData) {
      console.log('使用缓存的论文列表数据:', { page, size, keywords });
      return cachedData;
    }
    
    // 缓存不存在或已过期，从API获取
    console.log('从API获取论文列表:', { page, size, keywords });
    
    try {
      // 使用AMiner论文搜索API
      // 构建查询参数
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('size', String(size));
      
      // 确保使用提供的关键词
      const searchKeywords = keywords && keywords.length > 0 ? keywords : ['LLM', 'AI'];
      params.append('keyword', searchKeywords.join(' '));
      
      // 添加排序方式，默认按引用数降序
      params.append('order', 'n_citation');
      
      // 添加请求头部
      const response = await fetch(`${AMINER_API.PAPER_SEARCH}?${params}`, {
        headers: API_HEADERS
      });
      
      if (!response.ok) {
        throw new Error(`获取论文列表失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 检查返回的数据格式
      if ((data.code === 200 || data.code === 0) && Array.isArray(data.data)) {
        // 处理AMiner API返回的数据格式
        const papers = data.data.map((item: any) => {
          // 处理作者数据 - 尝试从不同字段提取作者信息
          let authors: string[] = [];
          
          // 尝试从不同的可能字段提取作者信息
          if (item.authors && Array.isArray(item.authors)) {
            // 处理标准作者数组
            authors = item.authors.map((author: any) => {
              if (typeof author === 'string') return author;
              return author.name || author.name_zh || author.id || '';
            }).filter((name: string) => name.trim() !== '');
          } else if (item.authors && typeof item.authors === 'string') {
            // 如果作者是字符串，尝试分割
            authors = item.authors.split(',').map((name: string) => name.trim());
          } else if (item.author) {
            // 尝试其他可能的字段名
            if (typeof item.author === 'string') {
              authors = [item.author];
            } else if (Array.isArray(item.author)) {
              authors = item.author.map((a: any) => {
                if (typeof a === 'string') return a;
                return a.name || a.name_zh || a.id || '';
              }).filter((name: string) => name.trim() !== '');
            }
          }
          
          // 如果还是没有作者，尝试从标题或其他字段推断
          if (authors.length === 0 && item.title) {
            // 不添加默认作者，让前端显示“作者暂无”
            authors = [];
          }
          
          // 处理关键词
          let keywords: string[] = [];
          if (item.keywords) {
            if (Array.isArray(item.keywords)) {
              keywords = item.keywords;
            } else if (typeof item.keywords === 'string') {
              keywords = item.keywords.split(',').map((kw: string) => kw.trim());
            }
          }
          
          // 构建标准格式的Paper对象
          const paperId = item._id || item.id;
          return {
            paper_id: paperId,
            title: item.title || '',
            abstract: item.abstract || '',
            authors: authors,
            year: item.year || 0,
            keywords: keywords,
            category: item.venue?.raw || '',
            url: item.url || `https://www.aminer.cn/pub/${paperId}`,
            citationCount: item.n_citation || 0,
            referenceCount: 0,
            references: [],
            citations: [],
            createdAt: new Date()
          } as Paper;
        });
        
        // 获取论文ID列表
        const paperIds = papers.map((paper: Paper) => paper.paper_id).filter((id: string) => id);
        
        // 如果有论文ID，使用批量获取API补充论文信息
        if (paperIds.length > 0) {
          try {
            // 每次最多获取20篇论文的详细信息
            const batchSize = 20;
            const batches = [];
            
            for (let i = 0; i < paperIds.length; i += batchSize) {
              const batchIds = paperIds.slice(i, i + batchSize);
              batches.push(batchIds);
            }
            
            // 并行获取每个批次的论文详情
            console.log('开始使用 paper/info API 批量获取论文详情:', batches);
            const batchResults = await Promise.all(batches.map(async (batchIds) => {
              try {
                // 使用 paper/info API 获取详细信息，包括作者数据
                const batchResponse = await fetch(AMINER_API.PAPER_INFO, {
                  method: 'POST',
                  headers: {
                    ...API_HEADERS,
                    'Content-Type': 'application/json;charset=utf-8'
                  },
                  body: JSON.stringify({ ids: batchIds })
                });
                
                if (!batchResponse.ok) {
                  console.warn(`批量获取论文信息失败: ${batchResponse.status} ${batchResponse.statusText}`);
                  return [];
                }
                
                const batchData = await batchResponse.json();
                console.log('批量获取论文信息成功:', batchData);
                
                // 检查不同的返回格式
                if (batchData.data && Array.isArray(batchData.data)) {
                  // 新的API格式，成功代码为200
                  return batchData.data || [];
                } else if (batchData.code === 0 && Array.isArray(batchData.data)) {
                  // 旧的API格式，成功代码为0
                  return batchData.data || [];
                } else {
                  console.warn('批量获取论文信息返回格式不符合预期:', batchData);
                  return [];
                }
              } catch (error) {
                console.error('批量获取论文信息异常:', error);
                return [];
              }
            }));
            
            // 将所有批次结果合并
            const detailedPapers = batchResults.flat();
            
            // 使用详细信息更新论文列表
            if (detailedPapers.length > 0) {
              // 创建一个映射以快速查找论文
              const paperDetailsMap = new Map<string, any>();
              detailedPapers.forEach((paper: any) => {
                // 根据返回的数据结构使用正确的ID字段
                const paperId = paper._id || paper.id;
                if (paperId) {
                  console.log('添加论文到映射:', paperId, paper);
                  paperDetailsMap.set(paperId, paper);
                }
              });
              
              // 更新论文列表中的信息
              papers.forEach((paper: Paper, index: number) => {
                // 尝试通过论文ID匹配详细信息
                const detailedPaper = paperDetailsMap.get(paper.paper_id);
                if (detailedPaper) {
                  console.log('找到论文详细信息:', detailedPaper);
                  
                  // 更新作者信息
                  if (detailedPaper.authors && Array.isArray(detailedPaper.authors)) {
                    // 使用详细信息中的作者数据
                    const authorNames = detailedPaper.authors.map((author: any) => {
                      if (typeof author === 'string') return author;
                      return author.name || author.name_zh || '';
                    }).filter((name: string) => name.trim() !== '');
                    
                    if (authorNames.length > 0) {
                      papers[index].authors = authorNames;
                      console.log('更新论文作者信息:', authorNames);
                    }
                  }
                  
                  // 更新其他可能的详细信息
                  if (detailedPaper.abstract && !paper.abstract) {
                    papers[index].abstract = detailedPaper.abstract;
                  }
                  
                  if (detailedPaper.venue && detailedPaper.venue.raw) {
                    papers[index].venue = detailedPaper.venue.raw;
                  }
                  
                  if (detailedPaper.year && !paper.year) {
                    papers[index].year = detailedPaper.year;
                  }
                }
              });
            }
          } catch (batchError) {
            console.warn('获取论文详细信息失败:', batchError);
            // 即使详细信息获取失败，仍然继续处理
          }
        }
        
        const result = {
          papers: papers,
          total: data.total || papers.length
        };
        
        setCache(cacheKey, result);
        return result;
      } else if (Array.isArray(data.papers)) {
        // 兼容旧格式: {papers: Array(5), total: 654}
        setCache(cacheKey, data);
        return data;
      } else {
        throw new Error('返回数据格式不符合预期');
      }
    } catch (apiError) {
      console.warn('API请求失败，使用模拟数据', apiError);
      
      // 提供模拟数据以便UI能够正常显示
      const mockPapers = [
        {
          paper_id: 'mock1',
          title: '基于深度学习的图像识别研究',
          abstract: '本文探讨了深度学习在图像识别领域的应用，提出了一种新的卷积神经网络模型，该模型在多个基准测试中表现优异。',
          authors: ['张三', '李四', '王五'],
          year: 2023,
          keywords: ['深度学习', '图像识别', '卷积神经网络'],
          category: '计算机科学',
          url: '',
          citationCount: 42,
          referenceCount: 35,
          references: [],
          citations: [],
          createdAt: new Date()
        },
        {
          paper_id: 'mock2',
          title: '自然语言处理中的注意力机制研究',
          abstract: '本研究分析了注意力机制在自然语言处理任务中的作用，并提出了一种改进的多头注意力模型，在机器翻译和文本摘要任务中取得了显著提升。',
          authors: ['赵六', '钱七'],
          year: 2022,
          keywords: ['自然语言处理', '注意力机制', 'Transformer'],
          category: '计算机科学',
          url: '',
          citationCount: 28,
          referenceCount: 40,
          references: [],
          citations: [],
          createdAt: new Date()
        }
      ];
      
      const result = {
        papers: mockPapers,
        total: mockPapers.length
      };
      
      setCache(cacheKey, result);
      return result;
    }
  } catch (error) {
    console.error('获取论文列表失败:', error);
    // 返回空数组以确保UI不会崩溃
    return { papers: [], total: 0 };
  }
};

/**
 * 获取论文引用链
 */
export const getCitationChain = async (paperId: string, depth: number = 2): Promise<{
  references: Paper[];
  citations: Paper[];
}> => {
  try {
    // 检查缓存
    const cacheKey = `citation_chain_${paperId}_${depth}`;
    const cachedData = getCache<{ references: Paper[]; citations: Paper[] }>(cacheKey);
    
    if (cachedData) {
      console.log('使用缓存的引用链数据:', paperId);
      return cachedData;
    }
    
    // 缓存不存在或已过期，从API获取
    console.log('从API获取引用链:', paperId);
    
    try {
      // 使用AMiner论文引用关系API
      const response = await fetch(`${AMINER_API.PAPER_RELATION}?id=${paperId}`, {
        headers: API_HEADERS
      });
      
      if (!response.ok) {
        console.warn(`使用AMiner API获取引用链失败: ${response.status} ${response.statusText}`);
        // API失败，返回模拟数据
        return getMockCitationChain(paperId);
      }
      
      const data = await response.json();
      console.log('引用链API返回数据:', data);
      
      if ((data.code === 0 || data.code === 200) && data.data) {
        // 处理引用数据
        const citedPapers = data.data.cited || [];
        console.log('引用论文数据:', citedPapers);
        
        // 获取引用的论文详情
        const references: Paper[] = [];
        for (const citedPaper of citedPapers.slice(0, 10)) { // 限制数量，避免过多请求
          try {
            if (citedPaper._id) {
              const paper = await getPaperById(citedPaper._id);
              references.push(paper);
            }
          } catch (error) {
            console.warn('获取引用论文详情失败:', error);
          }
        }
        
        // 模拟被引用论文（AMiner API暂不支持获取被引用论文）
        const citations: Paper[] = getMockCitations(paperId, 3);
        
        const result = { references, citations };
        setCache(cacheKey, result);
        return result;
      }
      
      // API返回格式不符合预期，返回模拟数据
      console.warn('引用链API返回格式不符合预期，使用模拟数据');
      return getMockCitationChain(paperId);
    } catch (apiError) {
      console.error('获取引用链异常:', apiError);
      // 发生异常，返回模拟数据
      return getMockCitationChain(paperId);
    }
  } catch (error) {
    console.error('获取引用链失败:', error);
    // 返回空数据以确保UI不会崩溃
    return { references: [], citations: [] };
  }
};

/**
 * 获取模拟引用链数据
 */
const getMockCitationChain = (paperId: string): { references: Paper[]; citations: Paper[] } => {
  console.log('生成模拟引用链数据:', paperId);
  
  // 生成模拟引用论文
  const references = getMockReferences(paperId, 5);
  
  // 生成模拟被引用论文
  const citations = getMockCitations(paperId, 3);
  
  return { references, citations };
};

/**
 * 获取模拟引用论文
 */
const getMockReferences = (paperId: string, count: number): Paper[] => {
  console.log('生成模拟引用论文:', paperId, count);
  
  const references: Paper[] = [];
  for (let i = 0; i < count; i++) {
    const refId = `ref_${paperId.substring(0, 6)}_${i}`;
    references.push({
      paper_id: refId,
      title: `引用论文 ${i + 1}: 深度学习在自然语言处理中的应用`,
      abstract: '本文研究了深度学习技术在自然语言处理领域的最新进展和应用场景。',
      authors: ['李明', '王华', '张三'],
      year: 2020 - i,
      keywords: ['深度学习', '自然语言处理', 'AI'],
      category: '计算机科学',
      url: `https://example.com/papers/${refId}`,
      citationCount: 120 - i * 10,
      referenceCount: 85 - i * 5,
      references: [],
      citations: [],
      createdAt: new Date(),
      venue: '国际人工智能会议'
    });
  }
  
  return references;
};

/**
 * 获取模拟被引用论文
 */
const getMockCitations = (paperId: string, count: number): Paper[] => {
  console.log('生成模拟被引用论文:', paperId, count);
  
  const citations: Paper[] = [];
  for (let i = 0; i < count; i++) {
    const citeId = `cite_${paperId.substring(0, 6)}_${i}`;
    citations.push({
      paper_id: citeId,
      title: `被引用论文 ${i + 1}: 基于改远CNN的图像分类算法`,
      abstract: '本文在传绍CNN基础上提出了改远方案，显著提高了图像分类准确率。',
      authors: ['张研', '刘学'],
      year: 2023 - i,
      keywords: ['CNN', '图像分类', '深度学习'],
      category: '计算机科学',
      url: `https://example.com/papers/${citeId}`,
      citationCount: 5 + i * 2,
      referenceCount: 30 + i * 3,
      references: [],
      citations: [],
      createdAt: new Date(),
      venue: '计算机视觉与模式识别期刊'
    });
  }
  
  return citations;
};

/**
 * 获取论文PDF URL
 */
export const getPaperPdfUrl = async (paperId: string): Promise<string> => {
  try {
    // 检查缓存
    const cacheKey = `paper_pdf_${paperId}`;
    const cachedData = getCache<string>(cacheKey);
    
    if (cachedData) {
      console.log('使用缓存的PDF URL:', paperId);
      return cachedData;
    }
    
    // 缓存不存在或已过期，从API获取
    console.log('从API获取PDF URL:', paperId);
    
    try {
      // 使用AMiner API获取PDF URL
      const response = await fetch(`${AMINER_API.PAPER_PDF}?id=${paperId}`, {
        headers: API_HEADERS
      });
      
      if (!response.ok) {
        throw new Error(`获取论文PDF失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 检查返回的数据格式
      if (data.code === 0 && data.data && data.data.url) {
        // 缓存PDF URL
        setCache(cacheKey, data.data.url);
        return data.data.url;
      } else {
        // 如果无法获取PDF URL，返回空字符串
        return '';
      }
    } catch (error) {
      console.error('获取论文PDF URL失败:', error);
      // 返回空字符串表示无法获取PDF
      return '';
    }
  } catch (error) {
    console.error('获取论文PDF URL失败:', error);
    return '';
  }
};

/**
 * 获取论文AI分析
 */
export const getPaperAIAnalysis = async (paperId: string): Promise<AIAnalysisResult> => {
  try {
    // 检查缓存
    const cacheKey = `ai_analysis_${paperId}`;
    const cachedData = getCache<AIAnalysisResult>(cacheKey);
    
    if (cachedData) {
      console.log('使用缓存的AI分析数据:', paperId);
      return cachedData;
    }
    
    // 缓存不存在或已过期，模拟AI分析
    console.log('生成论文AI分析:', paperId);
    
    // 获取论文详情，用于生成分析
    const paper = await getPaperById(paperId);
    
    // 模拟AI分析结果
    const analysis: AIAnalysisResult = {
      summary: `本文研究了${paper.keywords?.join('、')}等领域的关键问题，提出了创新性的解决方案。作者${paper.authors?.join('、')}通过实验证明了该方法的有效性。`,
      keyPoints: [
        `研究了${paper.keywords?.[0] || '相关领域'}的关键问题`,
        `提出了创新性的解决方案和方法`,
        `通过实验验证了方法的有效性和优越性`,
        `对${paper.keywords?.[1] || '该领域'}的未来发展提出了展望`
      ],
      relatedFields: paper.keywords || ['人工智能', '机器学习']
    };
    
    setCache(cacheKey, analysis);
    return analysis;
  } catch (error) {
    console.error('获取论文AI分析失败:', error);
    // 返回默认分析结果
    return {
      summary: '无法获取论文分析',
      keyPoints: ['无法获取关键点'],
      relatedFields: ['未知领域']
    };
  }
};