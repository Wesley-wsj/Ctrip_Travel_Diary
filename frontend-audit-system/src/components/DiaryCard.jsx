// components/DiaryCard.jsx
import React from 'react';
import { Card, Tag } from 'antd';

export default function DiaryCard({ diary, onClick }) {
  const cover = diary.images?.[0]?.replace(/[\[\]"]/g, '');

  return (
    <Card
      hoverable
      onClick={onClick}
      title={diary.title}
      cover={<img alt="cover" src={cover} style={{ height: 160, objectFit: 'cover' }} />}
    >
      <div>{diary.content.slice(0, 40)}...</div>
      <Tag color={diary.status === 'pending' ? 'blue' : diary.status === 'approved' ? 'green' : 'red'}>
        {diary.status}
      </Tag>
    </Card>
  );
}
