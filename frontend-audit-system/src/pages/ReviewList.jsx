import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, message, Spin } from 'antd';
import axios from '../api/request';
import { useNavigate } from 'react-router-dom';
import DiaryCard from '../components/DiaryCard';

export default function ReviewList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const res = await axios.get('/diaries');
      setList(res.data.filter(item => item.status === 'pending' && !item.is_deleted));
    } catch (err) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={2}>待审核游记</Typography.Title>
      {loading ? <Spin /> : (
        <Row gutter={[16, 16]}>
          {list.map(item => (
            <Col span={6} key={item.id}>
              <DiaryCard diary={item} onClick={() => navigate(`/review/${item.id}`)} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
