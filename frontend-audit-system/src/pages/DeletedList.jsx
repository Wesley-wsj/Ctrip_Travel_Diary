import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, message, Spin } from 'antd';
import axios from '../api/request';
import DiaryCard from '../components/DiaryCard';

export default function DeletedList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/diaries').then(res => {
      const deleted = res.data.filter(d => d.is_deleted);
      setList(deleted);
    }).catch(() => message.error('获取失败')).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={2}>已删除的游记</Typography.Title>
      {loading ? <Spin /> : (
        <Row gutter={[16, 16]}>
          {list.map(item => (
            <Col span={6} key={item.id}>
              <DiaryCard diary={item} onClick={() => {}} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
