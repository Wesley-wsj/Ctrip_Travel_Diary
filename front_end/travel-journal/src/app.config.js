export default defineAppConfig({
  pages: [
    'pages/select/index',
    'pages/home/index',
    // 'pages/hot/index',
    'pages/post/index',
    // 'pages/message/index',
    'pages/login/index'
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