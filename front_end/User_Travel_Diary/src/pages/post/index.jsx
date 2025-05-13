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
      
      // 基础表单数据
      const baseFormData = {
        title,
        content
      }
      
      // 添加位置信息（如果有）- 作为JSON对象，只包含address字段
      if (locationAddress) {
        // 创建一个只包含address字段的对象
        const locationObject = { address: locationAddress }
        // 将对象转换为JSON字符串
        baseFormData.location = JSON.stringify(locationObject)
        
        // 打印位置信息
        console.log('位置原始字符串:', locationAddress)
        console.log('位置JSON对象:', locationObject)
        console.log('位置JSON字符串:', baseFormData.location)
        console.log('位置字段类型:', typeof baseFormData.location)
      }
      
      // 添加其他可选字段（如果有值）
      if (departureTime) baseFormData.departureTime = departureTime
      if (tripDays) baseFormData.tripDays = tripDays
      if (perCapitaCost) baseFormData.perCapitaCost = perCapitaCost
      if (travelCompanion) baseFormData.travelCompanion = travelCompanion
  
      console.log('提交的数据对象:', baseFormData)
      console.log('提交数据的完整JSON:', JSON.stringify(baseFormData, null, 2))
      
      // 尝试无文件提交
      if (imageFiles.length === 0 && videoFiles.length === 0) {
        try {
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
      
      // 处理有图片的情况
      if (imageFiles.length > 0) {
        try {
          // 将数据转换为普通字符串键值对
          const formData = {}
          for (const key in baseFormData) {
            formData[key] = String(baseFormData[key])
          }
          
          console.log('图片上传使用的表单数据对象:', formData)
          console.log('图片上传位置字段(JSON字符串):', formData.location)
          
          // 上传第一张图片
          const imgRes = await Taro.uploadFile({
            url: 'http://121.43.34.217:5000/api/diaries/upload',
            filePath: imageFiles[0],
            name: 'images',
            formData: formData,
            header: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          console.log('图片上传响应:', imgRes)
          
          if (imgRes.statusCode !== 200 && imgRes.statusCode !== 201) {
            try {
              const responseData = JSON.parse(imgRes.data)
              throw new Error(JSON.stringify(responseData))
            } catch (parseError) {
              throw new Error(imgRes.data || '图片上传失败')
            }
          }
          
          // 如果有其他图片，继续上传
          if (imageFiles.length > 1) {
            const diaryId = JSON.parse(imgRes.data).id || JSON.parse(imgRes.data).diaryId
            if (diaryId) {
              for (let i = 1; i < imageFiles.length; i++) {
                await Taro.uploadFile({
                  url: 'http://121.43.34.217:5000/api/diaries/upload',
                  filePath: imageFiles[i],
                  name: 'images',
                  formData: { id: diaryId },
                  header: {
                    'Authorization': `Bearer ${token}`
                  }
                })
              }
            }
          }
          
          // 如果还有视频，也上传
          if (videoFiles.length > 0) {
            const diaryId = JSON.parse(imgRes.data).id || JSON.parse(imgRes.data).diaryId
            if (diaryId) {
              await Taro.uploadFile({
                url: 'http://121.43.34.217:5000/api/diaries/upload',
                filePath: videoFiles[0],
                name: 'video',
                formData: { id: diaryId },
                header: {
                  'Authorization': `Bearer ${token}`
                }
              })
            }
          }
          
          // 上传成功
          handleUploadSuccess()
          return
        } catch (error) {
          console.error('图片上传错误:', error)
          throw error
        }
      }
      
      // 处理只有视频的情况
      if (videoFiles.length > 0) {
        try {
          // 将数据转换为普通字符串键值对
          const formData = {}
          for (const key in baseFormData) {
            formData[key] = String(baseFormData[key])
          }
          
          console.log('视频上传使用的表单数据对象:', formData)
          console.log('视频上传位置字段(JSON字符串):', formData.location)
          
          // 上传视频
          const videoRes = await Taro.uploadFile({
            url: 'http://121.43.34.217:5000/api/diaries/upload',
            filePath: videoFiles[0],
            name: 'video',
            formData: formData,
            header: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          console.log('视频上传响应:', videoRes)
          
          if (videoRes.statusCode !== 200 && videoRes.statusCode !== 201) {
            try {
              const responseData = JSON.parse(videoRes.data)
              throw new Error(JSON.stringify(responseData))
            } catch (parseError) {
              throw new Error(videoRes.data || '视频上传失败')
            }
          }
          
          // 上传成功
          handleUploadSuccess()
          return
        } catch (error) {
          console.error('视频上传错误:', error)
          throw error
        }
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