// 新建 pages/shareDetail/index.jsx
import Taro from '@tarojs/tapi'
import { View, Text, Image, ScrollView, Video, Swiper, SwiperItem } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { FontAwesome } from 'taro-icons'
import './index.scss'

// 精简版页面配置
ShareDetail.config = {
  navigationBarTitleText: '游记分享',
  navigationStyle: 'custom' // 隐藏导航栏
}

function ShareDetail() {
  const [note, setNote] = useState(null)
  const { id } = Taro.getCurrentInstance().router?.params || {}

  // 优化后的数据获取
  const fetchShareData = async (noteId) => {
    try {
      const res = await Taro.request({
        url: `https://your-api-domain.com/api/share/diaries/${noteId}`,
        method: 'GET',
        timeout: 3000 // 更短的超时时间
      })
      return res.data
    } catch (error) {
      Taro.showToast({ title: '内容加载失败', icon: 'none' })
      setTimeout(() => Taro.navigateBack(), 1500)
      return null
    }
  }

  useEffect(() => {
    if (!id) return
    
    const loadData = async () => {
      const data = await fetchShareData(id)
      if (data) {
        // 数据预处理
        const processedData = {
          ...data,
          media: [
            ...(data.video_url ? [{
              type: 'video',
              url: data.video_url,
              poster: data.cover
            }] : []),
            ...(data.images || []).map(url => ({ type: 'image', url }))
          ]
        }
        setNote(processedData)
      }
    }
    
    loadData()
  }, [id])

  if (!note) return (
    <View className='share-loading'>
      <Image src='https://your-cdn.com/loading.gif' className='loading-gif' />
    </View>
  )

  return (
    <View className='share-container'>
      {/* 媒体展示区域放大 */}
      <Swiper
        className='share-swiper'
        indicatorDots={note.media.length > 1}
        circular
        autoplay
      >
        {note.media.map((item, index) => (
          <SwiperItem key={index}>
            {item.type === 'video' ? (
              <Video
                src={item.url}
                poster={item.poster}
                controls={false}
                autoplay
                loop
                muted
                className='share-video'
              />
            ) : (
              <Image
                src={item.url}
                mode='aspectFill'
                className='share-image'
              />
            )}
          </SwiperItem>
        ))}
      </Swiper>

      {/* 精简信息展示 */}
      <View className='share-content'>
        <Text className='share-title'>{note.title}</Text>
        
        <View className='share-meta'>
          <FontAwesome name='fa-user' size={14} />
          <Text>{note.username}</Text>
          <Text className='dot-divider'>•</Text>
          <Text>{note.location}</Text>
          <Text className='dot-divider'>•</Text>
          <Text>{note.created_at.slice(0, 10)}</Text>
        </View>

        <View className='share-stats'>
          <View className='stat-item'>
            <FontAwesome name='fa-eye' size={14} />
            <Text>{note.views || 0}</Text>
          </View>
          <View className='stat-item'>
            <FontAwesome name='fa-heart' size={14} />
            <Text>{note.likes || 0}</Text>
          </View>
        </View>

        {/* 精选内容节选 */}
        <ScrollView className='excerpt' scrollY>
          {note.content.split('\n').slice(0, 3).map((p, i) => (
            <Text key={i} className='excerpt-line'>{p}</Text>
          ))}
          <Text className='view-full'>查看完整游记</Text>
        </ScrollView>
      </View>

      {/* 固定底部CTA */}
      <View className='share-footer'>
        <Image src={note.avatar_url} className='author-avatar' />
        <View className='footer-actions'>
          <Button className='open-app-btn'>打开APP查看完整内容</Button>
          <Button className='save-btn' openType='share'>
            <FontAwesome name='fa-share' size={16} />
            转发
          </Button>
        </View>
      </View>
    </View>
  )
}

export default ShareDetail