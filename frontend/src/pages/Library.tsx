import React, { useState, useEffect } from 'react';
import { Typography, Button, Table, Tag, Upload, message, Empty, Spin } from 'antd';
import { UploadOutlined, FileAddOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Paper } from '../types/paper';
import { uploadPaper } from '../services/paperService';

const { Title } = Typography;

const Library: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [localPapers, setLocalPapers] = useState<Paper[]>([]);

  // 获取本地论文列表
  const fetchLocalPapers = async () => {
    setLoading(true);
    try {
      // 尝试从后端获取数据
      try {
        console.log('开始获取本地论文列表...');
        const response = await fetch('/api/paper/local');
        
        if (response.ok) {
          const result = await response.json();
          console.log('获取本地论文列表响应:', result);
          
          if (result.code === 200 && result.data) {
            setLocalPapers(result.data);
            return;
          }
        }
        
        // 如果响应不成功或数据不符合预期，使用模拟数据
        console.warn('从后端获取本地论文列表失败，使用模拟数据');
        throw new Error('使用模拟数据');
      } catch (error) {
        console.log('使用模拟数据替代本地论文列表');
        
        // 使用模拟数据
        const mockPapers: Paper[] = [
          {
            paper_id: 'local_1683456789',
            title: '基于深度学习的自然语言处理技术研究',
            abstract: '本文探讨了深度学习在自然语言处理领域的应用，包括语言模型、机器翻译和情感分析等方面的最新进展。',
            authors: ['张三', '李四', '王五'],
            year: 2023,
            keywords: ['深度学习', '自然语言处理', 'Transformer'],
            category: '人工智能',
            url: 'file://local_paper_1.pdf',
            citationCount: 0,
            referenceCount: 15,
            references: [],
            citations: [],
            createdAt: new Date('2023-05-07')
          },
          {
            paper_id: 'local_1683456790',
            title: '大型语言模型在学术研究中的应用',
            abstract: '本文研究了大型语言模型如GPT和LLaMA在学术研究中的应用场景，包括文献分析、自动摘要和研究趋势预测等。',
            authors: ['赵六', '钱七'],
            year: 2024,
            keywords: ['LLM', '学术研究', '文献分析'],
            category: '计算机科学',
            url: 'file://local_paper_2.pdf',
            citationCount: 0,
            referenceCount: 23,
            references: [],
            citations: [],
            createdAt: new Date('2024-01-15')
          },
          {
            paper_id: 'local_1683456791',
            title: '多模态学习在医学影像分析中的应用',
            abstract: '本文探讨了多模态学习技术在医学影像分析中的应用，包括影像分割、病变检测和诊断辅助等方面。',
            authors: ['孙八', '周九', '吴十'],
            year: 2023,
            keywords: ['多模态学习', '医学影像', '深度学习'],
            category: '医学人工智能',
            url: 'file://local_paper_3.pdf',
            citationCount: 0,
            referenceCount: 18,
            references: [],
            citations: [],
            createdAt: new Date('2023-11-20')
          }
        ];
        
        setLocalPapers(mockPapers);
      }
    } catch (error) {
      console.error('获取本地论文列表失败:', error);
      message.error('获取本地论文列表失败，已加载模拟数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalPapers();
  }, []);

  // 处理论文上传
  const handleFileUpload = async (file: File) => {
    try {
      setUploadLoading(true);
      await uploadPaper(file);
      message.success('论文上传成功');
      
      // 刷新论文列表
      fetchLocalPapers();
    } catch (error) {
      message.error(`论文上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setUploadLoading(false);
    }
  };

  // 上传文件前的验证
  const beforeUpload = (file: File) => {
    const isPDF = file.type === 'application/pdf';
    if (!isPDF) {
      message.error('只能上传 PDF 文件!');
      return false;
    }

    const isLt20M = file.size / 1024 / 1024 < 20;
    if (!isLt20M) {
      message.error('文件大小不能超过 20MB!');
      return false;
    }

    // 手动处理上传
    handleFileUpload(file);
    return false;
  };

  // 查看论文详情
  const handleViewPaper = (paperId: string) => {
    navigate(`/paper/${paperId}`);
  };

  // 删除论文
  const handleDeletePaper = async (paperId: string) => {
    try {
      const response = await fetch(`/api/paper/${paperId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('删除论文失败');
      }
      
      message.success('论文删除成功');
      // 刷新论文列表
      fetchLocalPapers();
    } catch (error) {
      console.error('删除论文失败:', error);
      message.error('删除论文失败，请稍后重试');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: '作者',
      dataIndex: 'authors',
      key: 'authors',
      render: (authors: string[]) => (
        <span>
          {authors && authors.length > 0
            ? authors.slice(0, 3).join(', ') + (authors.length > 3 ? ' 等' : '')
            : '未知作者'}
        </span>
      ),
    },
    {
      title: '年份',
      dataIndex: 'year',
      key: 'year',
      width: 100,
    },
    {
      title: '关键词',
      key: 'keywords',
      dataIndex: 'keywords',
      render: (keywords: string[]) => (
        <>
          {keywords && keywords.slice(0, 3).map(keyword => (
            <Tag color="blue" key={keyword}>
              {keyword}
            </Tag>
          ))}
          {keywords && keywords.length > 3 && <Tag color="blue">...</Tag>}
        </>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: any, record: Paper) => (
        <div className="flex space-x-2">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewPaper(record.paper_id || '')}
          >
            查看
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeletePaper(record.paper_id || '')}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <Title level={3}>个人文献库</Title>
        <Upload
          name="file"
          accept=".pdf"
          showUploadList={false}
          beforeUpload={beforeUpload}
          disabled={uploadLoading}
        >
          <Button
            type="primary"
            icon={<UploadOutlined />}
            loading={uploadLoading}
            className="h-[40px] flex items-center justify-center"
            style={{ backgroundColor: '#0D47A1', borderColor: '#0D47A1' }}
          >
            上传本地论文
          </Button>
        </Upload>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="flex items-center mb-4">
          <FileAddOutlined className="text-xl mr-2 text-blue-600" />
          <span className="text-lg font-medium">上传说明</span>
        </div>
        <ul className="list-disc pl-6 space-y-2">
          <li>支持上传PDF格式的论文文件</li>
          <li>文件大小不超过20MB</li>
          <li>上传后系统会自动提取论文信息，包括标题、作者、摘要等</li>
          <li>上传的论文将保存在您的个人文献库中，可随时查看</li>
        </ul>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">正在加载您的论文...</p>
        </div>
      ) : localPapers.length > 0 ? (
        <Table
          columns={columns}
          dataSource={localPapers.map(paper => ({ ...paper, key: paper.paper_id }))}
          pagination={{ pageSize: 10 }}
          className="shadow-sm"
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="您的文献库还没有论文，点击上方按钮上传"
          className="py-10"
        />
      )}
    </div>
  );
};

export default Library;
