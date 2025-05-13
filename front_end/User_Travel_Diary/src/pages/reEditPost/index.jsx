import { View, Image, Input, Textarea, Button, ScrollView, Video } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'

export default function EditDiaryPage() {
  const [mediaList, setMediaList] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [focusType, setFocusType] = useState('none')

  const [departureTime, setDepartureTime] = useState('')
  const [tripDays, setTripDays] = useState('')
  const [perCapitaCost, setPerCapitaCost] = useState('')
  const [travelCompanion, setTravelCompanion] = useState('')
  const [location, setLocation] = useState('📍 请选择位置')
  
  const [diaryId, setDiaryId] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [existingImages, setExistingImages] = useState([])
  const [existingVideo, setExistingVideo] = useState('')
  const [deletedMedia, setDeletedMedia] = useState([])
  // 新增：存储位置字符串
  const [locationAddress, setLocationAddress] = useState('')
  const [isUploading, setIsUploading] = useState(false)

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

    // 获取路由参数
    const params = Taro.getCurrentInstance().router.params
    const id = params.id
    const currentStatus = params.status || 'pending'
    console.log(`日记ID: ${id}, 状态: ${currentStatus}`)
    
    setDiaryId(id)
    setStatus(currentStatus)
    
    // 加载日记数据
    fetchDiaryData(id, token)
  }, [])

  const fetchDiaryData = async (id, token) => {
    console.log('开始获取日记数据, ID:', id)
    try {
      setIsLoading(true)
      // 使用 /api/diaries/my-diaries 接口
      const { statusCode, data } = await Taro.request({
        url: 'http://121.43.34.217:5000/api/diaries/my-diaries',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })
  
      console.log('API响应状态码:', statusCode)
      console.log('API响应数据类型:', typeof data)
      console.log('API响应数据结构:', Array.isArray(data) ? '数组' : '对象')
      
      // 打印所有日记的ID用于调试
      if (Array.isArray(data)) {
        console.log('所有日记ID:', data.map(item => item.id))
        console.log('第一条日记示例:', data[0])
      }
  
      if (statusCode !== 200) {
        throw new Error(data.message || '获取笔记失败')
      }
      console.log('查找ID为', id, '的日记')
  
      // 在返回的数据中查找指定ID的日记
      // 注意：可能需要把字符串ID转为数字，或反之
      const diary = Array.isArray(data) ? data.find(item => String(item.id) === String(id)) : null
      
      console.log('找到日记?', diary ? '是' : '否')
  
      if (!diary) {
        throw new Error('找不到指定的笔记')
      }
  
      // 处理位置信息，检查是否为JSON格式
      let displayLocation = '';
      let locationAddressValue = '';
      
      if (typeof diary.location === 'string') {
        try {
          // 尝试解析为JSON对象
          const locationObj = JSON.parse(diary.location);
          console.log('解析location JSON成功:', locationObj);
          if (locationObj && locationObj.address) {
            displayLocation = locationObj.address;
            locationAddressValue = locationObj.address;
          } else {
            // JSON对象但没有address字段
            displayLocation = diary.location;
            locationAddressValue = diary.location;
          }
        } catch (e) {
          // 不是JSON格式，直接使用
          console.log('location不是JSON格式，使用原值:', diary.location);
          displayLocation = diary.location;
          locationAddressValue = diary.location;
        }
      } else if (typeof diary.location === 'object' && diary.location !== null) {
        // 已经是对象
        console.log('location已经是对象:', diary.location);
        displayLocation = diary.location.address || JSON.stringify(diary.location);
        locationAddressValue = diary.location.address || '';
      } else {
        // 其他情况
        displayLocation = diary.location || '';
        locationAddressValue = diary.location || '';
      }
  
      // 填充表单数据
      setTitle(diary.title || '')
      setContent(diary.content || '')
      setLocation(displayLocation ? `📍 ${displayLocation}` : '📍 请选择位置')
      setLocationAddress(locationAddressValue)
      setDepartureTime(diary.departureTime || '')
      setTripDays(diary.tripDays || '')
      setPerCapitaCost(diary.perCapitaCost || '')
      setTravelCompanion(diary.travelCompanion || '')
  
      // 处理媒体文件
      const images = diary.images || []
      const video = diary.video_url || ''
  
      setExistingImages(images)
      setExistingVideo(video)
  
      // 将现有媒体文件添加到mediaList中
      const mediaFiles = []
      if (video) {
        mediaFiles.push(video)
      }
      if (images && images.length > 0) {
        mediaFiles.push(...images)
      }
      
      setMediaList(mediaFiles)
      setIsLoading(false)
    } catch (error) {
      console.error('获取日记数据失败:', error)
      Taro.showToast({
        title: error.message || '获取笔记数据失败',
        icon: 'none',
        duration: 2000
      })
      setIsLoading(false)
    }
  }

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
                quality: 40 // 降低质量以减小文件大小
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
    const fileToDelete = mediaList[index]
    
    // 检查是否是现有的媒体文件
    if (existingImages.includes(fileToDelete)) {
      setDeletedMedia(prev => [...prev, fileToDelete])
      setExistingImages(prev => prev.filter(img => img !== fileToDelete))
    } else if (fileToDelete === existingVideo) {
      setDeletedMedia(prev => [...prev, fileToDelete])
      setExistingVideo('')
    }
    
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

  const handleUpdate = async () => {
    try {
      if (isUploading) {
        return
      }
      
      setIsUploading(true)
      Taro.showLoading({ title: '更新中...' })
      
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
  
      // 处理位置信息为JSON格式
      let locationValue = null;
      
      if (locationAddress) {
        const locationObject = { address: locationAddress };
        locationValue = JSON.stringify(locationObject);
        
        // 打印位置信息
        console.log('位置原始字符串:', locationAddress);
        console.log('位置JSON对象:', locationObject);
        console.log('位置JSON字符串:', locationValue);
      }
      
      // 区分新上传的和已有的媒体文件
      const newVideoFiles = mediaList.filter(file => 
        (file.includes('video') || file.endsWith('.mp4')) && 
        file !== existingVideo && 
        !file.startsWith('http')
      );
      
      const newImageFiles = mediaList.filter(file => 
        !file.includes('video') && 
        !file.endsWith('.mp4') && 
        !existingImages.includes(file) && 
        !file.startsWith('http')
      );
      
      // 检查媒体文件数量限制
      if ((newImageFiles.length + existingImages.length) > 5) {
        Taro.hideLoading()
        Taro.showToast({ title: '最多上传5张图片', icon: 'none' })
        setIsUploading(false)
        return
      }
      
      if ((newVideoFiles.length > 0 && existingVideo) || newVideoFiles.length > 1) {
        Taro.hideLoading()
        Taro.showToast({ title: '最多上传1个视频', icon: 'none' })
        setIsUploading(false)
        return
      }
      
      // 使用PUT接口更新游记
      try {
        // 对于没有新媒体文件的情况，使用JSON格式直接更新
        if (newImageFiles.length === 0 && newVideoFiles.length === 0) {
          console.log('无新媒体文件，使用JSON格式更新');
          
          const updateData = {
            title,
            content,
            location: locationValue,
            departureTime,
            tripDays,
            perCapitaCost,
            travelCompanion,
            status: 'pending'  // 重新送审
          };
          
          // 如果有删除的媒体文件
          if (deletedMedia.length > 0) {
            updateData.deletedMedia = deletedMedia.join(',');
          }
          
          console.log('更新数据:', updateData);
          
          const { statusCode, data } = await Taro.request({
            url: `http://121.43.34.217:5000/api/diaries/update/${diaryId}`,
            method: 'PUT',
            header: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: updateData
          });
          console.log('url', `http://121.43.34.217:5000/api/diaries/update/${diaryId}`)
          
          console.log('更新响应:', statusCode, data);
          
          if (statusCode !== 200) {
            throw new Error(data.msg || '更新失败');
          }
          
          handleUpdateSuccess();
          return;
        }
        
        // 有新图片需要上传
        if (newImageFiles.length > 0) {
          console.log('需要上传新图片');
          
          // 准备表单数据
          const formData = {
            title,
            content,
            status: 'pending'
          };
          
          // 添加位置数据
          if (locationValue) {
            formData.location = locationValue;
          }
          
          // 添加其他可选字段
          if (departureTime) formData.departureTime = departureTime;
          if (tripDays) formData.tripDays = tripDays;
          if (perCapitaCost) formData.perCapitaCost = perCapitaCost;
          if (travelCompanion) formData.travelCompanion = travelCompanion;
          
          // 如果有删除的媒体文件
          if (deletedMedia.length > 0) {
            formData.deletedMedia = deletedMedia.join(',');
          }
          
          // 将表单数据转换为字符串
          const stringFormData = {};
          Object.keys(formData).forEach(key => {
            if (formData[key] !== undefined && formData[key] !== null) {
              stringFormData[key] = String(formData[key]);
            }
          });
          
          console.log('上传图片的表单数据:', stringFormData);
          
          // 上传第一张图片
          const imgRes = await Taro.uploadFile({
            url: `http://121.43.34.217:5000/api/diaries/update/${diaryId}`,
            filePath: newImageFiles[0],
            name: 'images',
            formData: stringFormData,
            header: {
              'Authorization': `Bearer ${token}`
            },
            method: 'PUT'  // 明确指定PUT方法
          });
          
          console.log('图片上传响应:', imgRes);
          
          if (imgRes.statusCode !== 200) {
            let errMsg = '图片上传失败';
            try {
              const errData = JSON.parse(imgRes.data);
              errMsg = errData.msg || errData.message || errMsg;
            } catch (e) {
              errMsg = imgRes.data || errMsg;
            }
            throw new Error(errMsg);
          }
          
          // 如果有多张图片，继续上传
          if (newImageFiles.length > 1) {
            for (let i = 1; i < newImageFiles.length; i++) {
              await Taro.uploadFile({
                url: `http://121.43.34.217:5000/api/diaries/update/${diaryId}`,
                filePath: newImageFiles[i],
                name: 'images',
                formData: stringFormData,
                header: {
                  'Authorization': `Bearer ${token}`
                },
                method: 'PUT'
              });
            }
          }
          
          // 上传成功
          handleUpdateSuccess();
          return;
        }
        
        // 有新视频需要上传
        if (newVideoFiles.length > 0) {
          console.log('需要上传新视频');
          
          // 准备表单数据
          const formData = {
            title,
            content,
            status: 'pending'
          };
          
          // 添加位置数据
          if (locationValue) {
            formData.location = locationValue;
          }
          
          // 添加其他可选字段
          if (departureTime) formData.departureTime = departureTime;
          if (tripDays) formData.tripDays = tripDays;
          if (perCapitaCost) formData.perCapitaCost = perCapitaCost;
          if (travelCompanion) formData.travelCompanion = travelCompanion;
          
          // 如果有删除的媒体文件
          if (deletedMedia.length > 0) {
            formData.deletedMedia = deletedMedia.join(',');
          }
          
          // 将表单数据转换为字符串
          const stringFormData = {};
          Object.keys(formData).forEach(key => {
            if (formData[key] !== undefined && formData[key] !== null) {
              stringFormData[key] = String(formData[key]);
            }
          });
          
          console.log('上传视频的表单数据:', stringFormData);
          
          // 上传视频
          const videoRes = await Taro.uploadFile({
            url: `http://121.43.34.217:5000/api/diaries/update/${diaryId}`,
            filePath: newVideoFiles[0],
            name: 'video',
            formData: stringFormData,
            header: {
              'Authorization': `Bearer ${token}`
            },
            method: 'PUT'  // 明确指定PUT方法
          });
          
          console.log('视频上传响应:', videoRes);
          
          if (videoRes.statusCode !== 200) {
            let errMsg = '视频上传失败';
            try {
              const errData = JSON.parse(videoRes.data);
              errMsg = errData.msg || errData.message || errMsg;
            } catch (e) {
              errMsg = videoRes.data || errMsg;
            }
            throw new Error(errMsg);
          }
          
          // 上传成功
          handleUpdateSuccess();
          return;
        }
      } catch (error) {
        console.error('更新失败:', error);
        handleUpdateError(error);
      }
    } catch (error) {
      handleUpdateError(error);
    }
  }
  
  // 更新成功处理函数
  const handleUpdateSuccess = () => {
    Taro.setStorageSync('refreshMyNotes', true) // 通知"我"页刷新
    
    Taro.hideLoading()
    setIsUploading(false)
    
    Taro.showToast({
      title: '更新成功，等待审核',
      icon: 'success',
      duration: 2000
    })
  
    setTimeout(() => {
      Taro.redirectTo({ url: '/pages/select/index' })
    }, 2000)
  }
  
  // 更新失败处理函数
  const handleUpdateError = (error) => {
    Taro.hideLoading()
    setIsUploading(false)
    console.error('更新失败:', error)
    Taro.showToast({
      title: error.message || '更新失败，请检查网络',
      icon: 'none',
      duration: 3000
    })
  }
  
  if (isLoading) {
    return (
      <View className="loading-container">
        正在加载...
      </View>
    )
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
        onClick={handleUpdate}
        disabled={isUploading}
      >
        {isUploading ? '更新中...' : '更新笔记'}
      </Button>
    </View>
  )
}