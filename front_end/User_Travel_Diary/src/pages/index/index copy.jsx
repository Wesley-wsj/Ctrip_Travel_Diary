import Taro, { useLoad, useReachBottom, useRouter } from '@tarojs/taro'
import { View, Image, Input, Block } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './index.css'


// 模拟数据
const mockData = [
  {id: 1,
    title: '探索神秘古城',
    cover: require('../../../public/img/cover1.jpg'),
    avatar: require('../../../public/avatar/avatar1.jpg'),
    nickname: '旅行者一号',
    status: 'approved'
  },
  {
    id: 2,
    title: '雪山徒步指南',
    cover: require('../../../public/img/cover2.jpg'),
    avatar: require('../../../public/avatar/avatar2.jpg'),
    nickname: '登山达人',
    status: 'approved'
  },
  {
    id: 3,
    title: '海岛度假攻略',
    cover: require('../../../public/img/cover3.jpg'),
    avatar: require('../../../public/avatar/avatar3.jpg'),
    nickname: '海洋之友',
    status: 'approved'
  },
  {
    id: 4,
    title: '城市美食地图',
    cover: require('../../../public/img/cover4.jpg'),
    avatar: require('../../../public/avatar/avatar4.jpg'),
    nickname: '美食侦探',
    status: 'approved'
  },
  {
    id: 5,
    title: '自驾游西部',
    cover: require('../../../public/img/cover5.jpg'),
    avatar: require('../../../public/avatar/avatar5.jpg'),
    nickname: '公路骑士',
    status: 'approved'
  },
  // 更多模拟数据...
]

const TravelList = () => {
  const [list, setList] = useState([])
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // 加载数据
  const loadData = async (currentPage, searchKey) => {
    if (!hasMore || loading) return
    
    setLoading(true)
    try {
      // 实际替换为API调用
      const res = await mockData.filter(item => 
        item.status === 'approved' &&
        (item.title.includes(searchKey) || item.nickname.includes(searchKey))
      )
      
      setList(prev => currentPage === 1 ? res : [...prev, ...res])
      setHasMore(res.length >= 10) // 假设每页10条
      setPage(currentPage + 1)
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载
  useLoad(() => {
    loadData(1, '')
  })

  // 触底加载
  useReachBottom(() => {
    loadData(page, keyword)
  })

  // 搜索处理
  const handleSearch = (e) => {
    const value = e.detail.value
    setKeyword(value)
    loadData(1, value)
  }

  // 跳转详情页
  const navigateToDetail = (id) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${id}`
    })
  }

  return (
    <View className="container">
      {/* 搜索栏 */}
      <View className="search-bar">
        <Input
          className="search-input"
          placeholder="搜索游记或作者"
          onConfirm={handleSearch}
        />
      </View>

      {/* 瀑布流列表 */}
      <View className="waterfall">
        {list.map((item, index) => (
          <View 
            key={item.id}
            className={`card ${index % 2 === 0 ? 'left' : 'right'}`}
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
        ))}
      </View>
      
      {/* 加载状态 */}
      {loading && <View className="loading">加载中...</View>}
      {!hasMore && <View className="no-more">没有更多了</View>}


    </View>
  )
}

export default TravelList