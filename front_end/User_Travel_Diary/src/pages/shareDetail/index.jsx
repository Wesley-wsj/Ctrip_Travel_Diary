import Taro, { useShareAppMessage } from '@tarojs/taro';
import { View, Text, Image, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { FontAwesome } from 'taro-icons'
import './index.scss'

function ShareDetail() {
  const [note, setNote] = useState(null)
  const { id } = Taro.getCurrentInstance().router?.params || {}

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await Taro.request({
          url: `http://121.43.34.217:5000/api/diaries/approved/${id}`,
          method: 'GET'
        })

        if (res.statusCode === 200) {
          const detailData = res.data

          const processedData = {
            ...detailData,
            coverImage: detailData.video_url ? detailData.cover :
              (detailData.images && detailData.images.length > 0 ?
                detailData.images[0] + '?x-oss-process=image/resize,w_750' : '')
          }
          setNote(processedData)
        }
      } catch (error) {
        Taro.showToast({ title: '加载失败', icon: 'none' })
        setTimeout(() => Taro.navigateBack(), 1500)
      }
    }

    id && fetchData()
  }, [id])

  useShareAppMessage(() => ({
    title: note?.title || '发现精彩游记',
    path: `/pages/shareDetail/index?id=${id}`,
    imageUrl: note?.coverImage || ''
  }))

  if (!note) return (
    <View className='loading-container'>
      <Text className='loading-text'>加载中...</Text>
    </View>
  )

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <View className='share-container'>
      {/* 单图展示区域 */}
      <View className='media-container'>
        <Image
          src={note.coverImage}
          mode='aspectFill'
          className='cover-image'
        />
      </View>

      {/* 核心信息展示 */}
      <View className='content-wrapper'>
        <View className='user-info'>
          <Image src={note.avatar_url} className='avatar' />
          <Text className='username'>{note.username}</Text>
        </View>

        <Text className='title'>{note.title}</Text>
        <View className='pub-location'>
          <FontAwesome name='fal fa-map-marker-alt' size={14} />
          <Text className='pub-add'>{note.location ? note.location.address : note.location}</Text>
        </View>

        <View className='publish-date'>
          <FontAwesome name='fa-calendar' size={14} />
          <Text className='date-text'>发布于：{formatDate(note.created_at)}</Text>
        </View>

        <View className='action-buttons'>
          <Button
            className='detail-btn'
            onClick={() => Taro.navigateTo({
              url: `/pages/detail/index?id=${id}`
            })}
          >
            查看完整内容
          </Button>
          <Button
            className='share-btn'
            openType='share'
          >
            分享给好友
          </Button>
        </View>
      </View>
    </View>
  )
}

export default ShareDetail

export const config = definePageConfig({
  navigationBarTitleText: '游记详情',
});