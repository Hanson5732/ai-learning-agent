<template>
  <div class="ppt-container">
    <div class="header-section">
      <h2>PPT 智能解析</h2>
      <p class="subtitle">上传你的课堂课件，AI 自动帮你拆解出核心学习大纲</p>
    </div>

    <div class="upload-wrapper" v-if="!loading && topics.length === 0">
      <el-upload
        class="ppt-uploader"
        drag
        action="#"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
        accept=".ppt,.pptx, .pdf"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将 PPT / PPTX / PDF 文件拖到此处，或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip text-center">
            AI 需要阅读课件中的文字内容，纯图片组成的 PPT 可能无法准确提取哦
          </div>
        </template>
      </el-upload>
    </div>

    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading loading-icon"><Loading /></el-icon>
      <h3>AI 正在疯狂阅读你的课件...</h3>
      <p>这大概需要十几秒的时间，喝口水耐心等一下吧 ☕</p>
    </div>

    <div v-if="topics.length > 0 && !loading" class="result-area">
      <div class="result-header">
        <h3>🎉 提取成功！发现以下核心知识点：</h3>
        <el-button @click="resetUpload" plain>重新上传课件</el-button>
      </div>
      
      <div class="topics-grid">
        <el-card 
          v-for="(topic, index) in topics" 
          :key="index" 
          class="topic-card" 
          shadow="hover"
          @click="jumpToLearn(topic)"
        >
          <div class="topic-content">
            <div class="topic-index">{{ index + 1 }}</div>
            <div class="topic-name">{{ topic }}</div>
          </div>
          <el-icon class="go-icon"><ArrowRight /></el-icon>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { UploadFilled, Loading, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { uploadPPT } from '../api/ppt' // 确保你按上一步创建了这个 api 文件

const router = useRouter()
const loading = ref(false)
const topics = ref<string[]>([])

const resetUpload = () => {
  topics.value = []
}

const handleFileChange = async (file: any) => {
  const rawFile = file.raw
  if (!rawFile) return

  const isPPT = rawFile.name.endsWith('.ppt') || rawFile.name.endsWith('.pptx') || rawFile.name.endsWith('.pdf')
  if (!isPPT) {
    ElMessage.error('只能上传 PPT、PPTX 或 PDF 格式的文件哦！')
    return
  }

  // 组装表单数据
  const formData = new FormData()
  formData.append('file', rawFile)

  loading.value = true
  topics.value = []

  try {
    const res: any = await uploadPPT(formData)
    if (res && res.topics && res.topics.length > 0) {
      topics.value = res.topics
      ElMessage.success('解析成功！快去攻克这些知识点吧！')
    } else {
      ElMessage.warning('没有提取到有效知识点，可能是 PPT 里文字太少了？')
    }
  } catch (error) {
    console.error('PPT 解析失败:', error)
    ElMessage.error('解析失败了，检查一下后端服务有没有报错吧。')
  } finally {
    loading.value = false
  }
}

// 核心联动：点击卡片，带着参数跳回学习页面
const jumpToLearn = (topic: string) => {
  router.push({
    path: '/learn',
    query: { autoTopic: topic } // 用 query 把知识点传过去
  })
}
</script>

<style scoped>
.ppt-container {
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.05);
  min-height: calc(100vh - 48px);
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.header-section h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 24px;
}

.subtitle {
  margin: 0;
  color: #909399;
}

.upload-wrapper {
  max-width: 600px;
  margin: 0 auto;
}

.ppt-uploader {
  width: 100%;
}

:deep(.el-upload-dragger) {
  padding: 60px 20px;
  border-radius: 12px;
}

.text-center {
  text-align: center;
  margin-top: 15px;
}

.loading-state {
  text-align: center;
  padding: 60px 0;
  color: #409EFF;
}

.loading-icon {
  font-size: 50px;
  margin-bottom: 20px;
}

.loading-state h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.loading-state p {
  margin: 0;
  color: #909399;
}

.result-area {
  max-width: 800px;
  margin: 0 auto;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.result-header h3 {
  margin: 0;
  color: #67c23a;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.topic-card {
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 8px;
}

.topic-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.1);
  border-color: #409EFF;
}

:deep(.topic-card .el-card__body) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}

.topic-content {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.topic-index {
  width: 30px;
  height: 30px;
  background: #ecf5ff;
  color: #409EFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
}

.topic-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  line-height: 1.4;
  /* 文字过长省略号 */
  display: -webkit-box;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.go-icon {
  font-size: 20px;
  color: #c0c4cc;
}

.topic-card:hover .go-icon {
  color: #409EFF;
}
</style>