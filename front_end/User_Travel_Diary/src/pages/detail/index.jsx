import Taro, { useShareAppMessage } from '@tarojs/taro';
import { View, Text, Image, ScrollView, Video, Swiper, SwiperItem, Button } from '@tarojs/components';
import { useState, useEffect } from 'react';
import { FontAwesome } from 'taro-icons';
import './index.scss';

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
            poster: detailData.cover
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
      if (!isWifi) {
        Taro.showModal({
          title: '流量提醒',
          content: '当前正在使用移动网络，继续播放将消耗流量。',
          confirmText: '继续播放',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              Taro.navigateTo({
                url: `/pages/videoPlayer/index?videoUrl=${encodeURIComponent(note.media[index].url)}&isWifi=${isWifi}`
              })
            }
          }
        })
      } else {
        Taro.navigateTo({
          url: `/pages/videoPlayer/index?videoUrl=${encodeURIComponent(note.media[index].url)}&isWifi=${isWifi}`
        })
      }
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
  useShareAppMessage((res) => {
    // if (res.from === 'button') {
    // 来自页面内转发按钮
    console.log(res)
    // }
    return {
      title: note?.title || '发现一篇精彩的游记',
      path: `/pages/detail/index?id=${id}`
    }
  })

  // const onShareAppMessage = () => {
  //   return {
  //     title: note?.title || '发现一篇精彩的游记',
  //     path: `/pages/detail/index?id=${id}`
  //   }
  // }

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
        url: `/pages/user/index?userId=${note.user_id}`
      })}>
        <Image className='avatar' src={note.avatar_url} />
        <View className='user-info'>
          <Text className='nickname'>{note.username}</Text>
        </View>
        <View className='follow-btn'>+关注</View>
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
      <View className='media-indicator'>
        {currentImageIndex + 1}/{note.media.length}
      </View>
      <View className='location'>
        <View className='location-icon'>
          <FontAwesome color='#fff' name="fal fa-map-marker-alt" size={12} />
        </View>
        <View className='location-content'>
          <Text>{note.location}</Text>
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
          <Text className='head'>出发时间</Text>
          <Text className='content'>{note.departure_time}</Text>
        </View>
        <View className='detail-item'>
          <Text className='head'>行程天数</Text>
          <Text className='content'>{note.days}</Text>
        </View>
        <View className='detail-item'>
          <Text className='head'>人均花费</Text>
          <Text className='content'>{note.avg_cost}</Text>
        </View>
        <View className='detail-item'>
          <Text className='head'>和谁出行</Text>
          <Text className='content'>{note.companions}</Text>
        </View>
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
        <View className='action-btn'>
          <Text className='action-icon'>
            <FontAwesome name="fa-solid fa-share" size={18} />
          </Text>
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