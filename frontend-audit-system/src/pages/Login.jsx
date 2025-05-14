import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  Checkbox,
  Tabs,
  message,
  Image
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MobileOutlined,
  MailOutlined
} from '@ant-design/icons';
import axios from '../api/request';
import { saveTokenAndRole } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

const { TabPane } = Tabs;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [tab, setTab] = useState('password');

  useEffect(() => {
    const saved = localStorage.getItem('loginInfo');
    if (saved) {
      const { username, password } = JSON.parse(saved);
      form.setFieldsValue({ username, password, remember: true });
    }
  }, [form]);

  const onFinish = async (values) => {
    const { username, password, remember, agreement } = values;
    if (!agreement) {
      message.warning('请先同意协议条款');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('http://121.43.34.217:5000/api/staff/login', { username, password }, {
        headers: { 'Content-Type': 'application/json' }
      });
      saveTokenAndRole(res.data.token, res.data.role);
      if (remember) {
        localStorage.setItem('loginInfo', JSON.stringify({ username, password }));
      } else {
        localStorage.removeItem('loginInfo');
      }
      message.success('登录成功');
      navigate('/review');
    } catch (err) {
      const msg = err.response?.data?.msg;
      if (msg) {
        message.error(msg);
      } else {
        message.error('登录失败');
      }
      console.error('登录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'flex-end',
        backgroundImage: 'url("/4.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div
        style={{
          width: 400,
          backgroundColor: 'rgba(255,255,255,0.95)',
          padding: 40,
          borderRadius: 12,
          marginRight: 80,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/5.jpg" alt="logo" style={{ height: 60, marginBottom: 8 }} />
          <Typography.Title level={3}>携程审核系统</Typography.Title>
        </div>

        <Tabs defaultActiveKey="password">
          <TabPane tab="密码登录" key="password">
            <Form form={form} onFinish={onFinish} layout="vertical">
              <Form.Item
                name="username"
                label="用户名 / 邮箱"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入用户名或邮箱" />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
              </Form.Item>
              <Form.Item name="remember" valuePropName="checked">
                <Checkbox>记住我</Checkbox>
              </Form.Item>
              <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[{ required: true, message: '请勾选协议' }]}
              >
                <Checkbox>
                  我已阅读并同意 <a href="#">隐私协议与服务条款</a>
                </Checkbox>
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                登录
              </Button>
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <a href="#">忘记密码？</a>
              </div>
            </Form>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
}