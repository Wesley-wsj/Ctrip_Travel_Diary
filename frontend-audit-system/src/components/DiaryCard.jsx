// components/DiaryCard.jsx
import React from 'react';
import { Card, Tag, Button, Space } from 'antd';

export default function DiaryCard({ diary, onClick, showActions, role, onAction, showRestore, onRestore }) {
  const cover = diary.images?.[0]?.replace(/[\[\]"]/g, '');

  // 操作按钮权限和状态控制
  const canApprove = showActions && (role === 'admin' || role === 'reviewer') && diary.status === 'pending';
  const canReject = canApprove;
  const canDelete = showActions && role === 'admin';

  return (
    <Card
      hoverable
      onClick={onClick}
      title={diary.title}
      cover={<img alt="cover" src={cover} style={{ height: 160, objectFit: 'cover' }} />}
    >
      <div>{diary.content.slice(0, 40)}...</div>
      <Tag color={diary.status === 'pending' ? 'blue' : diary.status === 'approved' ? 'green' : 'red'}>
        {diary.status === 'pending' ? '待审核' : diary.status === 'approved' ? '已通过' : '未通过'}
      </Tag>
      {showActions && (
        <Space style={{ marginTop: 8 }}>
          {canApprove && <Button size="small" type="primary" onClick={e => { e.stopPropagation(); onAction(diary.id, 'approve'); }}>通过</Button>}
          {canReject && <Button size="small" danger onClick={e => { e.stopPropagation(); onAction(diary.id, 'reject'); }}>拒绝</Button>}
          {canDelete && <Button size="small" danger type="dashed" onClick={e => { e.stopPropagation(); onAction(diary.id, 'delete'); }}>删除</Button>}
        </Space>
      )}
      {showRestore && (
        <Button size="small" type="primary" onClick={e => { e.stopPropagation(); onRestore(diary.id); }} style={{ marginTop: 8 }}>
          恢复
        </Button>
      )}
    </Card>
  );
}
