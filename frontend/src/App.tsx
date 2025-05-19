import React from 'react';
import { Layout } from 'antd';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Home from './pages';
import PaperDetail from './pages/PaperDetail';
import Library from './pages/Library';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import MainLayout from './components/MainLayout';
import AIChat from './pages/AIChat';
import Papers from './pages/Papers';
import TechBlogs from './pages/TechBlogs';
import History from './pages/History';
import Report from './pages/Report';

const AppLayout = () => {
  return (
    <Layout className="min-h-screen">
      <MainLayout>
        <div className="container-fluid mx-auto py-15 pb-3 max-w-[2000px]">
          <Outlet />
        </div>
      </MainLayout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 认证页面 - 不使用主布局 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* AI对话系统页面 - 不使用主布局 */}
        <Route path="/chat" element={<AIChat />} />
        <Route path="/chat/:id" element={<AIChat />} />
        <Route path="/history" element={<History />} />
        <Route path="/report" element={<Report />} />
        <Route path="/report/:id" element={<Report />} />
        
        {/* 使用主布局的页面 */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/paper/:paperId" element={<PaperDetail />} />
          <Route path="/discovery" element={<div className="p-5">科研发现功能正在开发中...</div>} />
          <Route path="/library" element={<Library />} />
          <Route path="/favorites" element={<div className="p-5">收藏论文功能正在开发中...</div>} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/papers" element={<Papers />} />
          <Route path="/tech-blogs" element={<TechBlogs />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;