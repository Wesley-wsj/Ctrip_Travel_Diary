import React, { useEffect, useState } from 'react';
import { Typography, Descriptions, Image, Button, Input, message, Space } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/request';
import { getRole } from '../utils/auth';

export default function ReviewDetail() {
  const { id } = useParams();
  const [diary, setDiary] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const navigate = useNavigate();
  const role = getRole();

  useEffect(() => {
    axios.get(`/diaries/${id}`).then(res => setDiary(res.data)).catch(() => message.error('加载失败'));
  }, [id]);

  const handleReview = async (status) => {
    try {
      await axios.patch(`/diaries/${id}/review`, {
        status,
        reject_reason: status === 'rejected' ? rejectReason : undefined
      });
      message.success('审核成功');
      navigate('/review');
    } catch {
      message.error('操作失败');
    }
  };

  if (!diary) return null;

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3}>{diary.title}</Typography.Title>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="作者 ID">{diary.user_id}</Descriptions.Item>
        <Descriptions.Item label="内容">{diary.content}</Descriptions.Item>
        <Descriptions.Item label="图片">
          <Image.PreviewGroup>
            {diary.images.map((url, idx) => (
              <Image key={idx} width={100} src={url} />
            ))}
          </Image.PreviewGroup>
        </Descriptions.Item>
        <Descriptions.Item label="视频">
          {diary.video_url ? <a href={diary.video_url} target="_blank" rel="noreferrer">查看视频</a> : '无'}
        </Descriptions.Item>
      </Descriptions>

      <Space style={{ marginTop: 24 }}>
        <Button type="primary" onClick={() => handleReview('approved')}>通过</Button>
        <Button danger onClick={() => handleReview('rejected')}>拒绝</Button>
        <Input.TextArea
          placeholder="填写拒绝原因"
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          rows={3}
          style={{ width: 300 }}
        />
        {role === 'admin' && (
          <Button danger type="dashed" onClick={async () => {
            await axios.delete(`/diaries/${id}`);
            message.success('逻辑删除成功');
            navigate('/review');
          }}>逻辑删除</Button>
        )}
      </Space>
    </div>
  );
}
