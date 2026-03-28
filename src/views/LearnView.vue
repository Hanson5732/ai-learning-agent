<template>
    <div class="chat-container">
        <div class="chat-history" ref="chatHistoryRef">
            <div v-if="!currentKnowledge" class="empty-state">
                <el-icon :size="60" color="#c0c4cc">
                    <ChatDotRound />
                </el-icon>
                <p>输入你想要学习的知识点，AI 老师为你生成专属教程与练习</p>
            </div>

            <div v-else class="knowledge-card">
                <h2 class="title">{{ currentKnowledge.title }}</h2>
                <div class="content" v-html="formatMarkdown(currentKnowledge.content)"></div>

                <el-divider>巩固练习 (5题)</el-divider>

                <div v-for="(q, index) in currentKnowledge.questions" :key="q.id" class="question-item">

                    <div class="q-header">
                        <el-button type="warning" link @click="toggleFavorite(q.id)" class="star-btn">
                            <el-icon>
                                <StarFilled v-if="favoritedQuestions.has(q.id)" />
                                <Star v-else />
                            </el-icon>
                        </el-button>
                        <p class="q-prompt">{{ index + 1 }}. {{ q.prompt }}</p>
                    </div>

                    <el-radio-group v-if="userAnswers[index]" v-model="userAnswers[index].selected_answer"
                        class="q-options" :disabled="hasSubmitted">
                        <el-radio v-for="(opt, oIndex) in q.options" :key="oIndex" :label="opt" :value="opt"
                            class="q-radio">
                            {{ opt }}
                        </el-radio>
                    </el-radio-group>

                    <div v-if="hasSubmitted && evalResults[q.id]" class="eval-result"
                        :class="evalResults[q.id].is_correct ? 'correct' : 'wrong'">
                        
                        <div class="result-header" style="margin-bottom: 8px; font-size: 15px;">
                            <el-icon v-if="evalResults[q.id].is_correct"><Check /></el-icon>
                            <el-icon v-else><Close /></el-icon>
                            <span class="result-text" style="margin-left: 5px;">
                                {{ evalResults[q.id].is_correct ? '回答正确！' : '回答错误。' }}
                                正确答案是：<strong>{{ evalResults[q.id].correct_answer }}</strong>
                            </span>
                        </div>
                        
                        <p class="explanation" style="margin: 0; line-height: 1.5;">
                            <strong>💡 解析：</strong>{{ evalResults[q.id].explanation }}
                        </p>
                        
                    </div>
                </div>
                <div class="action-bar" v-if="!hasSubmitted">
                    <el-button type="primary" @click="submitAnswers" :loading="submitLoading">提交答案</el-button>
                </div>
                <div class="score-board" v-else>
                    <h3>得分：{{ scoreInfo.correct_count }} / {{ scoreInfo.total_count }}</h3>
                    <el-button type="success" @click="resetView">学完了，换个知识点</el-button>
                </div>
            </div>
        </div>

        <div class="chat-input-area">
            <div class="input-wrapper">
                <el-select v-model="difficulty" style="width: 100px; margin-right: 10px;">
                    <el-option label="入门" value="intro" />
                    <el-option label="中级" value="mid" />
                    <el-option label="高级" value="adv" />
                </el-select>

                <el-input v-model="topicInput" placeholder="输入知识点..." @keyup.enter="handleGenerate" :disabled="loading">
                    <template #append>
                        <el-button @click="handleGenerate" :loading="loading" type="primary">发送</el-button>
                    </template>
                </el-input>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, Check, Close, Star, StarFilled } from '@element-plus/icons-vue'
import { generateKnowledge, evaluateAnswers } from '../api/knowledge'
import { addFavorite, removeFavorite } from '../api/notebook'
import MarkdownIt from 'markdown-it'
import mkatex from 'markdown-it-katex'
import 'katex/dist/katex.min.css'
import { useRoute } from 'vue-router'

