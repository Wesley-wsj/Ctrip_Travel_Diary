import React, { useState } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

const TabBar = ({ currentPath }) => {
  const [isPressed, setIsPressed] = useState(false)

  const jumpTo = (url) => {
    Taro.redirectTo({ url }) // tabBar 页统一用 switchTab，防止堆栈问题
  }

  const handleChooseMedia = () => {
    Taro.redirectTo({ url: '/pages/post/index' }) // 非 tabBar 页使用 redirectTo
  }

  return (
    <View className="bottom-tabbar">
      <View
        className={`tab-item home_plus ${currentPath === '/pages/home/index' ? 'active' : ''} ${isPressed ? 'pressed' : ''}`}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onTouchCancel={() => setIsPressed(false)}
        onClick={() => jumpTo('/pages/home/index')}
      >
        首页
      </View>

      <View
        className={`tab-item plus ${isPressed ? 'pressed' : ''}`}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onTouchCancel={() => setIsPressed(false)}
        onClick={handleChooseMedia}
      >
        +
      </View>

      <View
        className={`tab-item mine_plus ${currentPath === '/pages/select/index' ? 'active' : ''}`}
        onClick={() => jumpTo('/pages/select/index')}
      >
        我
      </View>
    </View>
  )
}

export default TabBar
