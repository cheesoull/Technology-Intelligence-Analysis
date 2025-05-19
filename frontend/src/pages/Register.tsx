import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Tabs, Checkbox, message } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import '../styles/auth.css';

const { TabPane } = Tabs;

const Register: React.FC = () => {
  const [activeTab, setActiveTab] = useState('mobile');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
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

  const handleRegister = async () => {
    if (activeTab === 'mobile' && !mobile) {
      message.error('请输入手机号');
      return;
    }
    
    if (activeTab === 'email' && !email) {
      message.error('请输入邮箱');
      return;
    }
    
    if (!password) {
      message.error('请输入密码');
      return;
    }
    
    if (password !== confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    
    if (!verificationCode) {
      message.error('请输入验证码');
      return;
    }
    
    if (!agreeTerms) {
      message.error('请阅读并同意服务条款和隐私政策');
      return;
    }
    
    try {
      setLoading(true);
      
      let registerData = {};
      
      if (activeTab === 'mobile') {
        registerData = {
          mobile,
          password,
          code: verificationCode,
          type: 'mobile'
        };
      } else {
        registerData = {
          email,
          password,
          code: verificationCode,
          type: 'email'
        };
      }
      
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });
      
      const data = await response.json();
      
      if (data.code === 200) {
        message.success('注册成功');
        navigate('/login');
      } else {
        message.error(data.message || '注册失败');
      }
    } catch (error) {
      message.error('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>用户注册</h2>
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="auth-tabs"
        >
          <TabPane tab="手机号注册" key="mobile">
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
            
            <div className="form-item">
              <Input.Password
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                prefix={<span className="input-icon">🔒</span>}
                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </div>
            
            <div className="form-item">
              <Input.Password
                placeholder="请确认密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                prefix={<span className="input-icon">🔒</span>}
                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </div>
          </TabPane>
          
          <TabPane tab="邮箱注册" key="email">
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
            
            <div className="form-item">
              <Input.Password
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                prefix={<span className="input-icon">🔒</span>}
                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </div>
            
            <div className="form-item">
              <Input.Password
                placeholder="请确认密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                prefix={<span className="input-icon">🔒</span>}
                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </div>
          </TabPane>
        </Tabs>
        
        <div className="form-options">
          <Checkbox checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)}>
            我已阅读并同意服务条款和隐私政策
          </Checkbox>
        </div>
        
        <Button 
          type="primary" 
          block 
          onClick={handleRegister}
          loading={loading}
          className="register-button"
        >
          注册
        </Button>
        
        <div className="auth-footer">
          已有账号？ <Link to="/login">立即登录</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
