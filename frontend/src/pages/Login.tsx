import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Tabs, Checkbox, message } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import '../styles/auth.css';

const { TabPane } = Tabs;

const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState('mobile');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (!mobile && activeTab === 'mobile') {
      message.error('请输入手机号');
      return;
    }
    
    if (!email && activeTab === 'email') {
      message.error('请输入邮箱');
      return;
    }
    
    try {
      setLoading(true);
      const target = activeTab === 'mobile' ? mobile : email;
      const response = await fetch('/api/verification/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target,
          type: activeTab
        }),
      });
      
      const data = await response.json();
      
      if (data.code === 200) {
        message.success('验证码已发送');
        // 开始倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        message.error(data.message || '发送验证码失败');
      }
    } catch (error) {
      message.error('发送验证码失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (activeTab === 'mobile' && !mobile) {
      message.error('请输入手机号');
      return;
    }
    
    if (activeTab === 'email' && !email) {
      message.error('请输入邮箱');
      return;
    }
    
    if (activeTab === 'account' && !password) {
      message.error('请输入密码');
      return;
    }
    
    if ((activeTab === 'mobile' || activeTab === 'email') && !verificationCode) {
      message.error('请输入验证码');
      return;
    }
    
    try {
      setLoading(true);
      
      let loginData = {};
      
      if (activeTab === 'mobile') {
        loginData = {
          mobile,
          code: verificationCode,
          type: 'mobile'
        };
      } else if (activeTab === 'email') {
        loginData = {
          email,
          code: verificationCode,
          type: 'email'
        };
      } else {
        loginData = {
          username: email || mobile,
          password,
          type: 'account'
        };
      }
      
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
      
      const data = await response.json();
      
      if (data.code === 200) {
        message.success('登录成功');
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        navigate('/');
      } else {
        message.error(data.message || '登录失败');
      }
    } catch (error) {
      message.error('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>用户登录</h2>
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="auth-tabs"
        >
          <TabPane tab="短信登录" key="mobile">
            <div className="form-item">
              <Input
                placeholder="请输入手机号"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                prefix={<span className="input-icon">📱</span>}
              />
            </div>
            
            <div className="form-item verification-code">
              <Input
                placeholder="请输入验证码"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <Button 
                type="primary" 
                onClick={handleSendCode}
                disabled={countdown > 0}
                loading={loading && countdown === 0}
              >
                {countdown > 0 ? `${countdown}s` : '发送验证码'}
              </Button>
            </div>
          </TabPane>
          
          <TabPane tab="账号登录" key="account">
            <div className="form-item">
              <Input
                placeholder="请输入邮箱或手机号"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                prefix={<span className="input-icon">👤</span>}
              />
            </div>
            
            <div className="form-item">
              <Input.Password
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                prefix={<span className="input-icon">🔒</span>}
                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </div>
          </TabPane>
        </Tabs>
        
        <div className="form-options">
          <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}>
            保持登录状态
          </Checkbox>
          <Link to="/forgot-password" className="forgot-password">
            忘记密码？
          </Link>
        </div>
        
        <Button 
          type="primary" 
          block 
          onClick={handleLogin}
          loading={loading}
          className="login-button"
        >
          登录
        </Button>
        
        <div className="auth-footer">
          还没有账号？ <Link to="/register">立即注册</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
