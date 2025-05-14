import React, { useEffect, useState } from 'react';
import { Layout, Menu, Input, DatePicker, Button, Typography, Space, Avatar, Table, Tag, message, Modal } from 'antd';
import axios from '../api/request';
import { useNavigate } from 'react-router-dom';
import { getRole } from '../utils/auth';
import {
  AppstoreOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';

const { Sider, Content, Header } = Layout;
const { RangePicker } = DatePicker;

const statusOptions = [
  { key: 'all', label: '全部', icon: <AppstoreOutlined /> },
  { key: 'pending', label: '待审核', icon: <ClockCircleOutlined /> },
  { key: 'approved', label: '已通过', icon: <CheckCircleOutlined /> },
  { key: 'rejected', label: '已拒绝', icon: <CloseCircleOutlined /> },
  { key: 'deleted', label: '已删除', icon: <DeleteOutlined /> }
];

function formatDateTime(datetime) {
  if (!datetime) return '无';
  const date = new Date(datetime);
  const pad = n => n.toString().padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}\u00A0\u00A0\u00A0\u00A0${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function ReviewList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [rejectModal, setRejectModal] = useState({ visible: false, id: null });
  const [rejectReason, setRejectReason] = useState('');
  const navigate = useNavigate();
  const role = getRole();
  const userInfo = { username: 'admin', avatar: '', role }; // 可根据实际获取
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  // 获取游记数据
  const fetchData = async () => {
    setLoading(true);
    try {
      let url = 'http://121.43.34.217:5000/api/diaries';
      if (status === 'pending') url = 'http://121.43.34.217:5000/api/diaries/review-list';
      else if (status === 'approved') url = 'http://121.43.34.217:5000/api/diaries/reviewer-approved-list';
      // else if (status === 'approved') url = 'http://121.43.34.217:5000/api/diaries/approved-list';
      else if (status === 'rejected') url = 'http://121.43.34.217:5000/api/diaries/rejected-list';
      else if (status === 'deleted') url = 'http://121.43.34.217:5000/api/diaries/deleted-list';
      const params = {
        keyword,
        start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
        end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
        page,
        page_size: pageSize
      };
      let res;
      if (keyword || dateRange) {
        res = await axios.post('http://121.43.34.217:5000/api/diaries/reviewer-search', {
          ...params,
          status: status === 'all' ? undefined : status
        });
        setList(res.data.data || []);
        setTotal(res.data.total || 0);
      } else {
        res = await axios.get(url, { params });
        let data = res.data.data || res.data;
        setList(data);
        setTotal(res.data.total || 0);
      }
    } catch {
      message.error('获取失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [status, page, pageSize]);

  const handleSearch = () => {
    fetchData();
  };

  const handleAction = async (id, action) => {
    if (action === 'approve') {
      await axios.post(`http://121.43.34.217:5000/api/diaries/${id}/review`, { action: 'approve' });
      message.success('审核通过');
      fetchData();
    } else if (action === 'reject') {
      setRejectModal({ visible: true, id });
    } else if (action === 'delete') {
      await axios.patch(`http://121.43.34.217:5000/api/diaries/${id}/delete`);
      message.success('删除成功');
      fetchData();
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`http://121.43.34.217:5000/api/diaries/${id}/review`, { action: 'approve' });
      message.success('审核通过');
      fetchData();
    } catch {
      message.error('操作失败');
    }
  };

  const openRejectModal = (id) => {
    setRejectModal({ visible: true, id });
  };

  const handleRejectOk = async () => {
    if (!rejectReason) {
      message.warning('请填写拒绝原因');
      return;
    }
    try {
      await axios.post(`http://121.43.34.217:5000/api/diaries/${rejectModal.id}/review`, {
        action: 'reject',
        reason: rejectReason
      });
      message.success('已拒绝');
      setRejectModal({ visible: false, id: null });
      setRejectReason('');
      fetchData();
    } catch {
      message.error('操作失败');
    }
  };

  const handleRecover = async (id) => {
    try {
      await axios.patch(`http://121.43.34.217:5000/api/diaries/${id}/recover`);
      message.success('恢复成功');
      fetchData();
    } catch {
      message.error('恢复失败');
    }
  };

  const columns = [
    {
      title: '封面',
      dataIndex: 'cover',
      key: 'cover',
      render: (cover, record) => {
        if (cover) {
          return <img src={cover} alt="封面" style={{ width: 60, height: 40, objectFit: 'cover' }} />;
        }
        // If no cover but has images, show first image
        if (record.images && record.images.length > 0) {
          return <img src={record.images[0]} alt="封面" style={{ width: 60, height: 40, objectFit: 'cover' }} />;
        }
        return '无';
      }
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'blue';
        let text = '待审核';
        if (status === 'approved') {
          color = 'green';
          text = '已通过';
        }
        if (status === 'rejected') {
          color = 'red';
          text = '已拒绝';
        }
        if (status === 'pending') {
          color = 'blue';
          text = '待审核';
        }
        if (status === 'deleted') {
          color = 'gray';
          text = '已删除';
        }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      sortOrder: sortField === 'created_at' ? sortOrder : null,
      render: (created_at) => formatDateTime(created_at)
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/review/${record.id}`)}>查看</Button>
          {( (role === 'admin' || role === 'reviewer') && status === 'pending') && (
            <>
              <Button size="small" type="primary" onClick={() => handleApprove(record.id)}>通过</Button>
              <Button size="small" danger onClick={() => openRejectModal(record.id)}>拒绝</Button>
            </>
          )}
          {role === 'admin' && status !== 'deleted' && (
            <Button size="small" danger onClick={() => handleAction(record.id, 'delete')}>删除</Button>
          )}
          {role === 'admin' && status === 'deleted' && (
            <Button size="small" type="primary" onClick={() => handleRecover(record.id)}>恢复</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} style={{ background: '#fff' }}>
        <div style={{ marginTop: 60 }}>
          <Menu
            mode="inline"
            selectedKeys={[status]}
            style={{ height: '100%', borderRight: 0 }}
            onClick={e => setStatus(e.key)}
            items={
              role === 'reviewer'
                ? statusOptions.filter(item => item.key !== 'deleted')
                : statusOptions
            }
          />
        </div>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Space>
            <Avatar src={userInfo.avatar} />
            <span>{userInfo.username}</span>
            <span style={{ color: '#888' }}>({userInfo.role})</span>
          </Space>
        </Header>
        <Content style={{ margin: 24, background: '#fff', padding: 24 }}>
          <Space style={{ marginBottom: 16 }}>
            <Input.Search
              placeholder="搜索关键词"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 200 }}
            />
            <RangePicker onChange={setDateRange} />
            <Button type="primary" onClick={handleSearch}>搜索</Button>
          </Space>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={loading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
              position: ['bottomRight']
            }}
            onChange={(pagination, filters, sorter) => {
              if (sorter && sorter.field === 'created_at') {
                setSortField('created_at');
                setSortOrder(sorter.order);
              } else {
                setSortField(null);
                setSortOrder(null);
              }
            }}
          />
          <Modal
            title="填写拒绝原因"
            open={rejectModal.visible}
            onOk={handleRejectOk}
            onCancel={() => { setRejectModal({ visible: false, id: null }); setRejectReason(''); }}
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
        </Content>
      </Layout>
    </Layout>
  );
}
