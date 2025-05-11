import Taro from '@tarojs/taro'
import { View, Text, Image, ScrollView, Video, Swiper, SwiperItem } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './index.scss'

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

    // 监听网络变化
    const listener = Taro.onNetworkStatusChange(res => {
      setIsWifi(res.networkType === 'wifi')
    })
  }, [])

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
      const res = await Taro.request({
        url: `http://121.43.34.217:5000/api/diaries/approved/${id}`,
        method: 'GET',
      })
      console.log(res)
      if (res.statusCode === 200) {
        const detailData = res.data
        detailData.media = []
        if (detailData.video_url) {
          detailData.media.push({
            type: 'video',
            url: detailData.video_url,
            poster: 'https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=800&q=80'
          })
        }
        detailData.images.forEach(item => {
          detailData.media.push({
            type: 'image',
            url: item
          })
        })
        console.log(detailData)
        setNote(detailData)
      } else {
        throw new Error(res.data.message || '请求失败')
      }
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

  const previewMedia = (index) => {
    if (note.media[index].type === 'video') {
      // 视频全屏播放
      Taro.navigateTo({
        url: `/pages/videoPlayer/index?videoUrl=${encodeURIComponent(note.media[index].url)}`
      })
    } else {
      // 图片预览
      const imageUrls = note.media
        .filter(item => item.type === 'image')
        .map(item => item.url)

      Taro.previewImage({
        current: note.media[index].url,
        urls: imageUrls
      })
    }
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
      {/* 用户信息 */}
      <View className='user-card' onClick={() => Taro.navigateTo({
        url: `/pages/user/index?id=${note.user_id}`
      })}>
        <Image className='avatar' src={note.avatar_url} />
        <View className='user-info'>
          <Text className='nickname'>{note.username}</Text>
        </View>
        <View className='follow-btn'>关注</View>
      </View>

      <Swiper
        className='media-swiper'
        indicatorDots={note.media.length > 1} // 多个媒体时才显示指示点
        indicatorColor='rgba(255, 255, 255, 0.6)'
        indicatorActiveColor='#ffffff'
        circular
        interval={3000}
        onChange={(e) => setCurrentImageIndex(e.detail.current)}
      >
        {note.media.map((item, index) => (
          <SwiperItem key={index}>
            {item.type === 'video' ? (
              <View className='video-container' onClick={() => previewMedia(index)}>
                {/* WiFi下自动播放的静音视频 */}
                {isWifi && (
                  <Video
                    className='content-video'
                    src={item.url}
                    poster={item.poster}
                    controls={false}
                    autoplay
                    loop
                    muted
                    objectFit='cover'
                    style={{ pointerEvents: 'none' }}
                  />
                )}
                {/* 覆盖层，用于点击跳转 */}
                {!isWifi && <View
                  className='video-overlay'
                  style={{
                    backgroundImage: `url(${item.poster})`,
                    backgroundSize: 'cover',
                  }}
                // onClick={() => previewMedia(index)}
                >
                  {!isWifi && <View className='play-icon'>▶</View>}
                  {/* <View className='media-tag'>{item.type === 'video' ? '视频' : '图片'}</View> */}
                </View>}
              </View>
            ) : (
              <Image
                className='content-image'
                src={item.url}
                mode='aspectFill'
                onClick={() => previewMedia(index)}
              />
            )}
          </SwiperItem>
        ))}
      </Swiper>
      {/* 游记标题和基本信息 */}
      <View className='header'>
        <Text className='title'>{note.title}</Text>
        <View className='meta'>
          <Text className='location'>{note.location}</Text>
          <Text className='date'>{note.travelDate}</Text>
        </View>
      </View>
      {/* 游记标签 */}
      {/* <View className='tags'>
        {note.tags.map((tag, index) => (
          <View key={index} className='tag'>{tag}</View>
        ))}
      </View> */}

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
    </ScrollView >
  )
}

definePageConfig({
  enableShareAppMessage: true,
})


export default Detail