import request from "@/utils/request";

export const uploadPPT = (formData: FormData) => {
  return request.post('/api/ppt/upload', formData, {
    timeout: 120000 
  })
}