import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, message, Spin } from 'antd';
import axios from '../api/request';
import DiaryCard from '../components/DiaryCard';
import { getRole } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function DeletedList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = getRole();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/diaries').then(res => {
      const deleted = res.data.filter(d => d.is_deleted);
      setList(deleted);
    }).catch(() => message.error('获取失败')).finally(() => setLoading(false));
  }, []);

  const handleRestore = async (id) => {
    try {
      await axios.patch(`/diaries/${id}/restore`);
      message.success('恢复成功');
      setList(list => list.filter(item => item.id !== id));
    } catch {
      message.error('恢复失败');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={2}>已删除的游记</Typography.Title>
      {loading ? <Spin /> : (
        <Row gutter={[16, 16]}>
          {list.map(item => (
            <Col span={6} key={item.id}>
              <DiaryCard
                diary={item}
                onClick={() => navigate(`/review/${item.id}`)}
                showRestore={role === 'admin'}
                onRestore={handleRestore}
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
