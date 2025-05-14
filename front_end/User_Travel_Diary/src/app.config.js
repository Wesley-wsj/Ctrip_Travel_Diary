export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/select/index',
    'pages/post/index',
    'pages/detail/index',
    'pages/login/index',
    'pages/videoPlayer/index',
    'pages/diary-detail/index',
    'pages/reEditPost/index',
    'pages/register/index',
    'pages/user/index',
    'pages/shareDetail/index',
    'pages/search/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  },
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于小程序位置接口的效果展示'
    }
  },
  // 根据错误信息修改为正确的配置
  requiredPrivateInfos: [
    'chooseLocation',
    'getLocation'
    // 删除了后面的权限项，因为错误信息表明这些项设置有问题
  ]
})