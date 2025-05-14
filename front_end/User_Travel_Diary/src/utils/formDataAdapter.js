import Taro from '@tarojs/taro'
import FormData from './formData'

// 重写FormData的一些方法，使其适配Taro环境
class TaroFormData extends FormData {
  constructor() {
    super()
    // 使用Taro的文件系统API替代wx的API
    this.fileManager = Taro.getFileSystemManager()
  }
  
  // 如果需要，可以重写appendFile方法
  appendFile(name, path, fileName) {
    try {
      // 使用Taro API读取文件
      const buffer = this.fileManager.readFileSync(path)
      
      if(Object.prototype.toString.call(buffer).indexOf("ArrayBuffer") < 0){
        return false
      }
  
      if(!fileName){
        fileName = this.getFileNameFromPath(path)
      }
  
      this.files.push({
        name: name,
        buffer: buffer,
        fileName: fileName
      })
      return true
    } catch (error) {
      console.error('读取文件失败:', error)
      return false
    }
  }
  
  getFileNameFromPath(path) {
    let idx = path.lastIndexOf("/")
    return path.substr(idx+1)
  }
}

export default TaroFormData