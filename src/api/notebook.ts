import request from '@/utils/request'

export const getCollections = () => request.get('/api/notebook/collections')
export const createCollection = (data: { name: string; description?: string }) => request.post('/api/notebook/collections', data)

export const addFavorite = (data: { question_id: number; collection_id?: number | null }) => request.post('/api/notebook/favorites', data)
export const removeFavorite = (questionId: number) => request.delete(`/api/notebook/favorites/${questionId}`)
export const getFavorites = (collectionId?: number | null) => {
  const url = collectionId ? `/api/notebook/favorites?collection_id=${collectionId}` : '/api/notebook/favorites'
  return request.get(url)
}