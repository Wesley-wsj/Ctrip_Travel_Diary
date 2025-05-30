import { useLaunch } from '@tarojs/taro'
import './app.scss'
import 'taro-icons/scss/FontAwesome.scss'

function App({ children }) {

  useLaunch(() => {
    console.log('App launched.')
  })

  // children 是将要会渲染的页面
  return children
}

export default App
