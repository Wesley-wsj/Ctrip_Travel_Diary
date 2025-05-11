import { View, Text, Input, Button, Checkbox, CheckboxGroup, Label, Navigator } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!username || !password) {
      Taro.showToast({ title: '请填写用户名和密码', icon: 'none' })
      return
    }

    try {
      const res = await Taro.request({
        url: 'http://121.43.34.217:5000/api/users/login',
        method: 'POST',
        data: { username, password },
        header: {
          'Content-Type': 'application/json'
        }
      })

      if (res.statusCode !== 200) {
        throw new Error(`请求失败 (状态码 ${res.statusCode})`)
      }
      if (!res.data?.token) {
        throw new Error('服务器未返回有效 token')
      }

      setError('')
      Taro.setStorageSync('token', res.data.token)
      Taro.setStorageSync('currentUser', res.data.user)

      Taro.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500,
        complete: () => Taro.redirectTo({ url: '/pages/select/index' })
      })

    } catch (err) {
      console.error('登录失败:', err)
      let errorMessage = '登录失败，请稍后再试'

      if (err.statusCode) {
        if (err.statusCode === 401 || err.statusCode === 404) {
          errorMessage = '用户名或密码错误'
        } else if (err.statusCode >= 500) {
          errorMessage = '服务器错误，请稍后再试'
        }
      } else if (err.errMsg?.includes('request:fail')) {
        errorMessage = '网络连接失败，请检查网络'
      }

      setError(errorMessage)
      Taro.showToast({ title: errorMessage, icon: 'none' })
    }
  }

  return (
    <View className="login-wrapper">
      <View className="login-card">
        <Text className="login-title">用户登录</Text>

        <Input
          className="login-input"
          placeholder="请输入用户名"
          value={username}
          onInput={e => setUsername(e.detail.value)}
        />

        <Input
          className="login-input"
          password
          placeholder="请输入密码"
          value={password}
          onInput={e => setPassword(e.detail.value)}
        />

        <CheckboxGroup onChange={e => setRemember(e.detail.value.includes('remember'))}>
          <Label className="login-checkbox">
            <Checkbox value="remember" checked={remember} />
            <Text className="checkbox-label">记住密码</Text>
          </Label>
        </CheckboxGroup>

        {error && <Text className="error-message">{error}</Text>}

        <Button className="login-button" type="primary" onClick={handleLogin}>
          登录
        </Button>

        <View className="login-footer">
          <Navigator url="/pages/select/index">返回首页</Navigator>
          <Navigator url="/pages/register/index">注册账号</Navigator>
        </View>
      </View>
    </View>
  )
}