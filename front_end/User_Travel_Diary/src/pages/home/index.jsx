import { View, Input } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useSearch } from '../../hooks/useSearch'
import TravelNotesList from '../../components/TravelNotesList/TravelNotesList'
import TabBar from '../../components/TabBar'
import './index.scss'

export default function HomePage() {
  const {
    key,
    list,
    loading,
    hasMore,
    keywordRef,
    lastIdRef,
    loadData
  } = useSearch();

  useLoad(() => {
    loadData('', 0)
  })

  const navigateToSearch = () => {
    Taro.navigateTo({
      url: '/pages/search/index'
    })
  }

  const handleLoadMore = () => {
    loadData(keywordRef.current, lastIdRef.current);
  }

  return (
    <View className="my-container">
      <View className="search-bar" onClick={navigateToSearch}>
        <View className="search-placeholder">
          <Input
            className="search-input"
            placeholder="搜索游记或作者"
            disabled
          />
        </View>
      </View>

      <TravelNotesList
        list={list}
        loading={loading}
        hasMore={hasMore}
        key={key}
        onLoadMore={handleLoadMore}
        onSearch={handleLoadMore}
      />

      <TabBar currentPath="/pages/home/index" />
    </View>
  )
}