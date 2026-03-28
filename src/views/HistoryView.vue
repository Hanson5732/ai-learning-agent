<template>
  <div class="history-container">
    <div class="header-section">
      <div class="title-area">
        <h2>学习足迹</h2>
        <p class="subtitle">回顾你与 AI 一起探索过的知识点</p>
      </div>
      <div class="search-area">
        <el-input
          v-model="searchInput"
          placeholder="搜索知识点标题或内容..."
          style="width: 300px"
          @keyup.enter="handleSearch"
          clearable
          @clear="handleSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch" />
          </template>
        </el-input>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="paginatedList.length === 0" class="empty-state">
      <el-empty description="没有找到相关的学习记录哦~" />
    </div>

    <div v-else class="list-wrapper">
      <el-card v-for="item in paginatedList" :key="item.id" class="history-card" shadow="hover">
        <el-row :gutter="30">
          
          <el-col :span="14" class="left-col">
            <div class="card-header">
              <h4 class="title">{{ item.title }}</h4>
              <div class="meta-tags">
                <el-tag :type="getDifficultyType(item.difficulty)" size="small">
                  {{ getDifficultyLabel(item.difficulty) }}
                </el-tag>
                <span class="time">{{ item.created_at }}</span>
                <el-button type="danger" link :icon="Delete" @click="handleDelete(item.id)"></el-button>
              </div>
            </div>
            <p class="summary">{{ stripMarkdown(item.content).substring(0, 100) }}...</p>
            <el-button type="primary" link @click="viewDetail(item, 'knowledge')">
              查看完整知识点 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </el-col>

          <el-col :span="10">
            <div class="questions-box">
              <div class="q-box-header">配套练习 ({{ item.questions?.length || 0 }}题)</div>
              
              <div class="q-preview" v-if="item.questions && item.questions.length > 0">
                <p class="q-prompt-preview">1. {{ item.questions[0]?.prompt }}</p>
                <p class="q-prompt-preview" v-if="item.questions.length > 1">2. {{ item.questions[1]?.prompt }}</p>
                <p class="q-more" v-if="item.questions.length > 2">......</p>
              </div>

              <div class="q-action">
                <el-button type="success" plain size="small" @click="viewDetail(item, 'questions')">
                  查看题目与解析 <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </el-col>

        </el-row>
      </el-card>

      <div class="pagination-area" v-if="totalPages > 0">
        <span class="page-info">共 {{ totalPages }} 页</span>
        
        <el-button-group class="page-buttons">
          <el-button :disabled="currentPage === 1" @click="goToFirst" :icon="DArrowLeft" title="第一页" />
          <el-button :disabled="currentPage === 1" @click="goToPrev" :icon="ArrowLeft" title="上一页" />
          <el-button disabled class="current-page-btn">第 {{ currentPage }} 页</el-button>
          <el-button :disabled="currentPage === totalPages" @click="goToNext" :icon="ArrowRight" title="下一页" />
          <el-button :disabled="currentPage === totalPages" @click="goToLast" :icon="DArrowRight" title="最末页" />
        </el-button-group>

        <div class="jump-box">
          前往 
          <el-input 
            v-model="jumpPage" 
            size="default" 
            class="jump-input" 
            @keyup.enter="handleJump" 
            @blur="handleJump" 
          /> 
          页
        </div>
      </div>
    </div>

    <el-drawer v-model="drawerVisible" :title="currentDetail?.title" size="50%">
      <el-tabs v-model="activeTab" class="detail-tabs">
        
        <el-tab-pane label="📚 知识点详解" name="knowledge">
          <div v-if="currentDetail" class="detail-content">
            <div class="meta-info">
              <el-tag :type="getDifficultyType(currentDetail.difficulty)">{{ getDifficultyLabel(currentDetail.difficulty) }}</el-tag>
              <span class="time">{{ currentDetail.created_at }}</span>
            </div>
            <el-divider />
            <div class="markdown-body" v-html="formatMarkdown(currentDetail.content)"></div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="📝 题目与解析" name="questions">
          <div v-if="currentDetail" class="detail-content">
            <div v-for="(q, index) in currentDetail.questions" :key="index" class="drawer-q-item">
              <p class="drawer-q-prompt"><strong>{{ index + 1 }}. {{ q.prompt }}</strong></p>
              <div class="drawer-q-options">
                <p v-for="(opt, oIndex) in q.options" :key="oIndex">{{ opt }}</p>
              </div>
              <div class="drawer-q-ans-box">
                <p class="q-ans"><strong>正确答案：</strong>{{ q.correct_answer }}</p>
                <p class="q-exp"><strong>解析：</strong>{{ q.explanation }}</p>
              </div>
            </div>
          </div>
        </el-tab-pane>

      </el-tabs>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ArrowRight, Search, ArrowLeft, DArrowLeft, DArrowRight, Delete } from '@element-plus/icons-vue'
