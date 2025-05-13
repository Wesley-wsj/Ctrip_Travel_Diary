import Taro, { useShareAppMessage } from '@tarojs/taro';
import { View, Text, Image, Swiper, SwiperItem, Video, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { FontAwesome } from 'taro-icons'
import './index.scss'

function ShareDetail() {
  const [note, setNote] = useState(null)
  const { id } = Taro.getCurrentInstance().router?.params || {}

  // 获取精简数据
  useEffect(() => {
    const fetchShareData = async () => {
      try {
        const res = await Taro.request({
          url: `http://121.43.34.217:5000/api/diaries/approved/${id}`,
          method: 'GET'
        })
        
        if (res.statusCode === 200) {
          const data = res.data
          setNote({
            title: data.title,
            cover: data.cover,
            media: data.media,
            location: data.location,
            created_at: data.created_at,
            likes: data.likes_count,
            views: data.views_count,
            avatar: data.user?.avatar_url,
            username: data.user?.username
          })
        }
      } catch (error) {
        Taro.showToast({ title: '内容加载失败', icon: 'none' })
        setTimeout(() => Taro.navigateBack(), 1500)
      }
    }

    id && fetchShareData()
  }, [id])

  // 分享配置
  useShareAppMessage(() => ({
    title: note?.title || '分享一篇精彩游记',
    path: `/pages/shareDetail/index?id=${id}`,
    imageUrl: note?.cover || ''
  }))

  if (!note) return (
    <View className='loading-container'>
      <Image src='https://example.com/loading.gif' className='loading-gif' />
    </View>
  )

  return (
    <View className='share-container'>
      {/* 顶部媒体展示 */}
      <Swiper
        className='media-swiper'
        indicatorDots={note.media?.length > 1}
        autoplay
        circular
      >
        {note.media?.map((item, index) => (
          <SwiperItem key={index}>
            {item.type === 'video' ? (
              <Video
                src={item.url}
                poster={item.poster}
                controls={false}
                loop
                muted
                className='media-video'
              />
            ) : (
              <Image
                src={item.url}
                mode='aspectFill'
                className='media-image'
              />
            )}
          </SwiperItem>
        ))}
      </Swiper>

      {/* 核心信息展示 */}
      <View className='content-box'>
        <Text className='title'>{note.title}</Text>
        
        <View className='meta-info'>
          <Image src={note.avatar} className='user-avatar' />
          <Text className='username'>{note.username}</Text>
          <Text className='location'>{note.location}</Text>
          <Text className='date'>{note.created_at.slice(0, 10)}</Text>
        </View>

        <View className='stats'>
          <View className='stat-item'>
            <FontAwesome name='fa-eye' size={16} />
            <Text>{note.views}次浏览</Text>
          </View>
          <View className='stat-item'>
            <FontAwesome name='fa-heart' color='#ff4d4d' size={16} />
            <Text>{note.likes}人喜欢</Text>
          </View>
        </View>

        <View className='action-buttons'>
          <Button
            className='open-app-btn'
            onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${id}` })}
          >
            查看完整游记
          </Button>
          <Button 
            className='share-btn' 
            openType='share'
          >
            立即分享
          </Button>
        </View>
      </View>
    </View>
  )
}

export default ShareDetail