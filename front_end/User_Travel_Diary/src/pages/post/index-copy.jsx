import { View, Image, Input, Textarea, Button, ScrollView, Video } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'

export default function PostPage() {
  const [mediaList, setMediaList] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [focusType, setFocusType] = useState('none')

  const [departureTime, setDepartureTime] = useState('')
  const [tripDays, setTripDays] = useState('')
  const [perCapitaCost, setPerCapitaCost] = useState('')
  const [travelCompanion, setTravelCompanion] = useState('')
  const [location, setLocation] = useState('📍 请选择位置')

  useEffect(() => {
    const token = Taro.getStorageSync('token')
    console.log('token:', token)
    if (!token) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/login/index' })
      }, 1000)
      return
    }
  
    const files = Taro.getStorageSync('mediaFiles') || []
    setMediaList(files)
  }, [])

  const handleAddMore = () => {
    if (mediaList.length >= 9) {
      Taro.showToast({ title: '最多上传9个媒体', icon: 'none' })
      return
    }

    Taro.chooseMedia({
      count: 9 - mediaList.length,
      mediaType: ['image', 'video'],
      success: async (res) => {
        const existingVideo = mediaList.find(f => f.endsWith('.mp4') || f.includes('video'))

        const compressedList = []
        for (const file of res.tempFiles) {
          const isVideo = file.fileType === 'video'
          if (isVideo && existingVideo) {
            Taro.showToast({ title: '只允许上传1个视频', icon: 'none' })
            continue
          }

          if (isVideo) {
            compressedList.push(file.tempFilePath)
          } else {
            try {
              const compressed = await Taro.compressImage({
                src: file.tempFilePath,
                quality: 60
              })
              compressedList.push(compressed.tempFilePath)
            } catch (err) {
              console.error('图片压缩失败:', err)
              compressedList.push(file.tempFilePath)
            }
          }
        }

        setMediaList(prev => [...prev, ...compressedList].slice(0, 9))
      }
    })
  }

  const handlePreview = (index) => {
    const file = mediaList[index]
    const isVideo = file.endsWith('.mp4') || file.includes('video')
    if (isVideo) {
      Taro.previewMedia({
        current: 0,
        sources: [{ url: file, type: 'video' }]
      })
    } else {
      Taro.previewImage({
        current: file,
        urls: mediaList.filter(f => !(f.endsWith('.mp4') || f.includes('video')))
      })
    }
  }

  const handleDelete = (index) => {
    const newList = [...mediaList]
    newList.splice(index, 1)
    setMediaList(newList)
  }

  const handleChooseLocation = () => {
    Taro.chooseLocation({
      success(res) {
        setLocation(`📍 ${res.name || res.address}`)
      },
      fail(err) {
        console.error('位置选择失败:', err)
        Taro.showToast({ title: '定位选择失败', icon: 'none' })
      }
    })
  }

  const handlePublish = async () => {
    try {
      const hasImage = mediaList.some(url => !url.includes('video') && !url.endsWith('.mp4'))
      const hasVideo = mediaList.some(url => url.includes('video') || url.endsWith('.mp4'))
  
      if (!title || !content || (!hasImage && !hasVideo)) {
        Taro.showToast({ title: '标题、正文和媒体内容至少一项不能为空', icon: 'none' })
        return
      }
  
      if (location === '📍 请选择位置') {
        Taro.showToast({ title: '请先选择位置', icon: 'none' })
        return
      }
  
      const token = Taro.getStorageSync('token')
      if (!token) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        setTimeout(() => Taro.redirectTo({ url: '/pages/login/index' }), 1000)
        return
      }
  
      const videoFiles = mediaList.filter(file => file.includes('video') || file.endsWith('.mp4'))
      const imageFiles = mediaList.filter(file => !file.includes('video') && !file.endsWith('.mp4'))
  
      if (imageFiles.length > 5) {
        Taro.showToast({ title: '最多上传5张图片', icon: 'none' })
        return
      }
      if (videoFiles.length > 1) {
        Taro.showToast({ title: '最多上传1个视频', icon: 'none' })
        return
      }
  
      // 生成唯一 ID
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      
      const baseFormData = {
        id: uniqueId,
        title,
        content,
        location: location.replace('📍 ', ''),
        departureTime,
        tripDays,
        perCapitaCost,
        travelCompanion
      }
  
      let videoUrl = ''
      if (videoFiles.length > 0) {
        const videoRes = await Taro.uploadFile({
          url: 'http://121.43.34.217:5000/api/diaries/upload',
          filePath: videoFiles[0],
          name: 'video',
          formData: baseFormData,
          header: {
            'Authorization': `Bearer ${token}`,
            'X-File-Type': 'video'
          }
        })
  
        if (videoRes.statusCode !== 201) {
          throw new Error(JSON.parse(videoRes.data).message || '视频上传失败')
        }
        videoUrl = JSON.parse(videoRes.data).video_url
      }
  
      for (const file of imageFiles) {
        const imgRes = await Taro.uploadFile({
          url: 'http://121.43.34.217:5000/api/diaries/upload',
          filePath: file,
          name: 'images',
          formData: {
            ...baseFormData,
            ...(videoUrl && { video_url: videoUrl })
          },
          header: {
            'Authorization': `Bearer ${token}`,
            'X-File-Type': 'image'
          }
        })
  
        if (imgRes.statusCode !== 201) {
          throw new Error(JSON.parse(imgRes.data).message || '图片上传失败')
        }
      }
  
      if (imageFiles.length === 0 && videoFiles.length === 0) {
        const { statusCode, data } = await Taro.request({
          url: 'http://121.43.34.217:5000/api/diaries/upload',
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: baseFormData
        })
  
        if (statusCode !== 201) {
          throw new Error(data.message || '提交失败')
        }
      }
  
      Taro.removeStorageSync('mediaFiles')
      setTitle('')
      setContent('')
      setMediaList([])
      setLocation('📍 请选择位置')
      setDepartureTime('')
      setTripDays('')
      setPerCapitaCost('')
      setTravelCompanion('')
  
      Taro.setStorageSync('refreshMyNotes', true) // ✅ 通知“我”页刷新
  
      Taro.showToast({
        title: '发布成功，等待审核',
        icon: 'success',
        duration: 2000
      })
  
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/select/index' })
      }, 2000)
  
    } catch (error) {
      console.error('发布失败:', error)
      Taro.showToast({
        title: error.message || '发布失败，请检查网络',
        icon: 'none',
        duration: 3000
      })
    }
  }
  

  return (
    <View className="post-page">
      <ScrollView scrollX className="media-preview" showScrollbar={false}>
        <View className={`media-row ${focusType !== 'none' ? 'shrinked' : ''}`}>
          {mediaList.map((url, index) => (
            <View key={index} className="media-box">
              {url.endsWith('.mp4') || url.includes('video') ? (
                <View className="media-item" onClick={() => handlePreview(index)}>
                  <Video
                    src={url}
                    className="video-thumb"
                    controls={false}
                    muted
                    autoplay={false}
                    showMuteBtn
                    enableProgressGesture={false}
                  />
                </View>
              ) : (
                <Image
                  src={url}
                  className="media-item"
                  mode="aspectFill"
                  onClick={() => handlePreview(index)}
                />
              )}
              <View className="media-badge media-number">{index + 1}</View>
              <View
                className="media-badge media-delete"
                hoverClass="media-delete-active"
                hoverStartTime={0}
                hoverStayTime={200}
                onClick={() => handleDelete(index)}
              >
                x
              </View>
            </View>
          ))}
          {mediaList.length < 9 && (
            <View className="media-add" onClick={handleAddMore}>+</View>
          )}
        </View>
      </ScrollView>

      <Input
        className={`title-input ${focusType === 'title' ? 'enlarged' : ''}`}
        placeholder="添加标题"
        value={title}
        onFocus={() => setFocusType('title')}
        onBlur={() => setFocusType('none')}
        onInput={e => setTitle(e.detail.value)}
      />

      <View className="info-row">
        <Input
          className="info-input"
          placeholder="出发时间"
          value={departureTime}
          onInput={e => setDepartureTime(e.detail.value)}
        />
        <Input
          className="info-input"
          placeholder="天数"
          value={tripDays}
          onInput={e => setTripDays(e.detail.value)}
        />
        <Input
          className="info-input"
          placeholder="人均花费"
          value={perCapitaCost}
          onInput={e => setPerCapitaCost(e.detail.value)}
        />
        <Input
          className="info-input"
          placeholder="和谁出行"
          value={travelCompanion}
          onInput={e => setTravelCompanion(e.detail.value)}
        />
      </View>

      <Textarea
        className="content-textarea"
        placeholder="~请添加正文~"
        value={content}
        autoHeight
        maxlength={500}
        onInput={(e) => setContent(e.detail.value)}
        onFocus={() => setFocusType('content')}
        onBlur={() => setFocusType('none')}
      />

      <View className="location-placeholder" onClick={handleChooseLocation}>
        {location}
      </View>

      <Button className="publish-btn" onClick={handlePublish}>
        发布笔记
      </Button>
    </View>
  )
}