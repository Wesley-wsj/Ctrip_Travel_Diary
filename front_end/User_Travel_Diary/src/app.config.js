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
  requiredPrivateInfos: [
    'chooseLocation',
    'getLocation'
  ]
})