const md = new MarkdownIt().use(mkatex)
const route = useRoute()

const formatMarkdown = (text: string) => {
  if (!text) return ''
  return md.render(text)
}

interface QuestionData {
  id: number;
  prompt: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface KnowledgeData {
  knowledge_id: number;
  title: string;
  content: string;
  questions: QuestionData[];
}

const topicInput = ref('')
const difficulty = ref('intro')
const loading = ref(false)
const submitLoading = ref(false)

// 核心状态数据
const currentKnowledge = ref<KnowledgeData | null>(null)
const userAnswers = ref<{question_id: number, selected_answer: string}[]>([])
const hasSubmitted = ref(false)
const evalResults = ref<Record<number, any>>({})
const scoreInfo = ref({ correct_count: 0, total_count: 5 })
const favoritedQuestions = ref<Set<number>>(new Set())

// === 缓存逻辑：页面加载时读取数据 ===
onMounted(() => {
  const cachedData = localStorage.getItem('ai_learning_cache')
  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData)
      currentKnowledge.value = parsed.currentKnowledge || null
      userAnswers.value = parsed.userAnswers || []
      hasSubmitted.value = parsed.hasSubmitted || false
      evalResults.value = parsed.evalResults || {}
      scoreInfo.value = parsed.scoreInfo || { correct_count: 0, total_count: 5 }
      if (parsed.favoritedQuestions) {
        favoritedQuestions.value = new Set(parsed.favoritedQuestions)
      }
    } catch (e) {
      console.error('读取缓存失败:', e)
    }
  }

  const autoTopic = route.query.autoTopic as string
  if (autoTopic) {
    resetView()
    topicInput.value = autoTopic
    setTimeout(() => {
      handleGenerate()
    }, 300)
  }
})

// === 缓存逻辑：数据变化时自动保存 ===
watch(
  [currentKnowledge, userAnswers, hasSubmitted, evalResults, scoreInfo, favoritedQuestions],
  () => {
    const dataToSave = {
      currentKnowledge: currentKnowledge.value,
      userAnswers: userAnswers.value,
      hasSubmitted: hasSubmitted.value,
      evalResults: evalResults.value,
      scoreInfo: scoreInfo.value,
      // Set 类型不能直接被 JSON 序列化，需要转成数组
      favoritedQuestions: Array.from(favoritedQuestions.value) 
    }
    localStorage.setItem('ai_learning_cache', JSON.stringify(dataToSave))
  },
  { deep: true } // 深度监听，保证数组和对象内部的变化也能被捕捉到
)

const resetView = () => {
  currentKnowledge.value = null
  hasSubmitted.value = false
  evalResults.value = {}
  userAnswers.value = []
  favoritedQuestions.value.clear()
  topicInput.value = ''
  // 换个知识点时，清理掉缓存
  localStorage.removeItem('ai_learning_cache')
}

const doGenerate = async (topic: string, diff: string) => {
  loading.value = true
  try {
    const res: any = await generateKnowledge({ topic, difficulty: diff })
    
    userAnswers.value = res.questions.map((q: any) => ({
      question_id: q.id,
      selected_answer: ''
    }))
    currentKnowledge.value = res as KnowledgeData
    
    hasSubmitted.value = false
    evalResults.value = {}
    favoritedQuestions.value.clear() // 新生成时清空之前的收藏状态
  } catch (error) {
    console.error('生成失败:', error)
  } finally {
    loading.value = false
  }
}

const handleGenerate = () => {
  if (!topicInput.value.trim()) return
  doGenerate(topicInput.value, difficulty.value)
  topicInput.value = ''
}

