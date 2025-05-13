import { useState } from 'react';
import { View, Image, Video, Swiper, SwiperItem } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './MediaSwiper.scss'

export default function MediaSwiper({ media, isWifi }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const previewMedia = (index) => {
    if (media[index].type === 'video') {
      if (!isWifi) {
        Taro.showModal({
          title: '流量提醒',
          content: '当前正在使用移动网络，继续播放将消耗流量。',
          confirmText: '继续播放',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              Taro.navigateTo({
                url: `/pages/videoPlayer/index?videoUrl=${encodeURIComponent(media[index].url)}&isWifi=${isWifi}`
              });
            }
          }
        });
      } else {
        Taro.navigateTo({
          url: `/pages/videoPlayer/index?videoUrl=${encodeURIComponent(media[index].url)}&isWifi=${isWifi}`
        });
      }
    } else {
      const imageUrls = media
        .filter(item => item.type === 'image')
        .map(item => item.url);

      Taro.previewImage({
        current: media[index].url,
        urls: imageUrls
      });
    }
  };

  return (
    <>
      <Swiper
        className='media-swiper'
        indicatorDots={media.length > 1}
        indicatorColor='rgba(255, 255, 255, 0.6)'
        indicatorActiveColor='#ffffff'
        circular
        interval={3000}
        onChange={(e) => setCurrentImageIndex(e.detail.current)}
      >
        {media.map((item, index) => (
          <SwiperItem key={index}>
            {item.type === 'video' ? (
              <View className='video-container' onClick={() => previewMedia(index)}>
                {isWifi && (
                  <Video
                    className='content-video'
                    src={item.url}
                    poster={item.poster}
                    controls={false}
                    autoplay
                    loop
                    muted
                    objectFit='cover'
                    style={{ pointerEvents: 'none' }}
                  />
                )}
                {!isWifi && <View
                  className='video-overlay'
                  style={{
                    backgroundImage: `url(${item.poster})`,
                    backgroundSize: 'cover',
                  }}
                >
                  <View className='play-icon'>▶</View>
                </View>}
              </View>
            ) : (
              <Image
                className='content-image'
                src={item.url}
                mode='aspectFill'
                onClick={() => previewMedia(index)}
              />
            )}
          </SwiperItem>
        ))}
      </Swiper>
      <View className='media-indicator'>
        {currentImageIndex + 1}/{media.length}
      </View>
    </>
  );
}