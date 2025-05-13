import { useState } from 'react';
import Taro from '@tarojs/taro';
import { useSearch } from './useSearch';

export function useUserNotes(userId) {
  const [total, setTotal] = useState(0);
  const [nickname, setNickname] = useState('未获取用户名');
  const [avatar, setAvatar] = useState('');

  const {
    key,
    list,
    loading,
    hasMore,
    setLastId,
    lastIdRef,
    setLoading,
    loadingRef,
    hasMoreRef,
    setHasMore,
    setKey,
    setList
  } = useSearch();

  // 获取用户游记列表
  const fetchTravelNotes = async (last_id) => {
    try {
      const res = await Taro.request({
        url: `http://121.43.34.217:5000/api/diaries/diaries-approved/${userId}?last_id=${last_id}`,
        method: 'GET',
      });
      
      if (last_id === 0) {
        setTotal(res.data.total);
        setNickname(res.data.data[0].username);
        setAvatar(res.data.data[0].avatar_url);
      }

      if (res.statusCode === 200) {
        return res.data.data.map(item => ({
          id: item.id,
          title: item.title,
          cover: item.images[0],
          height: 180 / +item.first_image_ratio,
          avatar: item.avatar_url,
          nickname: item.username
        }));
      }
      throw new Error(res.data.message || '请求失败');
    } catch (error) {
      console.error('API请求错误:', error);
      Taro.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
      return [];
    }
  };

  const loadData = async (last_id) => {
    setLoading(true);
    try {
      const res = await fetchTravelNotes(last_id);
      if (res.length > 0) {
        const maxId = Math.max(...res.map(item => item.id));
        setLastId(maxId);
      } else {
        setHasMore(false);
        return;
      }
      if (last_id === 0) {
        setKey(p => p + 1);
        setList(res);
      } else {
        setList(prev => [...prev, ...res]);
      }
    } finally {
      setLoading(false);
    }

    setTimeout(() => {
      const query = Taro.createSelectorQuery();
      query.select('.virtual-waterfall').fields({
        size: true,
        scrollOffset: true,
        scrollHeight: true
      }).exec((res) => {
        const [container] = res || [];
        if (!container) return;

        if (container.scrollHeight <= container.height + 5 &&
          hasMoreRef.current &&
          !loadingRef.current) {
          loadData(lastIdRef.current);
        }
      });
    }, 100);
  };

  return {
    total,
    nickname,
    avatar,
    list,
    loading,
    hasMore,
    key,
    loadData,
    lastIdRef
  };
}