import { getKnowledgeHistory, deleteKnowledgeHistory } from '../api/knowledge'
import { ElMessageBox, ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import mkatex from 'markdown-it-katex'
import 'katex/dist/katex.min.css'

const md = new MarkdownIt().use(mkatex)
const formatMarkdown = (text: string) => text ? md.render(text) : ''
const stripMarkdown = (text: string) => text ? text.replace(/[#*`_>]/g, '').replace(/\n/g, ' ') : ''

interface QuestionData {
  prompt: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface HistoryItem {
  id: number;
  title: string;
  difficulty: string;
  content: string;
  source: string;
  created_at: string;
  questions: QuestionData[]; // 明确告诉 TS 这是个数组
}

const loading = ref(false)
const rawHistoryList = ref<HistoryItem[]>([]) // 使用定义好的接口

// 搜索与分页
const searchInput = ref('')
const activeSearchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const totalPages = computed(() => Math.ceil(filteredList.value.length / pageSize.value) || 1)
const jumpPage = ref<number | string>(currentPage.value)
watch(currentPage, (val) => {
  jumpPage.value = val
})

const goToFirst = () => { currentPage.value = 1; scrollToTop() }
const goToPrev = () => { if (currentPage.value > 1) currentPage.value--; scrollToTop() }
const goToNext = () => { if (currentPage.value < totalPages.value) currentPage.value++; scrollToTop() }
const goToLast = () => { currentPage.value = totalPages.value; scrollToTop() }

const handleJump = () => {
  let target = Number(jumpPage.value)
  if (isNaN(target) || target < 1) target = 1
  if (target > totalPages.value) target = totalPages.value
  
  currentPage.value = target
  jumpPage.value = target
  scrollToTop()
}

const handleSearch = () => {
  activeSearchQuery.value = searchInput.value.trim().toLowerCase()
  currentPage.value = 1
}

const filteredList = computed(() => {
  if (!activeSearchQuery.value) return rawHistoryList.value
  return rawHistoryList.value.filter(item => 
    item.title.toLowerCase().includes(activeSearchQuery.value) || 
    (item.content && item.content.toLowerCase().includes(activeSearchQuery.value))
  )
})

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredList.value.slice(start, end)
})

const scrollToTop = () => {
  const container = document.querySelector('.history-container')
  if (container) {
    container.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// 抽屉相关状态
const drawerVisible = ref(false)
const currentDetail = ref<HistoryItem | null>(null)
const activeTab = ref('knowledge')

const viewDetail = (item: HistoryItem, tab: string) => {
  currentDetail.value = item
  activeTab.value = tab // 点左边打开知识点 Tab，点右边打开题目 Tab
  drawerVisible.value = true
}

const getDifficultyLabel = (diff: string) => {
  const map: Record<string, string> = { 'intro': '入门', 'mid': '中级', 'adv': '高级' }
  return map[diff] || diff
}

const getDifficultyType = (diff: string) => {
  const map: Record<string, string> = { 'intro': 'success', 'mid': 'warning', 'adv': 'danger' }
  return map[diff] || 'info'
}

const loadHistory = async () => {
  loading.value = true
  try {
    const res: any = await getKnowledgeHistory()
    rawHistoryList.value = res as HistoryItem[]
  } catch (error) {
    console.error('获取历史记录失败', error)
  } finally {
    loading.value = false
  }
}

const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定要删除这条学习足迹吗？对应的题目也会一起消失哦。', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteKnowledgeHistory(id)
      ElMessage.success('已删除')
      loadHistory() // 重新拉取列表刷新页面
    } catch (error) {
      console.error('删除失败', error)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-container { padding: 24px; background: #f5f7fa; border-radius: 8px; min-height: 100%;}

.header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 12px 0 rgba(0,0,0,.02); }
.title-area h2 { margin: 0 0 8px 0; color: #303133; }
.subtitle { margin: 0; color: #909399; font-size: 14px; }
.list-wrapper { display: flex; flex-direction: column; gap: 20px; }
.history-card { border-radius: 8px; border: none; box-shadow: 0 2px 12px 0 rgba(0,0,0,.05); }
.left-col { border-right: 1px dashed #ebeef5; padding-right: 20px !important; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.title { margin: 0; font-size: 18px; color: #303133; }
.meta-tags { display: flex; align-items: center; gap: 12px; }
.time { color: #909399; font-size: 13px; }
.summary { color: #606266; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0; }
.pagination-area { display: flex; justify-content: center; padding: 20px 0; }

/* === 优化后的右侧题目预览框样式 === */
.questions-box {
  background-color: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.q-box-header {
  font-size: 14px;
  font-weight: bold;
  color: #606266;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.q-preview {
  flex: 1;
}

.q-prompt-preview {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}

.q-more {
  color: #c0c4cc;
  margin: 0;
  font-size: 12px;
}

.q-action {
  margin-top: 15px;
  text-align: left;
}

/* === 抽屉内的样式 === */
.detail-tabs {
  padding: 0 20px;
}

.detail-content {
  padding: 10px 0;
}

.markdown-body {
  line-height: 1.6;
  color: #333;
  font-size: 15px;
}

/* 抽屉内题目专属样式 */
.drawer-q-item {
  background: #f9fafc;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.drawer-q-prompt {
  margin: 0 0 15px 0;
  font-size: 15px;
  color: #303133;
}

.drawer-q-options p {
  margin: 0 0 10px 0;
  color: #606266;
  padding-left: 20px;
}

.drawer-q-ans-box {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #dcdfe6;
}

.q-ans {
  margin: 0 0 8px 0;
  color: #67c23a;
}

.q-exp {
  margin: 0;
  color: #909399;
  line-height: 1.5;
}

.pagination-area {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  gap: 15px;
  color: #606266;
  font-size: 14px;
}

.page-info {
  font-weight: bold;
}

.page-buttons .current-page-btn {
  color: #409EFF !important;
  font-weight: bold;
  background-color: #ecf5ff !important;
  opacity: 1 !important; /* 覆盖 disabled 的半透明效果 */
}

.jump-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.jump-input {
  width: 50px;
}
:deep(.jump-input .el-input__inner) {
  text-align: center;
}
</style>