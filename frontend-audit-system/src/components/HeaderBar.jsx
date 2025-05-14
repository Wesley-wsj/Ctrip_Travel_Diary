// components/HeaderBar.jsx
import React from 'react';
import { Layout, Menu, Button, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getRole } from '../utils/auth';

const { Header } = Layout;

export default function HeaderBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getRole();

  const menuItems = [
    { key: '/review', label: '待审核游记' },
    ...(role === 'admin' ? [{ key: '/deleted', label: '逻辑删除游记' }] : [])
  ];

  const handleMenuClick = ({ key }) => navigate(key);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Header style={{ backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
      />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Typography.Text type="secondary" style={{ marginRight: 16 }}>
          当前身份：{role}
        </Typography.Text>
        <Button onClick={handleLogout}>退出登录</Button>
      </div>
    </Header>
  );
}
