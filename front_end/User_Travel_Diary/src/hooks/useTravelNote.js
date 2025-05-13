import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';

export function useTravelNote(id) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      Taro.showToast({
        title: '无效的游记ID',
        icon: 'none'
      });
      setTimeout(() => Taro.navigateBack(), 1500);
      return;
    }

    fetchTravelNoteDetail(id);
  }, [id]);

  const fetchTravelNoteDetail = async (noteId) => {
    try {
      setLoading(true);
      const res = await Taro.request({
        url: `http://121.43.34.217:5000/api/diaries/approved/${noteId}`,
        method: 'GET',
      });

      if (res.statusCode === 200) {
        const detailData = res.data;
        detailData.media = [];
        if (detailData.video_url) {
          detailData.media.push({
            type: 'video',
            url: detailData.video_url,
            poster: detailData.cover
          });
        }
        detailData.images.forEach(item => {
          detailData.media.push({
            type: 'image',
            url: item
          });
        });
        setNote(detailData);
      } else {
        throw new Error(res.data.message || '请求失败');
      }
    } catch (error) {
      console.error('获取游记详情失败:', error);
      Taro.showToast({
        title: '获取游记详情失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  return { note, loading };
}