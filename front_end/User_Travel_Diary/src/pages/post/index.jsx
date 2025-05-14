import { View, Image, Input, Textarea, Button, ScrollView, Video } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import FormData from '../../utils/formData'  // 导入 FormData 库
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
  const [isUploading, setIsUploading] = useState(false)
  // 存储地址字符串
  const [locationAddress, setLocationAddress] = useState('')

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
  
    // 修改这里来处理两种可能的格式
    const rawFiles = Taro.getStorageSync('mediaFiles') || []
    
    // 检查是否是新格式（对象数组）
    if (rawFiles.length > 0 && typeof rawFiles[0] === 'object') {
      // 新格式：转换为路径数组
      const paths = rawFiles.map(file => file.path)
      setMediaList(paths)
    } else {
      // 原格式：直接使用
      setMediaList(rawFiles)
    }
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
              // 增加压缩质量，使文件更小
              const compressed = await Taro.compressImage({
                src: file.tempFilePath,
                quality: 40 // 降低质量进一步减小文件大小
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
        console.log('选择的位置信息 (完整对象):', res)
        console.log('位置名称:', res.name)
        console.log('位置地址:', res.address)
        
        // 保存地址信息，优先使用address
        const displayAddress = res.address || res.name || ''
        
        setLocation(`📍 ${displayAddress}`)
        setLocationAddress(displayAddress)
      },
      fail(err) {
        console.error('位置选择失败:', err)
        Taro.showToast({ title: '定位选择失败', icon: 'none' })
      }
    })
  }

  const handlePublish = async () => {
    try {
      if (isUploading) {
        return
      }
      
      setIsUploading(true)
      Taro.showLoading({ title: '发布中...' })
      
      const hasImage = mediaList.some(url => !url.includes('video') && !url.endsWith('.mp4'))
      const hasVideo = mediaList.some(url => url.includes('video') || url.endsWith('.mp4'))
  
      if (!title || !content || (!hasImage && !hasVideo)) {
        Taro.hideLoading()
        Taro.showToast({ title: '标题、正文和媒体内容至少一项不能为空', icon: 'none' })
        setIsUploading(false)
        return
      }
  
      const token = Taro.getStorageSync('token')
      if (!token) {
        Taro.hideLoading()
        Taro.showToast({ title: '请先登录', icon: 'none' })
        setIsUploading(false)
        setTimeout(() => Taro.redirectTo({ url: '/pages/login/index' }), 1000)
        return
      }
  
      const videoFiles = mediaList.filter(file => file.includes('video') || file.endsWith('.mp4'))
      const imageFiles = mediaList.filter(file => !file.includes('video') && !file.endsWith('.mp4'))
  
      if (imageFiles.length > 5) {
        Taro.hideLoading()
        Taro.showToast({ title: '最多上传5张图片', icon: 'none' })
        setIsUploading(false)
        return
      }
      if (videoFiles.length > 1) {
        Taro.hideLoading()
        Taro.showToast({ title: '最多上传1个视频', icon: 'none' })
        setIsUploading(false)
        return
      }
      
      // 尝试无文件提交
      if (imageFiles.length === 0 && videoFiles.length === 0) {
        try {
          // 无文件时保持原有逻辑，直接使用JSON提交
          const baseFormData = {
            title,
            content
          }
          
          // 添加位置信息（如果有）
          if (locationAddress) {
            const locationObject = { address: locationAddress }
            baseFormData.location = JSON.stringify(locationObject)
          }
          
          // 添加其他可选字段
          if (departureTime) baseFormData.departureTime = departureTime
          if (tripDays) baseFormData.tripDays = tripDays
          if (perCapitaCost) baseFormData.perCapitaCost = perCapitaCost
          if (travelCompanion) baseFormData.travelCompanion = travelCompanion
          
          const { statusCode, data } = await Taro.request({
            url: 'http://121.43.34.217:5000/api/diaries/upload',
            method: 'POST',
            header: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: baseFormData
          })
          
          console.log('无文件提交响应:', statusCode, data)
          
          if (statusCode !== 200 && statusCode !== 201) {
            throw new Error(JSON.stringify(data) || '提交失败')
          }
          
          // 成功处理
          handleUploadSuccess()
          return
        } catch (error) {
          console.error('无文件提交错误:', error)
          throw error
        }
      }
      
      // 使用FormData处理有文件的上传 (使用 wx-formdata 库)
      try {
        // 创建FormData实例
        const formData = new FormData()
        
        // 添加基本表单数据
        formData.append('title', title)
        formData.append('content', content)
        
        // 添加位置信息（如果有）
        if (locationAddress) {
          const locationObject = { address: locationAddress }
          formData.append('location', JSON.stringify(locationObject))
        }
        
        // 添加其他可选字段
        if (departureTime) formData.append('departureTime', departureTime)
        if (tripDays) formData.append('tripDays', tripDays)
        if (perCapitaCost) formData.append('perCapitaCost', perCapitaCost)
        if (travelCompanion) formData.append('travelCompanion', travelCompanion)
        
        // 添加所有图片
        for (let i = 0; i < imageFiles.length; i++) {
          formData.appendFile('images', imageFiles[i])
        }
        
        // 添加视频（如果有）
        if (videoFiles.length > 0) {
          formData.appendFile('video', videoFiles[0])
        }
        
        // 获取FormData
        const data = formData.getData()
        
        console.log('FormData上传使用的内容类型:', data.contentType)
        
        // 发送请求
        const res = await Taro.request({
          url: 'http://121.43.34.217:5000/api/diaries/upload',
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'content-type': data.contentType
          },
          data: data.buffer,
          // 不能设置 responseType: 'arraybuffer'，因为我们需要解析JSON响应
        })
        
        console.log('FormData上传响应:', res)
        
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          throw new Error(typeof res.data === 'string' ? res.data : JSON.stringify(res.data) || '提交失败')
        }
        
        // 上传成功处理
        handleUploadSuccess()
      } catch (error) {
        console.error('FormData上传错误:', error)
        throw error
      }
    } catch (error) {
      handleUploadError(error)
    }
  }
  
  // 上传成功处理函数
  const handleUploadSuccess = () => {
    Taro.removeStorageSync('mediaFiles')
    setTitle('')
    setContent('')
    setMediaList([])
    setLocation('📍 请选择位置')
    setDepartureTime('')
    setTripDays('')
    setPerCapitaCost('')
    setTravelCompanion('')
    setLocationAddress('')
  
    Taro.setStorageSync('refreshMyNotes', true) // 通知"我"页刷新
    
    Taro.hideLoading()
    setIsUploading(false)
    
    Taro.showToast({
      title: '发布成功，等待审核',
      icon: 'success',
      duration: 2000
    })
  
    setTimeout(() => {
      Taro.redirectTo({ url: '/pages/select/index' })
    }, 2000)
  }
  
  // 上传失败处理函数
  const handleUploadError = (error) => {
    Taro.hideLoading()
    setIsUploading(false)
    console.error('发布失败:', error)
    Taro.showToast({
      title: error.message || '发布失败，请检查网络',
      icon: 'none',
      duration: 3000
    })
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

      <Button 
        className="publish-btn" 
        onClick={handlePublish}
        disabled={isUploading}
      >
        {isUploading ? '发布中...' : '发布笔记'}
      </Button>
    </View>
  )
}