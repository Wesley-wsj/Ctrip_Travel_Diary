import { View, Input } from '@tarojs/components'
import { useSearch } from '../../hooks/useSearch'
import TravelNotesList from '../../components/TravelNotesList/TravelNotesList';
import './index.scss'

export default function SearchPage() {
  const {
    key,
    list,
    loading,
    hasMore,
    setHasMore,
    keywordRef,
    setKeyword,
    lastIdRef,
    loadData
  } = useSearch();

  const handleSearch = (e) => {
    const value = e.detail.value
    setKeyword(value)
    setHasMore(true)
    loadData(value, 0)
  }

  const handleLoadMore = () => {
    loadData(keywordRef.current, lastIdRef.current);
  }

  return (
    <View className="search-page">
      <View className="search-bar">
        <Input
          className="search-input"
          placeholder="搜索游记或作者"
          onConfirm={handleSearch}
          focus
        />
      </View>

      <TravelNotesList
        list={list}
        loading={loading}
        hasMore={hasMore}
        key={key}
        onLoadMore={handleLoadMore}
        onSearch={handleLoadMore}
      />
    </View>
  )
}