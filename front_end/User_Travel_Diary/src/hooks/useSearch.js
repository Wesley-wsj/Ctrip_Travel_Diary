import { useState, useEffect, useRef } from 'react';
import Taro from '@tarojs/taro';

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

export function useSearch() {
    const [key, setKey] = useState(0)
    const [list, setList] = useState([])
    const [keyword, setKeyword] = useState('')
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [lastId, setLastId] = useState(0)

    const keywordRef = useRef(keyword);
    const lastIdRef = useRef(lastId);
    const hasMoreRef = useRef(hasMore);
    const loadingRef = useRef(loading);

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

    const loadData = async (searchKey, id) => {
        if (loadingRef.current) return;
        setLoading(true)
        try {
            const res = await fetchTravelNotes(searchKey, id)
            if (res.length > 0) {
                const maxId = Math.max(...res.map(item => item.id))
                setLastId(maxId)
            } else {
                setHasMore(false)
                if (searchKey === keyword) return;
            }
            if (id === 0) {
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

    return {
        key,
        list,
        keyword,
        loading,
        hasMore,
        lastId,
        keywordRef,
        lastIdRef,
        hasMoreRef,
        loadingRef,
        setKeyword,
        setHasMore,
        setKey,
        loadData,
        setLoading,
        setLastId,
        setList
    }
}