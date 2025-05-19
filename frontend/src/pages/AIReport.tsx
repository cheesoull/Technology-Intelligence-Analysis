import React, { useState, useRef, useEffect } from 'react';
import { Layout, Input, Button, List, Typography, Space, Upload, message } from 'antd';
import { SendOutlined, UploadOutlined, FileTextOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const { Header, Sider, Content } = Layout;
const { TextArea } = Input;
const { Title } = Typography;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  sourceType?: 'paper' | 'blog';
  sourceId?: number;
}

const StyledLayout = styled(Layout)`
  height: 100vh;
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  margin-bottom: 80px;
`;

const MessageItem = styled.div<{ isUser: boolean }>`
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 20px;
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  background-color: ${props => props.isUser ? '#1890ff' : '#f0f2f5'};
  color: ${props => props.isUser ? 'white' : 'black'};
`;

const InputContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: white;
  border-top: 1px solid #f0f0f0;
`;

const PreviewPanel = styled.div`
  width: 400px;
  padding: 20px;
  border-left: 1px solid #f0f0f0;
  background: #fafafa;
  overflow-y: auto;
`;

const AIReport: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [reportContent, setReportContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 创建新会话
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
    };
    setSessions([newSession]);
    setCurrentSession(newSession);
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || !currentSession) return;

    const newMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    setCurrentSession(prev => ({
      ...prev!,
      messages: [...prev!.messages, newMessage],
    }));

    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceType: currentSession.sourceType,
          sourceId: currentSession.sourceId,
          userQuestion: inputValue,
        }),
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.report || '抱歉，我无法生成报告。',
        timestamp: Date.now(),
      };

      setCurrentSession(prev => ({
        ...prev!,
        messages: [...prev!.messages, assistantMessage],
      }));

      setReportContent(data.report || '');
    } catch (error) {
      message.error('发送消息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('author', '');
    formData.append('abstract', '');

    try {
      const response = await fetch('/api/papers/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        message.success('文件上传成功');
      } else {
        message.error('文件上传失败');
      }
    } catch (error) {
      message.error('文件上传失败');
    }
  };

  const handleSelectPaper = () => {
    navigate('/paper');
  };

  const handleSelectBlog = () => {
    navigate('/tech-blog');
  };

  return (
    <StyledLayout>
      <Sider width={250} theme="light">
        <div style={{ padding: '20px' }}>
          <Button type="primary" block style={{ marginBottom: '20px' }}>
            新建对话
          </Button>
          <List
            dataSource={sessions}
            renderItem={session => (
              <List.Item>
                <Button type="text" block>
                  {session.title}
                </Button>
              </List.Item>
            )}
          />
        </div>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 20px', borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            <Title level={4} style={{ margin: 0 }}>{currentSession?.title}</Title>
            <Upload
              customRequest={({ file }) => handleFileUpload(file as File)}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>上传文件</Button>
            </Upload>
            <Button icon={<FileTextOutlined />} onClick={handleSelectPaper}>
              选择论文
            </Button>
            <Button icon={<BookOutlined />} onClick={handleSelectBlog}>
              选择博客
            </Button>
          </Space>
        </Header>
        <Content>
          <ChatContainer>
            <MessageList ref={messageListRef}>
              {currentSession?.messages.map((message, index) => (
                <MessageItem key={index} isUser={message.role === 'user'}>
                  <MessageBubble isUser={message.role === 'user'}>
                    {message.content}
                  </MessageBubble>
                </MessageItem>
              ))}
            </MessageList>
            <InputContainer>
              <Space.Compact style={{ width: '100%' }}>
                <TextArea
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="输入您的问题..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  onPressEnter={e => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={loading}
                >
                  发送
                </Button>
              </Space.Compact>
            </InputContainer>
          </ChatContainer>
        </Content>
      </Layout>
      <PreviewPanel>
        <Title level={4}>解读报告预览</Title>
        <div style={{ whiteSpace: 'pre-wrap' }}>{reportContent}</div>
      </PreviewPanel>
    </StyledLayout>
  );
};

export default AIReport; 