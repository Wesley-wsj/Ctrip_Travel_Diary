import { useState, useEffect, useRef, useMemo } from 'react';
import { VirtualWaterfall } from '@tarojs/components-advanced'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Input, Icon, Text } from '@tarojs/components'
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
  const [key, setKey] = useState(0)
  const [list, setList] = useState([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastId, setLastId] = useState(0)

  // 使用 ref 保存最新状态值
  const keywordRef = useRef(keyword);
  const lastIdRef = useRef(lastId);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);

  // 同步 ref 与 state
  useEffect(() => {
    keywordRef.current = keyword;
  }, [keyword]);
  useEffect(() => {
    lastIdRef.current = lastId;
  }, [lastId]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

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
        console.log('meiyoule', id)
        setHasMore(false)
        if (searchKey === keyword) return;
      }
      if (id === 0) {
        console.log(id)
        setKey(p => p + 1)
        setList(res);
      } else {
        setList(prev => [...prev, ...res]);
      }
    } finally {
      setLoading(false)

      // 添加虚拟列表高度检查
      setTimeout(() => {
        const query = Taro.createSelectorQuery()
        query.select('.virtual-waterfall').fields({
          size: true,          // 获取元素的宽高
          scrollOffset: true,  // 获取滚动位置（scrollTop）
          scrollHeight: true   // 获取滚动内容的总高度
        }).exec((res) => {
          const [container] = res || []
          if (!container) return

          // 当实际内容高度 <= 容器可视高度时自动加载
          if (container.scrollHeight <= container.height + 5 &&
            hasMoreRef.current &&
            !loadingRef.current) {
            loadData(keywordRef.current, lastIdRef.current)
          }
        })
      }, 100) // 增加适当延迟确保渲染完成
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
    if (loadingRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = e.detail;
    if (scrollTop === 0) return;
    if (scrollHeight - (scrollTop + clientHeight) < 10) {
      loadData(keywordRef.current, lastIdRef.current);
    }
  };

  // 使用 useMemo 持久化节流函数
  const throttledScroll = useMemo(
    () => _.throttle(handleScroll, 1000),
    [] // 依赖项为空数组，确保只创建一次
  );

  const searchNew = () => {
    loadData(keywordRef.current, lastIdRef.current);
  }

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
          renderBottom={() => loading ? <View className="loading">加载中...</View> : (!hasMore) && <View className="no-more" onClick={searchNew}>没有更多了</View>}
        /> : (
          <View className='empty-notes'>
            <Text>暂无游记</Text>
          </View>
        )}
      </View>
      <TabBar currentPath="/pages/home/index" />
    </View>
  )
}