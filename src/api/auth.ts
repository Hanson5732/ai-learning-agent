import request from '@/utils/request'

export const login = (data: any) => {
  // 注意：FastAPI 的 OAuth2 需要 application/x-www-form-urlencoded 格式
  return request.post('/api/auth/login', data, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
}

export const register = (data: any) => {
  return request.post('/api/auth/register', data)
}

export const getUserInfo = () => {
  return request.get('/api/auth/me')
}