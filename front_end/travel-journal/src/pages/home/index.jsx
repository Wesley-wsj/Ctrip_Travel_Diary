import React from 'react'
import { View } from '@tarojs/components'
import TabBar from '../../components/TabBar'

export default function HomePage() {
  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      {/* 空白页面内容 */}

      {/* 底部导航栏 */}
      <TabBar currentPath="/pages/home/index" />
    </View>
  )
}
