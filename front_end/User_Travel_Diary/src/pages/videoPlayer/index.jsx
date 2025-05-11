import Taro from '@tarojs/taro'
import { Video, View } from '@tarojs/components'
import { useEffect } from 'react'
import './index.scss'

function VideoPlayer() {
  const { videoUrl } = Taro.getCurrentInstance().router?.params || {}

  useEffect(() => {
    if (!videoUrl) {
      Taro.showToast({
        title: '无效的视频地址',
        icon: 'none'
      })
      setTimeout(() => Taro.navigateBack(), 1500)
    }
  }, [videoUrl])

  if (!videoUrl) {
    return (
      <View className='video-container'>
        <View className='error-text'>视频加载失败</View>
      </View>
    )
  }

  return (
    <View className='video-container'>
      <Video
        src={decodeURIComponent(videoUrl)}
        controls
        autoplay
        loop={false}
        className='fullscreen-video'
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  )
}

export default VideoPlayer