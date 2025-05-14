import Taro from '@tarojs/taro'
import { View, Text, Image, ScrollView, Video, Swiper, SwiperItem } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { FontAwesome } from 'taro-icons'
import './index.scss'

// 页面配置
DiaryDetail.config = {
  navigationBarTitleText: '游记详情',
  enableShareAppMessage: true
}

function DiaryDetail() {
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isOwner, setIsOwner] = useState(false)
  const [debugInfo, setDebugInfo] = useState({})

  // 获取路由参数
  const { id, status } = Taro.getCurrentInstance().router?.params || {}

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

  // 先加载笔记详情
  useEffect(() => {
    if (!id) {
      Taro.showToast({
        title: '无效的游记ID',
        icon: 'none'
      })
      setTimeout(() => Taro.navigateBack(), 1500)
      return
    }

    fetchTravelNoteDetail(id, status)
  }, [id, status])

  // 在笔记加载完成后检查所有权
  useEffect(() => {
    if (note) {
      checkIfOwner()
    }
  }, [note])

  // 检查是否是笔记的所有者
  const checkIfOwner = async () => {
    try {
      // 获取当前用户信息
      const currentUser = Taro.getStorageSync('currentUser')
      console.log('currentUser:', currentUser)
      
      // 如果有笔记数据和当前用户，则比较用户ID
      if (note && currentUser && currentUser.id) {
        console.log('比较用户ID - 当前用户:', currentUser.id, '笔记用户ID:', note.user_id)
        // 转换为字符串后比较，避免类型不匹配问题
        setIsOwner(String(currentUser.id) === String(note.user_id))
      } else {
        setIsOwner(false)
      }
    } catch (error) {
      console.error('检查所有者状态失败:', error)
      setIsOwner(false)
    }
  }

  // 获取游记详情
  const fetchTravelNoteDetail = async (noteId, noteStatus) => {
    try {
      setLoading(true)

      const apiPath = noteStatus
      console.log('apiPath:', apiPath)
      
      // API请求
      const res = await Taro.request({
        url: `http://121.43.34.217:5000/api/diaries/${apiPath}/${noteId}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      })
      
      console.log('API响应状态码:', res.statusCode)
      
      if (res.statusCode === 200) {
        const detailData = res.data
        
        // 添加调试信息
        console.log('API返回的原始数据:', detailData)
        console.log('图片数组原始内容:', detailData.images)
        
        // 检查images是否是字符串，如果是则尝试解析
        if (typeof detailData.images === 'string') {
          try {
            detailData.images = JSON.parse(detailData.images)
            console.log('从字符串解析后的图片数组:', detailData.images)
          } catch (e) {
            console.error('解析图片字符串失败:', e)
            detailData.images = [detailData.images] // 如果无法解析，将其视为单个图片
          }
        }
        
        // 确保images总是数组
        if (!Array.isArray(detailData.images)) {
          console.warn('images不是数组，转换为数组:', detailData.images)
          detailData.images = detailData.images ? [detailData.images] : []
        }
        
        // 初始化媒体数组
        detailData.media = []
        
        // 先添加视频（如果有）
        if (detailData.video_url) {
          console.log('添加视频:', detailData.video_url)
          detailData.media.push({
            type: 'video',
            url: detailData.video_url,
            poster: 'https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=800&q=80'
          })
        }
        
        // 添加图片
        if (detailData.images.length > 0) {
          console.log(`处理${detailData.images.length}张图片`)
          detailData.images.forEach((item, index) => {
            console.log(`添加第${index+1}张图片:`, item)
            detailData.media.push({
              type: 'image',
              url: item
            })
          })
        } else {
          console.warn('没有找到图片或图片数组为空')
        }
        
        console.log('最终media数组:', detailData.media)
        setDebugInfo({
          mediaLength: detailData.media.length,
          imageCount: detailData.images.length,
          hasVideo: !!detailData.video_url
        })
        
        // 处理location字段，检查是否为JSON字符串
        if (detailData.location && typeof detailData.location === 'string') {
          try {
            // 尝试解析JSON
            const locationObj = JSON.parse(detailData.location);
            console.log('解析location JSON成功:', locationObj);
            
            // 如果是包含address字段的对象，使用address值
            if (locationObj && locationObj.address) {
              detailData.displayLocation = locationObj.address;
            } else {
              // 如果JSON对象没有address字段，使用原始字符串
              detailData.displayLocation = detailData.location;
            }
          } catch (e) {
            // 如果解析失败，说明不是JSON格式，直接使用原始字符串
            console.log('location不是JSON格式:', detailData.location);
            detailData.displayLocation = detailData.location;
          }
        } else if (typeof detailData.location === 'object' && detailData.location !== null) {
          // 如果已经是对象（后端可能自动解析了JSON）
          console.log('location已经是对象:', detailData.location);
          detailData.displayLocation = detailData.location.address || JSON.stringify(detailData.location);
        } else {
          // 其他情况，使用原始值或默认值
          detailData.displayLocation = detailData.location || '未知位置';
        }
        
        console.log('处理后的笔记数据:', detailData)
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

  // 编辑游记
  const handleEdit = (event) => {
    // 防止事件冒泡
    if (event) {
      event.stopPropagation()
    }
    
    // 跳转到编辑页面，并传递游记信息
    Taro.navigateTo({
      url: `/pages/reEditPost/index?id=${id}&status=${status}`
    })
  }

  // 分享功能
  const onShareAppMessage = () => {
    return {
      title: note?.title || '发现一篇精彩的游记',
      path: `/pages/diary-detail/index?id=${id}&status=${status}`,
      imageUrl: note.media[0].type === 'video' ? note.media[0].poster : note.media[0].url
    }
  }

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
      {/* 用户信息 */}
      <View className='user-card' onClick={() => Taro.navigateTo({
        url: `/pages/user/index?userId=${note.user_id}`
      })}>
        <Image className='avatar' src={note.avatar_url || 'https://cdn-icons-png.flaticon.com/512/847/847969.png'} />
        <View className='user-info'>
          <Text className='nickname'>{note.username || '未知用户'}</Text>
        </View>
        {!isOwner && <View className='follow-btn'>+关注</View>}
        {isOwner && <View className='edit-btn' onClick={handleEdit}>编辑</View>}
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
          <Text>{note.displayLocation || '未知位置'}</Text>
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
          <Text className='content'>{note.departure_time || '未知'}</Text>
        </View>
        <View className='detail-item'>
          <Text className='head'>行程天数</Text>
          <Text className='content'>{note.days || '未知'}</Text>
        </View>
        <View className='detail-item'>
          <Text className='head'>人均花费</Text>
          <Text className='content'>{note.avg_cost || '未知'}</Text>
        </View>
        <View className='detail-item'>
          <Text className='head'>和谁出行</Text>
          <Text className='content'>{note.companions || '未知'}</Text>
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
        发布于 {note.created_at?.slice(0, 10) || '未知时间'}
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
        {isOwner && (
          <View className='action-btn' onClick={handleEdit}>
            <Text className='action-icon'>
              <FontAwesome name="fa fa-edit" size={18} />
            </Text>
            <Text>编辑</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

definePageConfig({
  enableShareAppMessage: true,
})

export default DiaryDetail