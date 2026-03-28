import request from '@/utils/request'

export const generateKnowledge = (data: { topic: string; difficulty: string }) => {
  return request.post('/api/knowledge/generate', data)
}

export const evaluateAnswers = (data: { knowledge_id: number; answers: any[] }) => {
  return request.post('/api/attempts/batch-evaluate', data)
}

export const getKnowledgeHistory = () => {
  return request.get('/api/knowledge/history')
}

export const deleteKnowledgeHistory = (id: number) => {
  return request.delete(`/api/knowledge/history/${id}`)
}