import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  // 假设本地开发时，前端通过 vite 代理或者直接连后端跨域
  baseURL: 'http://127.0.0.1:8000', 
  timeout: 30000
})

// 请求拦截器：自动带上 Token
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器：统一处理报错
request.interceptors.response.use(
  response => response.data,
  error => {
    ElMessage.error(error.response?.data?.detail || '网络请求出错了')
    return Promise.reject(error)
  }
)

export default request