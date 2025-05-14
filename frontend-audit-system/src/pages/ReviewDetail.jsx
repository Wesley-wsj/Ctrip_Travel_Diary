import React, { useEffect, useState } from 'react';
import { Typography, Descriptions, Image, Button, Input, message, Space, Modal, Card, Divider, Tag } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/request';
import { getRole } from '../utils/auth';

function formatDateTime(datetime) {
  if (!datetime) return '无';
  const date = new Date(datetime);
  const pad = n => n.toString().padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}\u00A0\u00A0\u00A0\u00A0${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function ReviewDetail() {
  const { id } = useParams();
  const [diary, setDiary] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModal, setRejectModal] = useState(false);
  const navigate = useNavigate();
  const role = getRole();

  useEffect(() => {
    axios.get(`http://121.43.34.217:5000/api/diaries/${id}`).then(res => setDiary(res.data)).catch(() => message.error('加载失败'));
  }, [id]);

  const handleReview = async (action) => {
    if (action === 'reject') {
      setRejectModal(true);
      return;
    }
    try {
      await axios.post(`http://121.43.34.217:5000/api/diaries/${id}/review`, { action });
      message.success('审核成功');
      navigate('/review');
    } catch {
      message.error('操作失败');
    }
  };

  const handleRejectOk = async () => {
    if (!rejectReason) {
      message.warning('请填写拒绝原因');
      return;
    }
    try {
      await axios.post(`http://121.43.34.217:5000/api/diaries/${id}/review`, { action: 'reject', reason: rejectReason });
      message.success('已拒绝');
      setRejectModal(false);
      navigate('/review');
    } catch {
      message.error('操作失败');
    }
  };

  if (!diary) return null;

  // 权限和状态控制
  const canApprove = (role === 'admin' || role === 'reviewer') && diary.status === 'pending';
  const canReject = canApprove;
  const canDelete = role === 'admin';

  // 状态和删除用 Tag
  const statusColor = {
    pending: 'blue',
    approved: 'green',
    rejected: 'red',
    deleted: 'gray'
  }[diary.status] || 'default';

  const statusText = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    deleted: '已删除'
  }[diary.status] || diary.status;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 32, background: '#f5f6fa', minHeight: '100vh', fontSize: 18 }}>
      <Card style={{ width: 700, boxShadow: '0 2px 12px #0001', borderRadius: 12 }}>
        <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 0, fontSize: 32 }}>{diary.title}</Typography.Title>
        <Divider />
        <Descriptions column={1} bordered labelStyle={{ width: 120, fontWeight: 600 }}>
          <Descriptions.Item label="标题">{diary.title}</Descriptions.Item>
          <Descriptions.Item label="内容">{diary.content}</Descriptions.Item>
          <Descriptions.Item label="图片">
            <div
              style={{
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 2px 8px #0001',
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                minHeight: 90,
                minWidth: 180
              }}
            >
              {(diary.images || []).length === 0 ? (
                <div style={{
                  width: 72, height: 72, background: '#f0f0f0', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 56
                }}>
                  无图片
                </div>
              ) : (
                <Image.PreviewGroup
                  preview={{
                    nextTip: '下一张',
                    prevTip: '上一张'
                  }}
                >
                  {(diary.images || []).map((url, idx) => (
                    <Image
                      key={idx}
                      src={url}
                      width={72}
                      height={72}
                      style={{
                        objectFit: 'cover',
                        borderRadius: 8,
                        marginRight: 12,
                        boxShadow: '0 1px 4px #0001',
                        border: '1px solid #eee'
                      }}
                    />
                  ))}
                </Image.PreviewGroup>
              )}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="视频">
            {diary.video_url ? <a href={diary.video_url} target="_blank" rel="noreferrer">查看视频</a> : '无'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusColor}>{statusText}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="拒绝原因">{diary.reject_reason || '无'}</Descriptions.Item>
          <Descriptions.Item label="是否已删除">
            <Tag color={diary.is_deleted ? 'red' : 'green'}>{diary.is_deleted ? '是' : '否'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(diary.created_at)}</Descriptions.Item>
        </Descriptions>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          {canApprove && <Button type="primary" style={{ margin: '0 8px' }} onClick={() => handleReview('approve')}>通过</Button>}
          {canReject && <Button danger style={{ margin: '0 8px' }} onClick={() => handleReview('reject')}>拒绝</Button>}
          {canDelete && <Button danger type="dashed" style={{ margin: '0 8px' }} onClick={async () => {
            await axios.patch(`http://121.43.34.217:5000/api/diaries/${id}/delete`);
            message.success('逻辑删除成功');
            navigate('/review');
          }}>逻辑删除</Button>}
        </div>
        <Modal
          title="填写拒绝原因"
          open={rejectModal}
          onOk={handleRejectOk}
          onCancel={() => { setRejectModal(false); setRejectReason(''); }}
          okText="提交"
          cancelText="取消"
        >
          <Input.TextArea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={4}
            placeholder="请输入拒绝原因"
          />
        </Modal>
      </Card>
    </div>
  );
}
