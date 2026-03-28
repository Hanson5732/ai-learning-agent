import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('access_token') || '')
  const userInfo = ref<any>(null)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('access_token', newToken)
  }

  const fetchUserInfo = async () => {
    // 如果连 Token 都没有，直接不用发请求了
    if (!token.value) return 
    
    try {
      // 调用咱们刚刚在后端写的 /me 接口（注意这里的路径要和你的后端对齐）
      const res: any = await request.get('/api/auth/me')
      userInfo.value = res // 把后端返回的 {"id": 1, "username": "Hanson"} 存起来
    } catch (error) {
      console.error('获取用户信息失败，可能是 Token 过期了', error)
      clearAuth() // 获取失败（比如 Token 失效），顺手清理掉登录状态
    }
  }

  const clearAuth = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('access_token')
  }

  return { token, userInfo, setToken, clearAuth, fetchUserInfo }
})