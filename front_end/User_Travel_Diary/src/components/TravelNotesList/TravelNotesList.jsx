import { useRef, useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import { VirtualWaterfall } from '@tarojs/components-advanced';
import { FontAwesome } from 'taro-icons';
import Row from '../Row/Row';
import _ from 'lodash';
import './TravelNotesList.scss';

export default function TravelNotesList({
  list,
  loading,
  hasMore,
  key,
  onLoadMore,
  onSearch
}) {
  const virtualWaterfallRef = useRef(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.detail;
    setShowBackToTop(scrollTop > 300);
    if (scrollTop === 0) return;
    if (scrollHeight - (scrollTop + clientHeight) < 10) {
      onLoadMore?.();
    }
  };

  const throttledScroll = useMemo(
    () => _.throttle(handleScroll, 1000),
    []
  );

  const scrollToTop = () => {
    if (virtualWaterfallRef.current) {
      try {
        virtualWaterfallRef.current.scrollTo({ top: 0, animated: true })
      } catch (error) {
        console.error('滚动到顶部失败:', error)
      }
    }
    setShowBackToTop(false)
  }

  return (
    <View className='travel-notes-list'>
      <View className='content'>
        {list.length ? (
          <VirtualWaterfall
            ref={virtualWaterfallRef}
            enhanced
            key={key}
            height="100%"
            width="100%"
            item={Row}
            itemData={list}
            itemCount={list.length}
            itemSize={(i, D) => {
              if (D) {
                return D[i].height + 56;
              }
            }}
            onScroll={throttledScroll}
            renderBottom={() => 
              loading ? (
                <View className="loading">加载中...</View>
              ) : (
                !hasMore && (
                  <View className="no-more" onClick={onSearch}>
                    没有更多了
                  </View>
                )
              )
            }
          />
        ) : (
          <View className='empty-notes'>
            <Text>暂无游记</Text>
          </View>
        )}
      </View>

      <View
        className={`back-to-top ${showBackToTop ? 'show' : ''}`}
        onClick={scrollToTop}
      >
        <FontAwesome color='#fff' name="fal fa-angle-double-up" size={26} />
      </View>
    </View>
  );
}