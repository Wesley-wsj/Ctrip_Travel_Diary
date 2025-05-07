import React, { useState } from 'react';
import { VirtualWaterfall } from '@tarojs/components-advanced'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { View, Input } from '@tarojs/components'
import Row from '../../components/HomePage/Row';
import './index.css'
import _ from 'lodash';

const mockData = [
  {id: 1,
    title: '探索神秘古城',
    cover: require('../../../public/img/cover1.jpg'),
    avatar: require('../../../public/avatar/avatar1.jpg'),
    nickname: '旅行者一号',
    status: 'approved',
    height:180
  },
  {
    id: 2,
    title: '雪山徒步指南',
    cover: require('../../../public/img/cover2.jpg'),
    avatar: require('../../../public/avatar/avatar2.jpg'),
    nickname: '登山达人',
    status: 'approved',
    height:200
  },
  {
    id: 3,
    title: '海岛度假攻略',
    cover: require('../../../public/img/cover3.jpg'),
    avatar: require('../../../public/avatar/avatar3.jpg'),
    nickname: '海洋之友',
    status: 'approved',
    height:140
  },
  {
    id: 4,
    title: '城市美食地图',
    cover: require('../../../public/img/cover4.jpg'),
    avatar: require('../../../public/avatar/avatar4.jpg'),
    nickname: '美食侦探',
    status: 'approved',
    height:160
  },
  {
    id: 5,
    title: '自驾游西部',
    cover: require('../../../public/img/cover5.jpg'),
    avatar: require('../../../public/avatar/avatar5.jpg'),
    nickname: '公路骑士',
    status: 'approved',
    height:150
  },
  {id: 6,
    title: '探索神秘古ss城',
    cover: require('../../../public/img/cover1.jpg'),
    avatar: require('../../../public/avatar/avatar1.jpg'),
    nickname: '旅行者一号',
    status: 'approved',
    height:180
  },
  {
    id: 7,
    title: '雪山徒步指南',
    cover: require('../../../public/img/cover2.jpg'),
    avatar: require('../../../public/avatar/avatar2.jpg'),
    nickname: '登山达人',
    status: 'approved',
    height:200
  },
  {
    id: 8,
    title: '海岛度假攻略',
    cover: require('../../../public/img/cover3.jpg'),
    avatar: require('../../../public/avatar/avatar3.jpg'),
    nickname: '海洋之友',
    status: 'approved',
    height:140
  },
  {
    id: 9,
    title: '城市美食地图',
    cover: require('../../../public/img/cover4.jpg'),
    avatar: require('../../../public/avatar/avatar4.jpg'),
    nickname: '美食侦探',
    status: 'approved',
    height:160
  },
  {
    id: 10,
    title: '自驾游西部',
    cover: require('../../../public/img/cover5.jpg'),
    avatar: require('../../../public/avatar/avatar5.jpg'),
    nickname: '公路骑士',
    status: 'approved',
    height:180
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
      // 实际项目中替换为API调用
      const res = await mockData.filter(item => 
        item.status === 'approved' &&
        (item.title.includes(searchKey) || item.nickname.includes(searchKey))
      )
      setList(prev => [...prev, ...res]);
      setHasMore(res.length >= list.length) // 假设每页10条
      setPage(currentPage + 1)
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载
  useLoad(() => {
    loadData(1, '')
  })

  // 搜索处理
  const handleSearch = (e) => {
    const value = e.detail.value
    setKeyword(value)
    // console.log(value)
    loadData(1, value)
  }

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.detail;
    if (scrollHeight - (scrollTop + clientHeight) < 10) {
      loadData(page, keyword);
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
        {list.length && <VirtualWaterfall
          height="100%" /* 列表的高度 */
          width="100%" /* 列表的宽度 */
          item={Row} /* 列表单项组件，这里只能传入一个组件 */
          itemData={list} /* 渲染列表的数据 */
          itemCount={list.length} /* 渲染列表的长度 */
          itemSize={(i, D) => {
            if(D) {
              return D[i].height+56;
            }
          }} /* 列表单项的高度  */
          onScroll={throttledScroll}
          renderBottom={() => !hasMore && <View className="no-more">没有更多了</View>}
        />}
        
      </View>


      {/* 加载状态 */}
      {/* {loading && <View className="loading">加载中...</View>}
      {!hasMore && <View className="no-more">没有更多了</View>} */}


    </View>
  )
}

export default TravelList