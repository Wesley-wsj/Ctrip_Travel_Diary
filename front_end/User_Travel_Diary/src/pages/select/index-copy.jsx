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

  useEffect(() => {
    const list = Taro.getStorageSync('postList') || []
    const user = Taro.getStorageSync('currentUser') || null
    setPostList(list)
    setUserInfo(user)
  }, [])

  // ✅ 新增：页面显示时自动刷新内容
  useDidShow(() => {
    const shouldRefresh = Taro.getStorageSync('refreshMyNotes')
    if (shouldRefresh) {
      const updatedList = Taro.getStorageSync('postList') || []
      setPostList(updatedList)
      Taro.removeStorageSync('refreshMyNotes')
    }
  })

  const handleAvatarUpload = async () => {
    const token = Taro.getStorageSync('token')
    console.log('token:', token)
    if (!token) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/login/index' })
      }, 1000)
      return
    }
  
    const currentUser = Taro.getStorageSync('currentUser')
    if (!token || !currentUser) {
      Taro.showToast({ title: '用户信息缺失', icon: 'none' })
      return
    }
  
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })
  
      const tempFilePath = res.tempFilePaths[0]
      const updatedUser = {
        ...currentUser,
        avatarUrl: tempFilePath
      }
  
      Taro.setStorageSync('currentUser', updatedUser)
      setUserInfo(updatedUser)
  
      Taro.showToast({ title: '头像更新成功', icon: 'success' })
    } catch (err) {
      console.error('头像上传失败:', err)
      Taro.showToast({ title: '上传失败', icon: 'none' })
    }
  }
  

  const handleChooseMedia = () => {
    Taro.chooseMedia({
      count: 9,
      mediaType: ['image', 'video'],
      success(res) {
        const files = res.tempFiles.map(f => f.tempFilePath)
        Taro.setStorageSync('mediaFiles', files)
        Taro.redirectTo({ url: '/pages/post/index' })
      },
      fail() {
        Taro.showToast({ title: '未选择文件', icon: 'none' })
      }
    })
  }

  const handleDeleteNote = (id) => {
    Taro.showModal({
      title: '提示',
      content: '确定要删除这篇笔记吗？',
      success(res) {
        if (res.confirm) {
          const updatedList = postList.filter(note => note.id !== id)
          setPostList(updatedList)
          Taro.setStorageSync('postList', updatedList)
          Taro.showToast({ title: '删除成功' })
        }
      }
    })
  }

  const toggleVideoPlay = (videoId) => {
    const ctx = Taro.createVideoContext(videoId)
    const isPlaying = isPlayingMap[videoId] || false
    isPlaying ? ctx.pause() : ctx.play()
    setIsPlayingMap(prev => ({ ...prev, [videoId]: !isPlaying }))
  }

  const handleLogout = () => {
    Taro.clearStorageSync()
    Taro.redirectTo({ url: '/pages/login/index' })
  }

  const renderNoteCard = (note) => {
    const media = note.mediaList[0]
    const isVideo = media.endsWith('.mp4') || media.includes('video')
    const videoId = `video-${note.id}`

    return (
      <View
        key={note.id}
        className="note-card"
        onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}
      >
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
            onClick={(e) => {
              e.stopPropagation()
              toggleVideoPlay(videoId)
            }}
          />
        ) : (
          <Image
            src={media}
            mode="widthFix"
            className="note-cover"
          />
        )}
        <View className="note-content">
          <Text className="note-title">{note.title}</Text>
          <Text className="note-time">{note.time}</Text>
        </View>
        <View
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation()
            handleDeleteNote(note.id)
          }}
        >
          ✕
        </View>
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
              src={userInfo?.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/847/847969.png'}
            />
            {userInfo && (
              <View className="avatar-edit-overlay">
                <Text className="edit-text">点击更换</Text>
              </View>
            )}
          </View>
          <View className="nickname-section">
            <Text className="nickname">{userInfo?.username || '未登录用户'}</Text>
            <Text className="user-id">用户ID: {userInfo?.userId?.slice(0, 8) || '未登录'}</Text>
          </View>
        </View>
        <View className="user-stats">
          <View className="stat-item"><Text className="stat-num">51</Text><Text className="stat-label">关注</Text></View>
          <View className="stat-item"><Text className="stat-num">21</Text><Text className="stat-label">粉丝</Text></View>
          <View className="stat-item"><Text className="stat-num">1300</Text><Text className="stat-label">获赞与收藏</Text></View>
        </View>
      </View>

      {postList.length === 0 ? (
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
        </View>
      )}

      <TabBar currentPath="/pages/select/index" />
    </View>
  )
}
