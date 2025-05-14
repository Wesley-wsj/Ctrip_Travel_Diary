import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ReviewList from './pages/ReviewList';
import ReviewDetail from './pages/ReviewDetail';
import DeletedList from './pages/DeletedList';
import HeaderBar from './components/HeaderBar';
import { getToken } from './utils/auth';
import { Layout } from 'antd';

function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        {getToken() && <HeaderBar />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/review" element={<PrivateRoute><ReviewList /></PrivateRoute>} />
          <Route path="/review/:id" element={<PrivateRoute><ReviewDetail /></PrivateRoute>} />
          <Route path="/deleted" element={<PrivateRoute><DeletedList /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/review" />} />
        </Routes>
      </Layout>
    </Router>
  );
}
