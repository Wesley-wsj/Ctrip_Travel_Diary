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
        response = await Taro.uploadFile({
          url: 'http://121.43.34.217:5000/api/users/register',
          filePath: avatar,
          name: 'avatar',
          formData: { username, password },
          header: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else {
        // 无头像时使用普通请求
        response = await Taro.request({
          url: 'http://121.43.34.217:5000/api/users/register',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
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
    const data = res.data || {}
    
    if (res.statusCode === 200) {
      Taro.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => Taro.navigateTo({ url: '/pages/login/index' }), 1500)
    } else {
      Taro.showToast({ 
        title: data.message || `注册失败（${res.statusCode}）`,
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
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })

      if (res.tempFilePaths[0]) {
        setAvatar(res.tempFilePaths[0])
      }
    } catch (err) {
      console.error('头像选择失败:', err)
      Taro.showToast({ title: '头像选择取消', icon: 'none' })
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