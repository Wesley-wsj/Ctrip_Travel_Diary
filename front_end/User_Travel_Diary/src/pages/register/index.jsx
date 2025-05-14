import { View, Text, Input, Button, Checkbox, CheckboxGroup, Label, Navigator, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import React, { useState } from 'react'
import './index.scss'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [avatar, setAvatar] = useState(null)
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    if (!username || !password || !confirmPassword) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return false
    }

    if (username.length < 6 || username.length > 20) {
      Taro.showToast({ title: '用户名长度需在6-20位之间', icon: 'none' })
      return false
    }

    if (password !== confirmPassword) {
      Taro.showToast({ title: '两次密码不一致', icon: 'none' })
      return false
    }

    if (password.length < 6) {
      Taro.showToast({ title: '密码至少6位', icon: 'none' })
      return false
    }

    if (!agree) {
      Taro.showToast({ title: '请同意协议', icon: 'none' })
      return false
    }

    return true
  }

  const handleRegister = async () => {
    if (!validateForm()) return
    if (loading) return

    setLoading(true)
    
    try {
      let response
      
      if (avatar) {
        // 有头像时使用 uploadFile
        console.log('准备上传头像:', avatar)
        
        response = await Taro.uploadFile({
          url: 'http://121.43.34.217:5000/api/users/register',
          filePath: avatar,
          name: 'avatar',
          formData: { 
            username, 
            password 
          },
          header: {
            'content-type': 'multipart/form-data'
          }
        })
        
        console.log('头像上传响应:', response)
      } else {
        // 无头像时使用普通请求
        response = await Taro.request({
          url: 'http://121.43.34.217:5000/api/users/register',
          method: 'POST',
          header: {
            'content-type': 'application/json'
          },
          data: { username, password }
        })
      }

      handleResponse(response)
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = (res) => {
    // 解析响应数据 - uploadFile 返回的是字符串，需要解析
    let data = res.data || {}
    
    // 如果是 uploadFile 的响应，data 将是字符串形式
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
        console.log('解析后的响应数据:', data)
      } catch (e) {
        console.error('解析响应数据失败:', e)
      }
    }
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      Taro.showToast({ title: '注册成功', icon: 'success' })
      
      // 如果返回了头像URL，可以存储到本地
      if (data.avatar_url) {
        console.log('服务器返回的头像URL:', data.avatar_url)
        // 可以在这里将头像URL存储到全局状态或本地存储中
        try {
          Taro.setStorageSync('userAvatarUrl', data.avatar_url)
        } catch (e) {
          console.error('保存头像URL失败:', e)
        }
      }
      
      setTimeout(() => Taro.navigateTo({ url: '/pages/login/index' }), 1500)
    } else {
      Taro.showToast({ 
        title: data.message || data.msg || `注册失败（${res.statusCode}）`,
        icon: 'none',
        duration: 3000
      })
    }
  }

  const handleError = (err) => {
    console.error('注册失败:', err)
    const errorMsg = err.errMsg || '网络连接失败'
    
    if (errorMsg.includes('uploadFile')) {
      Taro.showToast({ title: '头像上传失败', icon: 'none' })
    } else {
      Taro.showToast({ 
        title: errorMsg.replace(/^request:fail\s*/i, ''),
        icon: 'none',
        duration: 3000
      })
    }
  }

  const handleAvatarChange = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'], // 压缩图片
        sourceType: ['album', 'camera'], // 允许从相册和相机选择
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        console.log('选择的图片路径:', res.tempFilePaths[0])
        console.log('图片信息:', res.tempFiles[0])
        
        // 可以在这里添加图片大小限制
        const file = res.tempFiles[0]
        if (file.size > 5 * 1024 * 1024) { // 例如限制5MB
          Taro.showToast({ title: '图片大小不能超过5MB', icon: 'none' })
          return
        }
        
        // 设置头像路径
        setAvatar(res.tempFilePaths[0])
        
        // 提示用户已选择头像
        Taro.showToast({ title: '已选择头像', icon: 'success', duration: 1500 })
      }
    } catch (err) {
      console.error('头像选择失败:', err)
      
      // 更详细的错误处理
      if (err.errMsg && err.errMsg.includes('cancel')) {
        // 用户取消选择
        console.log('用户取消了选择')
      } else if (err.errMsg && err.errMsg.includes('authorize')) {
        // 权限问题
        Taro.showModal({
          title: '提示',
          content: '需要相册权限才能选择头像，请在设置中允许访问相册',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              Taro.openSetting()
            }
          }
        })
      } else {
        // 其他错误
        Taro.showToast({ 
          title: '头像选择失败',
          icon: 'none'
        })
      }
    }
  }

  return (
    <View className="form-container">
      <View className="form-card">
        <Text className="form-title">新用户注册</Text>

        <Input
          className="form-input"
          placeholder="* 用户名（6-20位）"
          value={username}
          onInput={e => setUsername(e.detail.value.trim())}
          maxlength={20}
        />

        <Input
          className="form-input"
          password
          placeholder="* 登录密码（至少6位）"
          value={password}
          onInput={e => setPassword(e.detail.value.trim())}
        />

        <Input
          className="form-input"
          password
          placeholder="* 确认密码"
          value={confirmPassword}
          onInput={e => setConfirmPassword(e.detail.value.trim())}
        />

        <View className="avatar-section">
          <Text className="section-title">头像上传（可选）</Text>
          <View className="avatar-upload">
            <Button 
              className={`avatar-button ${avatar ? 'uploaded' : ''}`}
              onClick={handleAvatarChange}
            >
              {avatar ? '更换头像' : '+ 选择头像'}
            </Button>
            {avatar && (
              <Image
                src={avatar}
                className="avatar-preview"
                mode="aspectFill"
              />
            )}
          </View>
        </View>

        <CheckboxGroup 
          onChange={e => setAgree(e.detail.value.includes('agree'))}
          className="agreement-group"
        >
          <Label className="form-checkbox">
            <Checkbox 
              value="agree" 
              checked={agree}
              color="#07c160"
            />
            <Text className="checkbox-label">
              我已阅读并同意
              <Navigator 
                url="/pages/agreement/index"
                className="link"
              >《用户注册协议》
              </Navigator>
            </Text>
          </Label>
        </CheckboxGroup>

        <Button 
          className={`form-button ${loading ? 'disabled' : ''}`}
          type="primary"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? '注册中...' : '立即注册'}
        </Button>

        <View className="form-footer">
          <Navigator 
            url="/pages/home/index"
            className="nav-link"
          >返回首页
          </Navigator>
          <Text className="divider">|</Text>
          <Navigator
            url="/pages/login/index"
            className="nav-link"
          >已有账号登录
          </Navigator>
        </View>
      </View>
    </View>
  )
}