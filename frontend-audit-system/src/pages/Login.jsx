// pages/Login.jsx
import React, { useState } from 'react';
import { Form, Input, Button, message, Typography } from 'antd';
import axios from '../api/request';
import { saveTokenAndRole } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

console.log('Login page mounted');
export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async ({ username, password }) => {
    setLoading(true);
    try {
      const res = await axios.post('/staff/login', { username, password });
      saveTokenAndRole(res.data.token, res.data.role);
      message.success('登录成功');
      navigate('/review');
    } catch (err) {
      message.error(err.response?.data?.msg || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundImage: 'url("/1.jpg")',  // 背景图
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingRight: '10%',
      }}
    >
      <div
        style={{
          width: 360,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '40px 30px',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }}
      >
        <Typography.Title level={2}>工作人员登录</Typography.Title>
        <Form onFinish={onFinish} initialValues={{ username, password }}>
          <Form.Item name="username" rules={[{ required: true }]}>
            <Input placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true }]}>
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住我</Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            登录
          </Button>
        </Form>
      </div>
    </div>
  );
}
