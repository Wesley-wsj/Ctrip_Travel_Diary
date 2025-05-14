import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// 全局样式
import './style.css';

// Ant Design 样式（确保你已安装 antd）
import 'antd/dist/reset.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);