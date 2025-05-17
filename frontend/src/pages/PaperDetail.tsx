import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper } from '../types/paper';
import { getPaperById, getPaperList } from '../services/paperService';
// 直接从paperService导入这些函数，确保它们被正确实现和导出
import { getCitationChain, getPaperAIAnalysis, getPaperPdfUrl } from '../services/paperService';
import { Card, Typography, List, Tag, Button, Spin, message, Tabs, Divider, Row, Col, Upload, Slider } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined, LinkOutlined, BulbOutlined, UploadOutlined, ReloadOutlined } from '@ant-design/icons';
import { PDFViewer } from '../components/PDFViewer';
import { CitationChain } from '../components/CitationChain';
import { PaperAnalysis } from '../components/PaperAnalysis';
import { PaperRecommendList } from '../components/PaperRecommendList';

const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;

interface AIAnalysisResult {
  summary: string;
  keyPoints: string[];
  relatedFields: string[];
}

const PaperDetail: React.FC = () => {
  // 修改参数名以匹配App.tsx中的路由配置 '/paper/:paperId'
  const { paperId } = useParams<{ paperId: string }>();
  // 为了兼容现有代码，将paperId赋值给id变量
  const id = paperId;
  const navigate = useNavigate();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('1');
  
  // 引用链相关状态
  const [citationChain, setCitationChain] = useState<{references: Paper[], citations: Paper[]} | null>(null);
  const [citationLoading, setCitationLoading] = useState(false);
  const [citationDepth, setCitationDepth] = useState(2);
  
  // AI分析相关状态
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [recommendedPapers, setRecommendedPapers] = useState<Paper[]>([]);
  const [comparisonPaper, setComparisonPaper] = useState<Paper | null>(null);
  const [comparisonMode, setComparisonMode] = useState<'recommended' | 'upload'>('recommended');

  // 获取论文详情
  useEffect(() => {
    const fetchPaper = async () => {
      try {
        if (!id) {
          message.error('论文ID不存在');
          navigate('/');
          return;
        }
        setLoading(true);
        console.log('正在获取论文详情，ID:', id);
        
        // 检查是否是本地论文
        const isLocalPaper = id.startsWith('local_');
        
        if (isLocalPaper) {
          console.log('检测到本地论文ID:', id);
          // 对于本地论文，直接使用模拟数据
          const localMockPaper: Paper = {
            paper_id: id,
            title: id.includes('1683456789') 
              ? '基于深度学习的自然语言处理技术研究' 
              : id.includes('1683456790')
                ? '大型语言模型在学术研究中的应用'
                : '多模态学习在医学影像分析中的应用',
            abstract: id.includes('1683456789')
              ? '本文探讨了深度学习在自然语言处理领域的应用，包括语言模型、机器翻译和情感分析等方面的最新进展。'
              : id.includes('1683456790')
                ? '本文研究了大型语言模型如GPT和LLaMA在学术研究中的应用场景，包括文献分析、自动摘要和研究趋势预测等。'
                : '本文探讨了多模态学习技术在医学影像分析中的应用，包括影像分割、病变检测和诊断辅助等方面。',
            authors: id.includes('1683456789') 
              ? ['张三', '李四', '王五']
              : id.includes('1683456790')
                ? ['赵六', '钱七']
                : ['孙八', '周九', '吴十'],
            year: id.includes('1683456790') ? 2024 : 2023,
            keywords: id.includes('1683456789')
              ? ['深度学习', '自然语言处理', 'Transformer']
              : id.includes('1683456790')
                ? ['LLM', '学术研究', '文献分析']
                : ['多模态学习', '医学影像', '深度学习'],
            category: id.includes('1683456789')
              ? '人工智能'
              : id.includes('1683456790')
                ? '计算机科学'
                : '医学人工智能',
            url: `file://local_paper_${id.split('_')[1]}.pdf`,
            citationCount: 0,
            referenceCount: id.includes('1683456789') ? 15 : id.includes('1683456790') ? 23 : 18,
            references: [],
            citations: [],
            createdAt: id.includes('1683456789')
              ? new Date('2023-05-07')
              : id.includes('1683456790')
                ? new Date('2024-01-15')
                : new Date('2023-11-20')
          };
          
          console.log('使用本地论文模拟数据:', localMockPaper);
          setPaper(localMockPaper);
          setPdfLoading(false);
          return;
        }
        
        // 对于非本地论文，使用真实ID获取数据，仅在ID为空时使用模拟数据
        const paperIdToUse = id && id.trim().length > 0 ? id : `mock${Math.floor(Math.random() * 2) + 1}`;
        
        try {
          const data = await getPaperById(paperIdToUse);
          console.log('获取到论文详情:', data);
          setPaper(data);
          
          // 暂时跳过PDF获取
          setPdfLoading(false);
          console.log('暂时跳过PDF获取，专注于论文详情展示');
        } catch (fetchError) {
          console.error('获取论文详情API调用失败:', fetchError);
          // 尝试多次获取真实数据
          if (!paperIdToUse.startsWith('mock')) {
            try {
              // 再尝试一次获取真实数据
              console.log('重新尝试获取论文数据:', paperIdToUse);
              const retryData = await getPaperById(paperIdToUse);
              if (retryData) {
                setPaper(retryData);
                return;
              }
            } catch (retryError) {
              console.error('重新获取论文数据失败:', retryError);
              message.warning('无法获取论文数据，使用模拟数据展示');
              const mockData = await getPaperById(`mock${Math.floor(Math.random() * 2) + 1}`);
              setPaper(mockData);
            }
          } else {
            throw fetchError;
          }
        }
      } catch (error) {
        message.error('获取论文详情失败');
        console.error('获取论文详情失败:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchPaper();
  }, [id, navigate]);

  // 获取引用链数据
  useEffect(() => {
    const fetchCitationChain = async () => {
      if (activeTab === '2' && paper && !citationChain) {
        try {
          setCitationLoading(true);
          console.log('正在获取引用链数据，paperId:', paper.paper_id);
          
          try {
            const data = await getCitationChain(paper.paper_id, citationDepth);
            console.log('获取到引用链数据:', data);
            setCitationChain(data);
          } catch (fetchError) {
            console.error('获取引用链API调用失败:', fetchError);
            // 如果获取失败，使用模拟数据
            message.warning('使用模拟引用链数据');
            
            // 模拟引用链数据
            const mockReferences = [
              {
                paper_id: 'ref1',
                title: '深度学习综述',
                abstract: '本文对深度学习的发展历程、主要模型和应用领域进行了全面综述。',
                authors: ['李明', '王华'],
                year: 2020,
                keywords: ['深度学习', '人工智能', '综述'],
                category: '计算机科学',
                url: '',
                citationCount: 120,
                referenceCount: 85,
                references: [],
                citations: [],
                createdAt: new Date()
              }
            ];
            
            const mockCitations = [
              {
                paper_id: 'cite1',
                title: '基于改进CNN的图像分类算法',
                abstract: '本文在传统CNN基础上提出了改进方案，显著提高了图像分类准确率。',
                authors: ['张研', '刘学'],
                year: 2024,
                keywords: ['CNN', '图像分类', '深度学习'],
                category: '计算机科学',
                url: '',
                citationCount: 5,
                referenceCount: 30,
                references: [],
                citations: [],
                createdAt: new Date()
              }
            ];
            
            setCitationChain({
              references: mockReferences,
              citations: mockCitations
            });
          }
        } catch (error) {
          message.error('获取引用链失败');
          console.error('获取引用链失败:', error);
          // 设置空的引用链数据，避免界面崩溃
          setCitationChain({ references: [], citations: [] });
        } finally {
          setCitationLoading(false);
        }
      }
    };

    fetchCitationChain();
  }, [activeTab, paper, citationChain, citationDepth]);

  // 获取AI分析数据
  useEffect(() => {
    const fetchAIAnalysis = async () => {
      if (activeTab === '3' && paper && !aiAnalysis) {
        try {
          setAiAnalysisLoading(true);
          console.log('正在获取AI分析数据，paperId:', paper.paper_id);
          
          try {
            const data = await getPaperAIAnalysis(paper.paper_id);
            console.log('获取到AI分析数据:', data);
            setAiAnalysis(data);
          } catch (fetchError) {
            console.error('获取AI分析API调用失败:', fetchError);
            // 如果获取失败，使用模拟数据
            message.warning('使用模拟AI分析数据');
            
            // 模拟AI分析数据
            setAiAnalysis({
              summary: `本文研究了${paper.keywords?.join('、')}等领域的关键问题，提出了创新性的解决方案。作者${paper.authors?.join('、')}通过实验证明了该方法的有效性。`,
              keyPoints: [
                `研究了${paper.keywords?.[0] || '相关领域'}的关键问题`,
                `提出了创新性的解决方案和方法`,
                `通过实验验证了方法的有效性和优越性`,
                `对${paper.keywords?.[1] || '该领域'}的未来发展提出了展望`
              ],
              relatedFields: paper.keywords || ['人工智能', '机器学习']
            });
          }
          
          // 获取基于当前论文关键词的推荐论文
          if (paper.keywords && paper.keywords.length > 0) {
            try {
              console.log('正在获取推荐论文，关键词:', paper.keywords);
              const result = await getPaperList(0, 5, paper.keywords);
              console.log('获取到推荐论文:', result);
              
              // 处理不同的响应格式
              let papersList: Paper[] = [];
              
              if ('papers' in result && Array.isArray(result.papers)) {
                papersList = result.papers;
                console.log('解析到papers格式的推荐论文:', papersList.length);
              } else if ('data' in result && Array.isArray(result.data)) {
                papersList = result.data;
                console.log('解析到data格式的推荐论文:', papersList.length);
              } else {
                console.warn('推荐论文数据格式不符合预期:', result);
                // 使用模拟数据
                papersList = [
                  {
                    paper_id: 'rec1',
                    title: '基于深度学习的自然语言处理新方法',
                    abstract: '本文提出了一种基于深度学习的自然语言处理新方法，在多个标准数据集上取得了显著效果。',
                    authors: ['张三', '李四'],
                    year: 2023,
                    keywords: ['深度学习', '自然语言处理', 'Transformer'],
                    category: '计算机科学',
                    url: '',
                    citationCount: 15,
                    referenceCount: 30,
                    references: [],
                    citations: [],
                    createdAt: new Date()
                  },
                  {
                    paper_id: 'rec2',
                    title: '多模态深度学习在医学影像分析中的应用',
                    abstract: '本文探讨了多模态深度学习在医学影像分析中的应用，并提出了一种新的融合模型。',
                    authors: ['王五', '赵六'],
                    year: 2022,
                    keywords: ['深度学习', '医学影像', '多模态学习'],
                    category: '医学工程',
                    url: '',
                    citationCount: 25,
                    referenceCount: 40,
                    references: [],
                    citations: [],
                    createdAt: new Date()
                  }
                ];
              }
              
              // 过滤掉当前论文
              const filteredPapers = papersList.filter(p => p.paper_id !== paper.paper_id);
              console.log('过滤后的推荐论文数量:', filteredPapers.length);
              setRecommendedPapers(filteredPapers);
              
              // 默认选择第一篇推荐论文进行比较
              if (filteredPapers.length > 0 && !comparisonPaper) {
                console.log('选择第一篇推荐论文进行比较:', filteredPapers[0].title);
                setComparisonPaper(filteredPapers[0]);
              }
            } catch (listError) {
              console.error('获取推荐论文失败:', listError);
              // 使用模拟数据
              const mockRecommendedPapers = [
                {
                  paper_id: 'rec1',
                  title: '基于深度学习的自然语言处理新方法',
                  abstract: '本文提出了一种基于深度学习的自然语言处理新方法，在多个标准数据集上取得了显著效果。',
                  authors: ['张三', '李四'],
                  year: 2023,
                  keywords: ['深度学习', '自然语言处理', 'Transformer'],
                  category: '计算机科学',
                  url: '',
                  citationCount: 15,
                  referenceCount: 30,
                  references: [],
                  citations: [],
                  createdAt: new Date()
                },
                {
                  paper_id: 'rec2',
                  title: '多模态深度学习在医学影像分析中的应用',
                  abstract: '本文探讨了多模态深度学习在医学影像分析中的应用，并提出了一种新的融合模型。',
                  authors: ['王五', '赵六'],
                  year: 2022,
                  keywords: ['深度学习', '医学影像', '多模态学习'],
                  category: '医学工程',
                  url: '',
                  citationCount: 25,
                  referenceCount: 40,
                  references: [],
                  citations: [],
                  createdAt: new Date()
                }
              ];
              setRecommendedPapers(mockRecommendedPapers);
              if (!comparisonPaper && mockRecommendedPapers.length > 0) {
                setComparisonPaper(mockRecommendedPapers[0]);
              }
            }
          }
        } catch (error) {
          message.error('获取AI分析失败');
          console.error('获取AI分析失败:', error);
        } finally {
          setAiAnalysisLoading(false);
        }
      }
    };

    fetchAIAnalysis();
  }, [activeTab, paper, aiAnalysis]);

  // 重新加载引用链
  const reloadCitationChain = async () => {
    if (!paper) return;
    
    setCitationLoading(true);
    setCitationChain(null);
    
    try {
      const data = await getCitationChain(paper.paper_id, citationDepth);
      setCitationChain(data);
    } catch (error) {
      message.error('获取引用链失败');
      console.error('获取引用链失败:', error);
    } finally {
      setCitationLoading(false);
    }
  };

  // 导出AI分析报告
  const exportAnalysisReport = () => {
    if (!paper || !aiAnalysis) return;
    
    const reportContent = `
# ${paper.title} - AI分析报告

## 基本信息
- 作者: ${paper.authors.join(', ')}
- 年份: ${paper.year}
- 关键词: ${paper.keywords.join(', ')}

## 摘要
${aiAnalysis.summary}

## 关键要点
${aiAnalysis.keyPoints.map(point => `- ${point}`).join('\n')}

## 相关领域
${aiAnalysis.relatedFields.map(field => `- ${field}`).join('\n')}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${paper.title.substring(0, 30)}_分析报告.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('分析报告已导出');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="p-5">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          className="mb-5"
        >
          返回列表
        </Button>
        <Card>
          <Typography>
            <Title level={4}>论文不存在</Title>
            <Paragraph>未找到相关论文信息</Paragraph>
          </Typography>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-5 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          className="mb-5"
        >
          返回列表
        </Button>
        
        {/* 论文基本信息 */}
        <Card className="mb-5 shadow-sm">
          <Typography>
            <Title level={2} className="text-blue-700">{paper.title}</Title>
            
            <Row gutter={16}>
              <Col span={18}>
                <Paragraph>
                  <Text strong>作者：</Text>
                  {paper.authors.join(', ')}
                </Paragraph>
                
                <Paragraph>
                  <Text strong>年份：</Text>
                  {paper.year}
                </Paragraph>
                
                <Paragraph>
                  <Text strong>关键词：</Text>
                  {paper.keywords.map((keyword, index) => (
                    <Tag key={index} color="blue" className="m-1">
                      {keyword}
                    </Tag>
                  ))}
                </Paragraph>
                
                <Paragraph>
                  <Text strong>分类：</Text>
                  {paper.category}
                </Paragraph>
              </Col>
              
              <Col span={6}>
                <Card className="bg-blue-50">
                  <Paragraph>
                    <Text strong>引用数：</Text> {paper.citationCount}
                  </Paragraph>
                  
                  <Paragraph>
                    <Text strong>参考文献数：</Text> {paper.referenceCount}
                  </Paragraph>
                  
                  {paper.url && (
                    <Paragraph>
                      <a 
                        href={paper.url.startsWith('file://') ? `file://${decodeURIComponent(paper.url.substring(7))}` : paper.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-700"
                        title={paper.url.startsWith('file://') ? decodeURIComponent(paper.url.substring(7)) : paper.url}
                      >
                        查看原文 {paper.url.startsWith('file://') && `(${decodeURIComponent(paper.url.substring(7)).split('/').pop()})`}
                      </a>
                    </Paragraph>
                  )}
                </Card>
              </Col>
            </Row>
            
            <Divider />
            
            <Paragraph>
              <Text strong className="text-lg">摘要：</Text>
              <div className="bg-gray-50 p-4 rounded-lg mt-2">
                {paper.abstract}
              </div>
            </Paragraph>
          </Typography>
        </Card>
        
        {/* PDF预览区域 */}
        <Card className="mb-5 shadow-sm">
          <Title level={4}>论文预览</Title>
          <div className="border border-gray-200 rounded-lg p-5 min-h-[500px] flex flex-col items-center">
            {pdfLoading ? (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <Spin size="large" />
                <Text type="secondary" className="mt-3">正在加载PDF...</Text>
              </div>
            ) : pdfUrl ? (
              <PDFViewer 
                url={pdfUrl} 
                currentPage={currentPage} 
                onPageChange={setCurrentPage} 
              />
            ) : paper.url ? (
              <PDFViewer 
                url={paper.url.startsWith('file://') ? 
                  // 对于本地文件URL，需要先解码中文文件名
                  `file://${decodeURIComponent(paper.url.substring(7))}` : 
                  paper.url} 
                currentPage={currentPage} 
                onPageChange={setCurrentPage} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <FileTextOutlined style={{ fontSize: '48px', color: '#bfbfbf', marginBottom: '20px' }} />
                <Text type="secondary">暂无PDF预览</Text>
                <Text type="secondary" className="mt-2">该论文暂未提供PDF文件</Text>
              </div>
            )}
          </div>
        </Card>
        
        {/* 功能标签页 */}
        <Card className="shadow-sm">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              {
                key: '1',
                label: (
                  <span>
                    <FileTextOutlined />
                    论文详情
                  </span>
                ),
                children: (
                  <div className="py-5">
                    <Typography>
                      <Title level={4}>详细信息</Title>
                      <List
                        bordered
                        dataSource={[
                          { label: '标题', value: paper.title || '暂无标题' },
                          { label: '作者', value: Array.isArray(paper.authors) && paper.authors.length > 0 ? paper.authors.join(', ') : '暂无作者信息' },
                          { label: '年份', value: paper.year ? paper.year.toString() : '暂无年份信息' },
                          { label: '分类', value: paper.category || '暂无分类信息' },
                          { label: '关键词', value: Array.isArray(paper.keywords) && paper.keywords.length > 0 ? paper.keywords.join(', ') : '暂无关键词' },
                          { label: '引用数', value: paper.citationCount !== undefined ? paper.citationCount.toString() : '0' },
                          { label: '参考文献数', value: paper.referenceCount !== undefined ? paper.referenceCount.toString() : '0' }
                        ]}
                        renderItem={item => (
                          <List.Item>
                            <Text strong>{item.label}：</Text> {item.value}
                          </List.Item>
                        )}
                      />
                    </Typography>
                  </div>
                )
              },
              {
                key: '2',
                label: (
                  <span>
                    <LinkOutlined />
                    引用链可视化
                  </span>
                ),
                children: (
                  <div className="py-5">
                    <div className="mb-5 flex items-center gap-2">
                      <Text>引用链深度：</Text>
                      <Slider 
                        min={1} 
                        max={5} 
                        value={citationDepth} 
                        onChange={value => setCitationDepth(value)} 
                        style={{ width: 200 }} 
                      />
                      <Button 
                        icon={<ReloadOutlined />} 
                        onClick={reloadCitationChain}
                      >
                        重新加载
                      </Button>
                    </div>
                    
                    <CitationChain 
                      paperId={paper.paper_id} 
                      depth={citationDepth} 
                    />
                  </div>
                )
              },
              {
                key: '3',
                label: (
                  <span>
                    <BulbOutlined />
                    AI解读
                  </span>
                ),
                children: (
                  <div className="py-5">
                    {aiAnalysisLoading ? (
                      <div className="flex justify-center items-center h-[400px]">
                        <Spin size="large" />
                      </div>
                    ) : aiAnalysis ? (
                      <Row gutter={16}>
                        <Col span={16}>
                          <PaperAnalysis 
                            analysis={aiAnalysis} 
                            onExport={exportAnalysisReport} 
                          />
                        </Col>
                        <Col span={8}>
                          <Card title="基于关键词的推荐论文" className="mb-5">
                            <PaperRecommendList 
                              papers={recommendedPapers} 
                              loading={false} 
                            />
                          </Card>
                          
                          <Card title="上传本地文献对比">
                            <Dragger
                              name="file"
                              multiple={false}
                              action="/api/paper/upload"
                              onChange={info => {
                                if (info.file.status === 'done') {
                                  message.success(`${info.file.name} 上传成功`);
                                  setComparisonMode('upload');
                                  // 假设上传成功后，服务器返回论文数据
                                  setComparisonPaper(info.file.response);
                                } else if (info.file.status === 'error') {
                                  message.error(`${info.file.name} 上传失败`);
                                }
                              }}
                            >
                              <p className="ant-upload-drag-icon">
                                <UploadOutlined />
                              </p>
                              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                              <p className="ant-upload-hint">支持PDF、DOC、DOCX格式</p>
                            </Dragger>
                          </Card>
                        </Col>
                      </Row>
                    ) : (
                      <div className="text-center py-[50px]">
                        <Text type="secondary">暂无AI解析数据</Text>
                      </div>
                    )}
                  </div>
                )
              }
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default PaperDetail;
