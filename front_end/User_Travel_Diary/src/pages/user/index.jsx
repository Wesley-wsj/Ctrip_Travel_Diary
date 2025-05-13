import Taro, { useLoad } from '@tarojs/taro'
import { VirtualWaterfall } from '@tarojs/components-advanced'
import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect, useRef, useMemo } from 'react'
import Row from '../../components/HomePage/Row';
import './index.scss'
import _ from 'lodash';


function UserSpace() {
    const [key, setKey] = useState(0)
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [lastId, setLastId] = useState(0)
    const [total, setTotal] = useState(0)
    const [nickname, setNickname] = useState('未获取用户名')
    const [avatar, setAvatar] = useState('')
    const [hasMore, setHasMore] = useState(true)

    const virtualWaterfallRef = useRef(null)

    const lastIdRef = useRef(lastId);
    const hasMoreRef = useRef(hasMore);
    const loadingRef = useRef(loading);

    useEffect(() => {
        lastIdRef.current = lastId;
    }, [lastId]);
    useEffect(() => {
        hasMoreRef.current = hasMore;
    }, [hasMore]);
    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    // 获取路由参数
    const { userId } = Taro.getCurrentInstance().router?.params || {}

    // 获取用户游记列表
    const fetchTravelNotes = async (userId, last_id) => {
        try {
            const res = await Taro.request({
                url: `http://121.43.34.217:5000/api/diaries/diaries-approved/${userId}?last_id=${last_id}`,
                method: 'GET',
            });
            // console.log(res)
            if (last_id === 0) {
                setTotal(res.data.total)
                setNickname(res.data.data[0].username)
                setAvatar(res.data.data[0].avatar_url)
            }
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

    const loadData = async (userId, last_id) => {
        setLoading(true)
        try {
            const res = await fetchTravelNotes(userId, last_id)
            if (res.length > 0) {
                const maxId = Math.max(...res.map(item => item.id))
                setLastId(maxId)
            } else {
                setHasMore(false)
                return
            }
            if (last_id === 0) {
                setKey(p => p + 1)
                setList(res);
            } else {
                setList(prev => [...prev, ...res]);
            }
        } finally {
            setLoading(false)
        }
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
                    loadData(userId, lastIdRef.current)
                }
            })
        }, 100)
    }
    // console.log(list)

    useLoad(() => {
        console.log('加载')
        loadData(userId, 0)
    })

    const handleScroll = (e) => {
        if (loadingRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = e.detail;
        if (scrollTop === 0) return;
        if (scrollHeight - (scrollTop + clientHeight) < 10) {
            loadData(userId, lastIdRef.current);
        }
    };

    const searchNew = () => {
        console.log(123)
        loadData(userId, lastIdRef.current);
    }

    const throttledScroll = useMemo(
        () => _.throttle(handleScroll, 1000),
        [] // 依赖项为空数组，确保只创建一次
    );

    return (
        <View className='user-space-container'>
            {/* 用户信息卡片 */}
            <View className='user-profile'>
                <Image className='avatar' src={avatar} />
                <View className='user-info'>
                    <Text className='nickname'>{nickname}</Text>
                    <Text className='bio'>暂无个人简介</Text>
                </View>
                <View className='divider'></View>
                <View className='stats'>
                    <View className='stat-item'>
                        <Text className='stat-value'>{total}</Text>
                        <Text className='stat-label'>游记</Text>
                    </View>
                    <View className='stat-item'>
                        <Text className='stat-value'>{0}</Text>
                        <Text className='stat-label'>粉丝</Text>
                    </View>
                    <View className='stat-item'>
                        <Text className='stat-value'>{0}</Text>
                        <Text className='stat-label'>关注</Text>
                    </View>
                </View>
            </View>

            {/* 用户游记列表 */}
            <View className='travel-notes-list'>
                <View className='content'>
                    <Text className='section-title'>TA的游记</Text>
                    {list.length ? <VirtualWaterfall
                        ref={virtualWaterfallRef}
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
                        renderBottom={() => loading ? <View className="loading">加载中...</View> : (!hasMore) && <View className="no-more" >没有更多了</View>}
                    /> : (
                        <View className='empty-notes'>
                            <Text>暂无游记</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    )
}

export default UserSpace