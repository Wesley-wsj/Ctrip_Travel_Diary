import { View, Text, Image, Button, Video } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import React, { useState, useEffect } from 'react'
import TabBar from '../../components/TabBar'
import './index.scss'

export default function SelectPage() {
  const [isPressed, setIsPressed] = useState(false)
  const [postList, setPostList] = useState([])
  const [isPlayingMap, setIsPlayingMap] = useState({})
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(false)

  // 仅修复头像URL格式的函数 - 不影响其他URL
  const fixAvatarUrl = (url) => {
    if (!url) return 'https://cdn-icons-png.flaticon.com/512/847/847969.png'; // 默认头像
    
    // 修复格式错误的URL
    let fixedUrl = url;
    
    // 先修复 5000.. 为 5000/（之前的问题）
    fixedUrl = fixedUrl.replace('5000..', '5000/');
    
    // 再修复 5000// 为 5000/（当前的问题）
    fixedUrl = fixedUrl.replace('5000//', '5000/');
    
    return fixedUrl;
  }

  // 1. 从API获取用户游记列表
  const fetchUserDiaries = async () => {
    const token = Taro.getStorageSync('token')
    if (!token) return
    
    setLoading(true)
    try {
      const res = await Taro.request({
        url: 'http://121.43.34.217:5000/api/diaries/my-diaries',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.statusCode === 200 && Array.isArray(res.data)) {
        // 格式化数据以适应前端组件
        const formattedList = res.data.map(diary => ({
          id: diary.id,
          title: diary.title || '无标题',
          time: new Date(diary.created_at).toLocaleDateString(),
          mediaList: diary.images?.length ? diary.images : 
                    (diary.video_url ? [diary.video_url] : []),
          status: diary.status,
          // 添加拒绝理由字段
          rejectReason: diary.reject_reason || ''
        }))
        
        setPostList(formattedList)
        Taro.setStorageSync('postList', formattedList) // 缓存
      }
    } catch (err) {
      console.error('获取游记失败:', err)
      Taro.showToast({ title: '获取笔记失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const user = Taro.getStorageSync('currentUser') || null
    
    // 只修复用户头像URL，不影响其他URL，也不影响本地头像
    if (user && user.avatar_url && !user.local_avatar_url) {
      console.log('原始头像URL:', user.avatar_url);
      const fixedUrl = fixAvatarUrl(user.avatar_url);
      console.log('修复后的头像URL:', fixedUrl);
      
      // 使用修复后的URL更新本地存储
      user.avatar_url = fixedUrl;
      Taro.setStorageSync('currentUser', user);
    }
    
    setUserInfo(user)
    console.log('用户信息:', user)
    
    fetchUserDiaries()
  }, [])

  // 页面显示时自动刷新内容
  useDidShow(() => {
    const shouldRefresh = Taro.getStorageSync('refreshMyNotes')
    if (shouldRefresh) {
      fetchUserDiaries()
      Taro.removeStorageSync('refreshMyNotes')
    }
  })

  // 显示拒绝理由的函数
  const showRejectReason = (note, e) => {
    e.stopPropagation() // 阻止冒泡，防止触发卡片的点击事件
    if (!note.rejectReason) {
      Taro.showToast({ 
        title: '没有提供拒绝理由', 
        icon: 'none' 
      })
      return
    }
    
    Taro.showModal({
      title: '审核未通过原因',
      content: note.rejectReason,
      showCancel: false,
      confirmText: '我知道了'
    })
  }
  
  // 重新编辑笔记
  const handleEditNote = (noteId, e) => {
    e.stopPropagation() // 阻止冒泡，防止触发卡片的点击事件
    Taro.navigateTo({ 
      url: `/pages/reEditPost/index?id=${noteId}` 
    })
  }

  // 本地头像上传功能实现
  const handleAvatarUpload = async () => {
    const token = Taro.getStorageSync('token')
    if (!token) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/login/index' })
      }, 1000)
      return
    }

    // 获取当前用户信息
    const currentUser = Taro.getStorageSync('currentUser')
    if (!currentUser) {
      Taro.showToast({ title: '用户信息缺失', icon: 'none' })
      return
    }

    // // 首次使用时的提示
    // const isFirstChange = !Taro.getStorageSync('avatarChangeExplained')
    // if (isFirstChange) {
    //   Taro.showModal({
    //     title: '头像更新提示',
    //     confirmText: '我知道了',
    //     showCancel: false,
    //     success: () => {
    //       Taro.setStorageSync('avatarChangeExplained', true)
    //     }
    //   })
    // }

    try {
      // 显示操作菜单
      const { tapIndex } = await Taro.showActionSheet({
        itemList: ['从相册选择', '拍照']
      })
      
      // 根据用户选择的操作获取图片
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: tapIndex === 0 ? ['album'] : ['camera']
      })

      const tempFilePath = res.tempFilePaths[0]
      
      Taro.showLoading({ title: '处理中...' })
      
      // 更新本地用户信息
      const updatedUser = {
        ...currentUser,
        local_avatar_url: tempFilePath
      }
      
      // 保存到本地存储
      Taro.setStorageSync('currentUser', updatedUser)
      setUserInfo(updatedUser)
      
      Taro.hideLoading()
      
      Taro.showToast({ 
        title: '头像已更新', 
        icon: 'success',
        duration: 2000
      })
    } catch (err) {
      Taro.hideLoading()
      console.error('头像更新失败:', err)
      
      // 检查错误是否来自用户取消操作
      if (err.errMsg && (err.errMsg.includes('cancel') || err.errMsg.includes('取消'))) {
        // 用户取消操作，不显示错误提示
        return
      }
      
      Taro.showToast({ 
        title: '头像更新失败', 
        icon: 'none' 
      })
    }
  }
  
  // 4. 完善发布笔记逻辑
  const handleChooseMedia = () => {
    const token = Taro.getStorageSync('token')
    if (!token) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/login/index' })
      }, 1000)
      return
    }
    
    Taro.chooseMedia({
      count: 5, // 根据API限制最多5张图片
      mediaType: ['image', 'video'],
      sourceType: ['album', 'camera'],
      maxDuration: 60, // 限制视频长度为60秒
      camera: 'back',
      success(res) {
        const files = res.tempFiles.map(f => ({
          path: f.tempFilePath,
          type: f.fileType,
          size: f.size,
          duration: f.duration
        }))
        
        // 检查是否同时选择了图片和视频
        const hasImage = files.some(f => f.type === 'image')
        const hasVideo = files.some(f => f.type === 'video')
        
        if (hasImage && hasVideo) {
          Taro.showToast({ 
            title: '不能同时选择图片和视频', 
            icon: 'none' 
          })
          return
        }
        
        // 检查视频数量
        if (hasVideo && files.length > 1) {
          Taro.showToast({ 
            title: '只能选择一个视频', 
            icon: 'none' 
          })
          return
        }
        
        Taro.setStorageSync('mediaFiles', files)
        Taro.navigateTo({ url: '/pages/post/index' }) // 使用navigateTo以便返回
      },
      fail() {
        Taro.showToast({ title: '未选择文件', icon: 'none' })
      }
    })
  }

  // 2. 实现真实的删除笔记功能
  const handleDeleteNote = (id, e) => {
    e && e.stopPropagation() // 阻止冒泡，使用条件判断以防止错误，并防止触发卡片的点击事件
    
    Taro.showModal({
      title: '提示',
      content: '确定要删除这篇笔记吗？',
      success: async (res) => {
        if (res.confirm) {
          const token = Taro.getStorageSync('token')
          
          Taro.showLoading({ title: '删除中...' })
          
          try {
            const res = await Taro.request({
              url: `http://121.43.34.217:5000/api/diaries/${id}`,
              method: 'DELETE',
              header: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            Taro.hideLoading()
            
            if (res.statusCode === 200) {
              const updatedList = postList.filter(note => note.id !== id)
              setPostList(updatedList)
              Taro.setStorageSync('postList', updatedList)
              Taro.showToast({ title: '删除成功', icon: 'success' })
            } else {
              throw new Error('删除失败')
            }
          } catch (err) {
            Taro.hideLoading()
            console.error('删除笔记失败:', err)
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }

  const toggleVideoPlay = (videoId, e) => {
    e && e.stopPropagation() // 阻止冒泡，使用条件判断以防止错误，并防止触发卡片的点击事件
    
    const ctx = Taro.createVideoContext(videoId)
    const isPlaying = isPlayingMap[videoId] || false
    isPlaying ? ctx.pause() : ctx.play()
    setIsPlayingMap(prev => ({ ...prev, [videoId]: !isPlaying }))
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success(res) {
        if (res.confirm) {
          Taro.clearStorageSync()
          Taro.redirectTo({ url: '/pages/login/index' })
        }
      }
    })
  }

  // 修改后的renderNoteCard函数 - 增加状态检查
  const renderNoteCard = (note) => {
    const media = note.mediaList[0]
    const isVideo = media?.endsWith('.mp4') || media?.includes('video')
    const videoId = `video-${note.id}`
    const isRejected = note.status === 'rejected'
    const isPending = note.status === 'pending'
    const isApproved = note.status === 'approved'
    
    // 获取状态显示文本和样式
    let statusText = ''
    let statusClass = ''
    
    switch(note.status) {
      case 'rejected':
        statusText = '已拒绝'
        statusClass = 'status-rejected'
        break
      case 'pending':
        statusText = '待审核'
        statusClass = 'status-pending'
        break
      case 'approved':
        statusText = '已通过'
        statusClass = 'status-approved'
        break
      default:
        statusText = '未知'
        statusClass = 'status-unknown'
    }

    // 设置底部按钮区域的类名
    const bottomActionsClass = isRejected 
      ? 'bottom-actions bottom-actions-with-two-btns' 
      : 'bottom-actions';
    
    // 处理笔记卡片点击事件
    const handleCardClick = () => {
      if (isApproved) {
        // 已通过的笔记正常跳转到详情页
        Taro.navigateTo({ 
          url: `/pages/diary-detail/index?id=${note.id}&status=${note.status}` 
        })
      } else if (isRejected) {
        // 已拒绝的笔记显示提示
        Taro.showModal({
          title: '笔记已被拒绝',
          content: '该游记已被拒绝，请修改后再发布',
          showCancel: false,
          confirmText: '我知道了'
        })
      } else if (isPending) {
        // 待审核的笔记显示提示
        Taro.showModal({
          title: '笔记审核中',
          content: '您的笔记正在审核中，请耐心等待',
          showCancel: false,
          confirmText: '我知道了'
        })
      }
    }

    return (
      <View
        key={note.id}
        className={`note-card ${isRejected ? 'rejected-note' : ''}`}
        onClick={handleCardClick}
      >
        {/* 媒体部分 */}
        <View className="media-container">
          {isVideo ? (
            <Video
              id={videoId}
              src={media}
              className="note-cover"
              muted
              controls={false}
              autoplay={false}
              showMuteBtn={false}
              showProgress={false}
              showPlayBtn={false}
              enableProgressGesture={false}
              objectFit="cover"
              onClick={(e) => toggleVideoPlay(videoId, e)}
            />
          ) : (
            <Image
              src={media}
              mode="widthFix"
              className="note-cover"
              lazyLoad
            />
          )}
          
          {/* 左上角状态标签 - 所有笔记都显示，使用更小的尺寸 */}
          <View className={`status-tag ${statusClass}`}>
            {statusText}
          </View>
        </View>
        
        <View className="note-content">
          <Text className="note-title">{note.title}</Text>
          <Text className="note-time">{note.time}</Text>
        </View>
        
        {/* 删除按钮 */}
        <View
          className="delete-btn"
          onClick={(e) => handleDeleteNote(note.id, e)}
        >
          ✕
        </View>
        
        {/* 底部按钮区域 */}
        {(isRejected || isPending) && (
          <View className={bottomActionsClass} onClick={(e) => e.stopPropagation()}>
            {/* 查看原因按钮 - 只在已拒绝的笔记中显示 */}
            {isRejected && (
              <Text 
                className="reason-btn"
                onClick={(e) => showRejectReason(note, e)}
              >
                查看原因
              </Text>
            )}
            
            {/* 重新编辑按钮 - 在已拒绝和待审核的笔记中显示 */}
            <Text 
              className={`edit-btn ${!isRejected ? 'edit-btn-only' : ''}`}
              onClick={(e) => handleEditNote(note.id, e)}
            >
              重新编辑
            </Text>
          </View>
        )}
      </View>
    )
  }


  return (
    <View className="select-home">
      <View className="profile-header">
        <View className="logout-button" onClick={handleLogout}>退出</View>
        <View className="profile-info">
          <View className="avatar-container" onClick={handleAvatarUpload}>
            <Image
              className="avatar"
              src={userInfo?.local_avatar_url || fixAvatarUrl(userInfo?.avatar_url)}
            />
            {userInfo && (
              <View className="avatar-edit-overlay">
                <Text className="edit-text">点击更换</Text>
              </View>
            )}
          </View>
          <View className="nickname-section">
            <Text className="nickname">{userInfo?.username || '未登录用户'}</Text>
            <Text className="user-id">用户ID: {userInfo?.id?.toString().slice(0, 8) || '未登录'}</Text>
          </View>
        </View>
        <View className="user-stats">
          <View className="stat-item"><Text className="stat-num">51</Text><Text className="stat-label">关注</Text></View>
          <View className="stat-item"><Text className="stat-num">21</Text><Text className="stat-label">粉丝</Text></View>
          <View className="stat-item"><Text className="stat-num">1300</Text><Text className="stat-label">获赞与收藏</Text></View>
        </View>
      </View>

      {loading ? (
        <View className="loading-container">
          <Text>加载中...</Text>
        </View>
      ) : postList.length === 0 ? (
        <View className="main-publish">
          <Image
            src="https://cdn-icons-png.flaticon.com/512/685/685655.png"
            className="camera-icon"
          />
          <Text className="slogan">携风而行，程载春色🍃</Text>
          <Button className="go-publish-btn" onClick={handleChooseMedia}>
            去发布
          </Button>
        </View>
      ) : (
        <View className="my-notes-section">
          <Text className="section-title">我的笔记</Text>
          <View className="waterfall-masonry">
            {postList.map(renderNoteCard)}
          </View>
          <Button className="add-more-btn" onClick={handleChooseMedia}>
            + 新建笔记
          </Button>
        </View>
      )}

      <TabBar currentPath="/pages/select/index" />
    </View>
  )
}