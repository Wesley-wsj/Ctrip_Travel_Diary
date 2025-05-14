import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { useUserNotes } from '../../hooks/useUserNotes'
import TravelNotesList from '../../components/TravelNotesList/TravelNotesList'
import './index.scss'
import _ from 'lodash';


function UserSpace() {
    // 获取路由参数
    const { userId } = Taro.getCurrentInstance().router?.params || {}

    const {
        total,
        nickname,
        avatar,
        list,
        loading,
        hasMore,
        key,
        loadData,
        lastIdRef
    } = useUserNotes(userId);

    useLoad(() => {
        console.log('加载');
        loadData(0);
    });

    const handleLoadMore = () => {
        loadData(lastIdRef.current);
    };

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
            <Text className='section-title'>TA的游记</Text>
            {/* 用户游记列表 */}
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

export default UserSpace

export const config = definePageConfig({
  navigationBarTitleText: '用户空间',
});