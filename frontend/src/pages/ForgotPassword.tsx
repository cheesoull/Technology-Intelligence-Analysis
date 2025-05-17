import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Tabs, message } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import '../styles/auth.css';

const { TabPane } = Tabs;

const ForgotPassword: React.FC = () => {
  const [activeTab, setActiveTab] = useState('mobile');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleResetPassword = async () => {
    if (activeTab === 'mobile' && !mobile) {
      message.error('请输入手机号');
      return;
    }
    
    if (activeTab === 'email' && !email) {
      message.error('请输入邮箱');
      return;
    }
    
    if (!verificationCode) {
      message.error('请输入验证码');
      return;
    }
    
    if (!newPassword) {
      message.error('请输入新密码');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    
    try {
      setLoading(true);
      
      let resetData = {};
      
      if (activeTab === 'mobile') {
        resetData = {
          target: mobile,
          code: verificationCode,
          type: 'mobile',
          password: newPassword
        };
      } else {
        resetData = {
          target: email,
          code: verificationCode,
          type: 'email',
          password: newPassword
        };
      }
      
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resetData),
      });
      
      const data = await response.json();
      
      if (data.code === 200) {
        message.success('密码重置成功');
        // 跳转到登录页
        navigate('/login');
      } else {
        message.error(data.message || '密码重置失败');
      }
    } catch (error) {
      message.error('密码重置失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>重置密码</h2>
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="auth-tabs"
        >
          <TabPane tab="手机号验证" key="mobile">
            <div className="form-item">
              <Input
                placeholder="请输入手机号或邮箱"
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
          
          <TabPane tab="邮箱验证" key="email">
            <div className="form-item">
              <Input
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                prefix={<span className="input-icon">✉️</span>}
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
        </Tabs>
        
        <div className="form-item">
          <Input.Password
            placeholder="请输入新密码"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            prefix={<span className="input-icon">🔒</span>}
            iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </div>
        
        <div className="form-item">
          <Input.Password
            placeholder="请确认新密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            prefix={<span className="input-icon">🔒</span>}
            iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </div>
        
        <Button 
          type="primary" 
          block 
          onClick={handleResetPassword}
          loading={loading}
          className="reset-button"
        >
          验证
        </Button>
        
        <div className="auth-footer">
          <Link to="/login">返回登录</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
