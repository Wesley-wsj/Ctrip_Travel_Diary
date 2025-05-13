import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './UserCard.scss'

export default function UserCard({ avatar, username, userId }) {
  return (
    <View className='user-card' onClick={() => Taro.navigateTo({
      url: `/pages/user/index?userId=${userId}`
    })}>
      <Image className='avatar' src={avatar} />
      <View className='user-info'>
        <Text className='nickname'>{username}</Text>
      </View>
      <View className='follow-btn'>+关注</View>
    </View>
  );
}