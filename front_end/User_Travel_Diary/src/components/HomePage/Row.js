import React, { memo } from 'react';
import { View, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './Row.css'

const Row = memo(({ id, index, data }) => {
    const item = data[index];
    //跳转详情页
    const navigateToDetail = (id) => {
      Taro.navigateTo({
        url: `/pages/detail/index?id=${id}`
      })
    }
    return (
      <View id={id} style={{ height:item.height+51, overflow: 'hidden'}}>
        <View 
          key={item.id}
          className={'card'}
          onClick={() => navigateToDetail(item.id)}
        >
          <Image className="cover" src={item.cover} mode='widthFix'/>
          {/* <Image className="cover" src={item.cover} mode="aspectFill" /> */}
          <View className="title">{item.title}</View>
          <View className="user-info">
            <Image className="avatar" src={item.avatar} />
            <View className="nickname">{item.nickname}</View>
          </View>
        </View>
      </View>
    )
  })

export default Row