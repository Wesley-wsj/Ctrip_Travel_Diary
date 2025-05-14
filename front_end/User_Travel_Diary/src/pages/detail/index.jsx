import Taro, { useShareAppMessage } from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { useTravelNote } from '../../hooks/useTravelNote';
import { useState, useEffect } from 'react';
import { FontAwesome } from 'taro-icons';
import UserCard from '../../components/UserCard/UserCard';
import MediaSwiper from '../../components/MediaSwiper/MediaSwiper';
import './index.scss';

// 页面配置
Detail.config = {
  navigationBarTitleText: '游记详情',
  enableShareAppMessage: true
}

function Detail() {

  // 获取路由参数
  const { id } = Taro.getCurrentInstance().router?.params || {}
  const { note, loading } = useTravelNote(id);
  console.log(note)

  // 添加网络状态检测
  const [isWifi, setIsWifi] = useState(false)

  // 检测网络状态
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const res = await Taro.getNetworkType()
        setIsWifi(res.networkType === 'wifi')
        console.log(res.networkType)
      } catch (err) {
        console.error('获取网络状态失败:', err)
      }
    }
    checkNetwork()
  }, [])

  // 分享功能
  useShareAppMessage((res) => {
    return {
      title: note?.title || '发现一篇精彩的游记',
      path: `/pages/detail/index?id=${id}`,
    }
  })

  const handleShare = () => {
    Taro.navigateTo({
      url: `/pages/shareDetail/index?id=${id}`
    })
  }

  if (loading && !note) {
    return (
      <View className='detail-container loading'>
        <View className='loading-text'>加载中...</View>
      </View>
    )
  }

  if (!note) {
    return (
      <View className='detail-container empty'>
        <View className='empty-text'>未能获取游记信息</View>
      </View>
    )
  }

  return (
    <ScrollView className='detail-container' scrollY>
      <UserCard 
        avatar={note.avatar_url}
        username={note.username}
        userId={note.user_id}
      />

      <MediaSwiper media={note.media} isWifi={isWifi} />

      <View className='location'>
        <View className='location-icon'>
          <FontAwesome color='#fff' name="fal fa-map-marker-alt" size={12} />
        </View>
        <View className='location-content'>
          <Text>{note.location ? note.location.address : note.location}</Text>
        </View>
        <View className='location-angle'>
          <FontAwesome color='#c8c8c8' name="far fa-chevron-right" size={14} />
        </View>
      </View>

      {/* 游记标题和基本信息 */}
      <View className='header'>
        <Text className='title'>{note.title}</Text>
      </View>

      {/* 游记标签 */}
      <View className='detail-message'>
        <View className='detail-item'>
          <Text className='item-head'>出发时间</Text>
          <Text className='item-content'>{note.departure_time}</Text>
        </View>
        <View className='detail-item'>
          <Text className='item-head'>行程天数</Text>
          <Text className='item-content'>{note.days}</Text>
        </View>
        <View className='detail-item'>
          <Text className='item-head'>人均花费</Text>
          <Text className='item-content'>{note.avg_cost}</Text>
        </View>
        <View className='detail-item'>
          <Text className='item-head'>和谁出行</Text>
          <Text className='item-content'>{note.companions}</Text>
        </View>
      </View>

      {/* 游记正文内容 */}
      <View className='detail-content'>
        {note.content.split('\n').map((paragraph, i) => (
          <Text key={i} className='paragraph'>
            {paragraph}
            {i !== note.content.split('\n').length - 1 && '\n'}
          </Text>
        ))}
      </View>

      {/* 发布时间 */}
      <View className='publish-time'>
        发布于 {note.created_at.slice(0, 10)}
      </View>

      {/* 底部操作栏 */}
      <View className='action-bar'>
        <View className='action-btn'>
          <Text className='action-icon'>
            <FontAwesome color='red' name="far fa-heart" size={18} />
          </Text>
          <Text>点赞</Text>
        </View>
        <View className='action-btn'>
          <Text className='action-icon'>
            <FontAwesome name="fa fa-comments" size={18} />
          </Text>
          <Text>评论</Text>
        </View>
        <View className='action-btn'>
          <Text className='action-icon'>
            <FontAwesome color='rgb(252, 213, 63)' name="fa fa-star" size={18} />
          </Text>
          <Text>收藏</Text>
        </View>
        <View className='action-btn' onClick={handleShare}>
          <Text className='action-icon'>
            <FontAwesome name="fa-solid fa-share" size={18} />
          </Text>
          <Text>分享</Text>
        </View>
      </View>
    </ScrollView >
  )
}

export default Detail

export const config = definePageConfig({
  navigationBarTitleText: '游记详情',
});