import { useState } from 'react';
import { VirtualWaterfall } from '@tarojs/components-advanced'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Input } from '@tarojs/components'
import Row from '../../components/HomePage/Row';
import './index.scss'
import TabBar from '../../components/TabBar'
import _ from 'lodash';

const fetchTravelNotes = async (keyword, last_id) => {
  try {
    const res = await Taro.request({
      url: "http://121.43.34.217:5000/api/diaries/search",
      method: 'POST',
      data: {
        last_id,
        keyword,
        search_fields: ["title", "username"]
      }
    });

    if (res.statusCode === 200) {
      return res.data.data.map(item => ({
        id: item.id,
        title: item.title,
        cover: item.images[0],
        height: 180 / +item.first_image_ratio,
        avatar: item.avatar_url,
        nickname: item.username
      }))
    }
    throw new Error(res.data.message || '请求失败')
  } catch (error) {
    console.error('API请求错误:', error)
    Taro.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    })
    return []
  }
}

export default function HomePage() {
  // return (
  //   <View style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
  //     {/* 空白页面内容 */}

  //     {/* 底部导航栏 */}
  //     <TabBar currentPath="/pages/home/index" />
  //   </View>
  // )
  const [key, setKey] = useState(0)
  const [list, setList] = useState([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastId, setLastId] = useState(0)

  // 加载数据
  const loadData = async (searchKey, id) => {
    setLoading(true)
    try {
      const res = await fetchTravelNotes(searchKey, id)
      // console.log(res, id, keyword)
      if (res.length > 0) {
        const maxId = Math.max(...res.map(item => item.id))
        setLastId(maxId)
      } else {
        console.log('meiyoule')
        setHasMore(false)
        return
      }
      if (id === 0) {
        setKey(p => p + 1)
        setList(res);
      } else {
        setList(prev => [...prev, ...res]);
      }
    } finally {
      setLoading(false)
    }
  }

  // console.log(list)

  // 初始化加载
  useLoad(() => {
    loadData('', 0)
  })

  // 搜索处理
  const handleSearch = (e) => {
    const value = e.detail.value
    setKeyword(value)
    setHasMore(true)
    loadData(value, 0)
  }

  //触底加载
  const handleScroll = (e) => {
    if (loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.detail;
    if (scrollTop === 0) return
    if (scrollHeight - (scrollTop + clientHeight) < 10) {
      loadData(keyword, lastId, hasMore);
    }
  };

  const throttledScroll = _.throttle(handleScroll, 1000);

  return (
    <View className="my-container">
      {/* 搜索栏 */}
      <View className="search-bar">
        <Input
          className="search-input"
          placeholder="搜索游记或作者"
          onConfirm={handleSearch}
        />
      </View>

      <View className='content'>
        {list.length ? <VirtualWaterfall
          key={key}
          height="100%" /* 列表的高度 */
          width="100%" /* 列表的宽度 */
          item={Row} /* 列表单项组件，这里只能传入一个组件 */
          itemData={list} /* 渲染列表的数据 */
          itemCount={list.length} /* 渲染列表的长度 */
          itemSize={(i, D) => {
            if (D) {
              return D[i].height + 56;
            }
          }} /* 列表单项的高度  */
          onScroll={throttledScroll}
          renderBottom={() => loading ? <View className="loading">加载中...</View> : (!hasMore) && <View className="no-more">没有更多了</View>}
        /> : null}
      </View>
      <TabBar currentPath="/pages/home/index" />
    </View>
  )
}
