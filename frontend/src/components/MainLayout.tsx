import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeOutlined, 
  ExperimentOutlined, 
  FileTextOutlined, 
  StarOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MessageOutlined,
  ReadOutlined,
  BookOutlined
} from '@ant-design/icons';

const { Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [hoveringMenu, setHoveringMenu] = useState(false);
  const [hoveringUser, setHoveringUser] = useState(false);
  const [followCount, setFollowCount] = useState(12);
  const [favoriteCount, setFavoriteCount] = useState(8);

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return '1';
    if (path.startsWith('/paper/')) return '1';
    if (path === '/discovery') return '2';
    if (path === '/library') return '3';
    if (path === '/favorites') return '4';
    if (path === '/ai-chat' || path.startsWith('/chat') || path.startsWith('/history') || path.startsWith('/report')) return '5';
    if (path === '/papers') return '6';
    if (path === '/tech-blogs') return '7';
    return '1'; // 默认选中首页
  };

  // 处理菜单项点击
  const handleMenuClick = (key: string) => {
    switch (key) {
      case '1':
        navigate('/');
        break;
      case '2':
        navigate('/discovery');
        break;
      case '3':
        navigate('/library');
        break;
      case '4':
        navigate('/favorites');
        break;
      case '5':
        navigate('/ai-chat');
        break;
      case '6':
        navigate('/papers');
        break;
      case '7':
        navigate('/tech-blogs');
        break;
      default:
        navigate('/');
    }
  };

  // 用户信息下拉菜单项
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  // 监听收藏数量变化
  React.useEffect(() => {
    const handleFavoriteCountUpdate = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.count === 'number') {
        setFavoriteCount(event.detail.count);
      }
    };

    window.addEventListener('updateFavoriteCount', handleFavoriteCountUpdate as EventListener);
    
    return () => {
      window.removeEventListener('updateFavoriteCount', handleFavoriteCountUpdate as EventListener);
    };
  }, []);

  // 处理用户菜单点击
  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        // 处理个人信息点击
        console.log('点击了个人信息');
        break;
      case 'settings':
        // 处理设置点击
        console.log('点击了设置');
        break;
      case 'logout':
        // 处理退出登录点击
        console.log('点击了退出登录');
        break;
      default:
        break;
    }
  };

  // 控制侧边栏伸缩：只在用户区和菜单区都没有hover时才收缩
  React.useEffect(() => {
    if (!hoveringMenu && !hoveringUser) {
      setSiderCollapsed(true);
    } else {
      setSiderCollapsed(false);
    }
  }, [hoveringMenu, hoveringUser]);

  return (
    <Layout className="min-h-screen w-screen overflow-hidden">
      {/* 左侧导航栏 - 固定显示 */}
      <Sider
        collapsible
        collapsed={siderCollapsed}
        onCollapse={() => {}}
        className="bg-white shadow-md fixed left-0 top-0 bottom-0 z-30"
        width={220}
        collapsedWidth={60}
        style={{ background: '#FFFFFF', position: 'fixed', height: '100vh' }}
        trigger={null}
      >
        {/* 系统名称 */}
        <div
          className="flex items-center justify-center font-bold text-lg text-[#1565c0] py-4 select-none"
          style={{ letterSpacing: 2, height: 56 }}
        >
          {!siderCollapsed ? '科技情报分析系统' : <span style={{ fontSize: 22 }}>🔎</span>}
        </div>
        {/* 用户区 */}
        <div
          className="flex flex-col items-center my-2 w-full px-2"
          onMouseEnter={() => setHoveringUser(true)}
          onMouseLeave={() => setHoveringUser(false)}
        >
          {/* 用户头像和下拉菜单 */}
          {!siderCollapsed ? (
            <div className="w-full px-2">
              <div className="flex items-center justify-center mb-2">
                <Dropdown 
                  menu={{ items: userMenuItems, onClick: handleUserMenuClick }} 
                  placement="bottomRight"
                  trigger={['click']}
                  getPopupContainer={() => document.body}
                  overlayStyle={{ zIndex: 1050 }}
                >
                  <div className="cursor-pointer flex flex-col items-center">
                    <Avatar 
                      size={36} 
                      icon={<UserOutlined />} 
                      className="bg-blue-500"
                      style={{ backgroundColor: '#0D47A1' }}
                    />
                    <div className="mt-1 text-xs">用户名</div>
                  </div>
                </Dropdown>
              </div>
              <div className="flex justify-center text-xs w-full">
                <div className="flex flex-col items-center mx-1">
                  <span className="font-medium">{followCount}</span>
                  <span>关注</span>
                </div>
                <div className="flex flex-col items-center mx-1">
                  <span className="font-medium">{favoriteCount}</span>
                  <span>收藏</span>
                </div>
              </div>
            </div>
          ) : (
            <Dropdown 
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }} 
              placement="bottomRight"
              trigger={['click']}
              getPopupContainer={() => document.body}
              overlayStyle={{ zIndex: 1050 }}
            >
              <div className="cursor-pointer flex justify-center">
                <Avatar 
                  size={36} 
                  icon={<UserOutlined />} 
                  className="bg-blue-500"
                  style={{ backgroundColor: '#0D47A1' }}
                />
              </div>
            </Dropdown>
          )}
        </div>
        {/* 菜单区 */}
        <div
          className="compact-menu"
          onMouseEnter={() => setHoveringMenu(true)}
          onMouseLeave={() => setHoveringMenu(false)}
        >
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            style={{ height: '100%', borderRight: 0, background: '#FFFFFF' }}
            onClick={({ key }) => handleMenuClick(key)}
            items={[
              {
                key: '1',
                icon: <HomeOutlined />,
                label: '主页',
                style: getSelectedKey() === '1' ? { background: '#E3F2FD', borderRadius: '0 20px 20px 0', marginRight: '20px' } : {}
              },
              {
                key: '2',
                icon: <ExperimentOutlined />,
                label: '科研发现',
                style: getSelectedKey() === '2' ? { background: '#E3F2FD', borderRadius: '0 20px 20px 0', marginRight: '20px' } : {}
              },
              {
                key: '3',
                icon: <FileTextOutlined />,
                label: '个人文献库',
                style: getSelectedKey() === '3' ? { background: '#E3F2FD', borderRadius: '0 20px 20px 0', marginRight: '20px' } : {}
              },
              {
                key: '4',
                icon: <StarOutlined />,
                label: '收藏论文',
                style: getSelectedKey() === '4' ? { background: '#E3F2FD', borderRadius: '0 20px 20px 0', marginRight: '20px' } : {}
              },
              {
                key: '5',
                icon: <MessageOutlined />,
                label: 'AI对话',
                style: getSelectedKey() === '5' ? { background: '#E3F2FD', borderRadius: '0 20px 20px 0', marginRight: '20px' } : {}
              },
              {
                key: '6',
                icon: <ReadOutlined />,
                label: '论文列表',
                style: getSelectedKey() === '6' ? { background: '#E3F2FD', borderRadius: '0 20px 20px 0', marginRight: '20px' } : {}
              },
              {
                key: '7',
                icon: <BookOutlined />,
                label: '技术博客',
                style: getSelectedKey() === '7' ? { background: '#E3F2FD', borderRadius: '0 20px 20px 0', marginRight: '20px' } : {}
              }
            ]}
          />
        </div>
      </Sider>
      {/* 主内容区域 - 固定布局，不支持页面滚动 */}
      <Content
        className="transition-all duration-300"
        style={{
          marginLeft: siderCollapsed ? '60px' : '220px',
          height: '100vh',
          overflow: 'hidden',
          background: '#f6f8fa',
        }}
      >
        <div style={{ height: '100%', overflow: 'hidden' }}>
          {children}
        </div>
      </Content>
    </Layout>
  );
};

export default MainLayout;