const submitAnswers = async () => {
  const isAllAnswered = userAnswers.value.every(a => a.selected_answer !== '')
  if (!isAllAnswered) {
    return ElMessage.warning('请做完所有的题目再提交哦！')
  }

  submitLoading.value = true
  try {
    const res: any = await evaluateAnswers({
      knowledge_id: currentKnowledge.value!.knowledge_id,
      answers: userAnswers.value
    })
    
    const resultMap: Record<number, any> = {}
    res.results.forEach((r: any) => { resultMap[r.question_id] = r })
    
    evalResults.value = resultMap
    scoreInfo.value = { correct_count: res.correct_count, total_count: res.total_count }
    hasSubmitted.value = true

    if (res.need_regenerate) {
      ElMessageBox.confirm(
        `哎呀，5题只对了 ${res.correct_count} 题（正确率低于40%）。看来掌握得还不够透彻，是否让 AI 换个方式重新给你讲解并出题？`,
        '需要巩固',
        { confirmButtonText: '重新生成', cancelButtonText: '先看看解析', type: 'warning' }
      ).then(() => {
        doGenerate(currentKnowledge.value!.title, difficulty.value)
      }).catch(() => {
        ElMessage.info('可以先看看错题解析，消化一下~')
      })
    } else {
      ElMessage.success('提交成功！干得漂亮！')
    }
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const toggleFavorite = async (questionId: number) => {
  try {
    if (favoritedQuestions.value.has(questionId)) {
      await removeFavorite(questionId)
      favoritedQuestions.value.delete(questionId)
      ElMessage.success('已取消收藏')
    } else {
      await addFavorite({ question_id: questionId })
      favoritedQuestions.value.add(questionId)
      ElMessage.success('已加入错题本！')
    }
  } catch (error) {
    console.error('收藏操作失败', error)
  }
}
</script>

<style scoped>
/* 样式部分保留咱们之前的，加点小补充 */
/* 新增的题目 UI 样式 */
.q-header {
  display: flex;
  align-items: flex-start;
  gap: 8px; /* 星星和题目之间的间距 */
  margin-bottom: 12px;
}

.star-btn {
  font-size: 20px;
  padding: 0;
  margin-top: -2px; /* 微调一下，让星星和第一行文字视觉上对齐 */
}

.q-prompt {
  margin: 0;
  font-weight: bold;
  line-height: 1.5;
}

/* 强制让选项变成纵向排列，且左对齐，并与上面的题干文本对齐（留出星星的宽度） */
.q-options {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding-left: 28px; 
}

/* 修复 Element Plus 单选框文字过长不换行的问题 */
.q-radio {
  margin-right: 0;
  height: auto; /* 取消固定高度 */
}
:deep(.el-radio__label) {
  white-space: normal; /* 允许换行 */
  line-height: 1.5;
  display: inline-block;
  vertical-align: top;
}

.chat-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 48px);
    position: relative;
}

.chat-history {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 80px;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #909399;
}

.knowledge-card {
    background: #fff;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .05);
    margin-bottom: 20px;
}

.title {
    margin-top: 0;
    color: #303133;
}

.content {
    line-height: 1.6;
    color: #606266;
    margin-bottom: 30px;
}

.question-item {
    margin-bottom: 25px;
    background: #f9fafc;
    padding: 15px;
    border-radius: 6px;
}

.q-prompt {
    font-weight: bold;
    margin-bottom: 10px;
}

.q-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* 批改结果样式 */
.eval-result {
    margin-top: 15px;
    padding: 12px;
    border-radius: 4px;
    font-size: 14px;
}

.eval-result.correct {
    background-color: #f0f9eb;
    color: #67c23a;
    border: 1px solid #e1f3d8;
}

.eval-result.wrong {
    background-color: #fef0f0;
    color: #f56c6c;
    border: 1px solid #fde2e2;
}

.explanation {
    margin-top: 8px;
    color: #606266;
}

.score-board {
    margin-top: 20px;
    text-align: center;
}

.chat-input-area {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: #f5f7fa;
    padding-top: 15px;
}

.input-wrapper {
    display: flex;
    max-width: 800px;
    margin: 0 auto;
    background: #fff;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}
</style>