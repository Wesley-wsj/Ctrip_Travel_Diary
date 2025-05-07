// src/pages/detail/index.js
import Taro from '@tarojs/taro'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './index.css'

// 页面配置
Detail.config = {
  navigationBarTitleText: '游记详情',
  enableShareAppMessage: true
}

function Detail() {
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // 获取路由参数
  const { id } = Taro.getCurrentInstance().router?.params || {}

  useEffect(() => {
    if (!id) {
      Taro.showToast({
        title: '无效的游记ID',
        icon: 'none'
      })
      setTimeout(() => Taro.navigateBack(), 1500)
      return
    }
    
    fetchTravelNoteDetail(id)
  }, [id])

  // 获取游记详情
  const fetchTravelNoteDetail = async (noteId) => {
    try {
      setLoading(true)
      
      // API请求延迟
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // 模拟数据替换为API调用
      const mockData = {
        id: noteId,
        title: `【${noteId}】黄山三日游，云海日出尽收眼底`,
        content: `这次黄山之行真是令人难忘！我们选择了前山上后山下的路线，第一天住在光明顶附近，方便第二天看日出。
        
第二天凌晨4点就起床了，虽然很冷但看到日出的那一刻觉得一切都值得了！云海翻滚，太阳缓缓升起，美得无法用语言形容。
        
第三天我们去了西海大峡谷，乘坐网红小火车，峡谷风光壮丽无比。建议大家一定要穿舒适的登山鞋，带够水和零食。`,
        images: [
          'https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=800&q=80',
          'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&q=80',
          'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=800&q=80',
          'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80'
        ],
        location: '安徽黄山',
        travelDate: '2023-10-01 至 2023-10-03',
        createdAt: '2023-10-05',
        likes: 245,
        comments: 36,
        views: 1200,
        user: {
          id: 'user-123',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          nickname: '旅行达人小王',
          bio: '走过30+国家，分享真实旅行体验'
        },
        tags: ['登山', '日出', '云海', '摄影']
      }
      
      setNote(mockData)
    } catch (error) {
      console.error('获取游记详情失败:', error)
      Taro.showToast({
        title: '获取游记详情失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 预览图片
  const previewImages = (index) => {
    Taro.previewImage({
      current: note.images[index],
      urls: note.images
    })
  }

  // 分享功能
  const onShareAppMessage = () => {
    return {
      title: note?.title || '发现一篇精彩的游记',
      path: `/pages/detail/index?id=${id}`
    }
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
      {/* 游记标题和基本信息 */}
      <View className='header'>
        <Text className='title'>{note.title}</Text>
        <View className='meta'>
          <Text className='location'>{note.location}</Text>
          <Text className='date'>{note.travelDate}</Text>
        </View>
      </View>
      
      {/* 用户信息 */}
      <View className='user-card' onClick={() => Taro.navigateTo({
        url: `/pages/user/index?id=${note.user.id}`
      })}>
        <Image className='avatar' src={note.user.avatar} />
        <View className='user-info'>
          <Text className='nickname'>{note.user.nickname}</Text>
          <Text className='bio'>{note.user.bio}</Text>
        </View>
        <View className='follow-btn'>关注</View>
      </View>
      
      {/* 游记图片轮播 */}
      <View className='image-swiper'>
        <ScrollView className='image-list' scrollX>
          {note.images.map((img, index) => (
            <Image 
              key={index}
              className='content-image' 
              src={img} 
              mode='aspectFill'
              onClick={() => previewImages(index)}
            />
          ))}
        </ScrollView>
        <View className='image-indicator'>
          {currentImageIndex + 1}/{note.images.length}
        </View>
      </View>
      
      {/* 游记标签 */}
      <View className='tags'>
        {note.tags.map((tag, index) => (
          <View key={index} className='tag'>{tag}</View>
        ))}
      </View>
      
      {/* 游记正文内容 */}
      <View className='content'>
        {note.content.split('\n').map((paragraph, i) => (
          <Text key={i} className='paragraph'>
            {paragraph}
            {i !== note.content.split('\n').length - 1 && '\n'}
          </Text>
        ))}
      </View>
      
      {/* 游记统计信息 */}
      <View className='stats'>
        <View className='stat-item'>
          <Text className='stat-icon'>👁️</Text>
          <Text className='stat-value'>{note.views}</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-icon'>❤️</Text>
          <Text className='stat-value'>{note.likes}</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-icon'>💬</Text>
          <Text className='stat-value'>{note.comments}</Text>
        </View>
      </View>
      
      {/* 发布时间 */}
      <View className='publish-time'>
        发布于 {note.createdAt}
      </View>
      
      {/* 底部操作栏 */}
      <View className='action-bar'>
        <View className='action-btn'>
          <Text className='action-icon'>❤️</Text>
          <Text>点赞</Text>
        </View>
        <View className='action-btn'>
          <Text className='action-icon'>💬</Text>
          <Text>评论</Text>
        </View>
        <View className='action-btn'>
          <Text className='action-icon'>⭐</Text>
          <Text>收藏</Text>
        </View>
        <View className='action-btn'>
          <Text className='action-icon'>↗️</Text>
          <Text>分享</Text>
        </View>
      </View>
    </ScrollView>
  )
}

export default Detail