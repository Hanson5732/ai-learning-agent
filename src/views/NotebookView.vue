<template>
  <div class="notebook-container">
    <el-container style="height: 100%;">
      <el-aside width="240px" class="collection-aside">
        <div class="aside-header">
          <h3>我的错题本</h3>
          <el-button type="primary" size="small" :icon="Plus" circle @click="showCreateDialog = true" />
        </div>
        
        <el-menu :default-active="activeCollectionStr" class="collection-menu" @select="handleSelectCollection">
          <el-menu-item index="all">
            <el-icon><Collection /></el-icon>
            <span>全部错题</span>
          </el-menu-item>
          <el-menu-item v-for="col in collections" :key="col.id" :index="String(col.id)">
            <el-icon><Folder /></el-icon>
            <span>{{ col.name }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="notebook-main">
        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="5" animated />
        </div>
        
        <div v-else-if="favorites.length === 0" class="empty-state">
          <el-empty description="这里空空如也，看来你掌握得很好！" />
        </div>

        <div v-else class="favorites-list">
          <el-card v-for="item in favorites" :key="item.favorite_id" class="question-card" shadow="hover">
            <div class="q-header">
              <p class="q-prompt" v-html="formatMarkdown(item.question.prompt)"></p>
              
              <div class="q-actions" style="flex-shrink: 0; margin-left: 15px;">
                <el-button type="primary" link :icon="FolderOpened" @click="openMoveDialog(item)">
                  移至合集
                </el-button>
                <el-button type="danger" link :icon="Delete" @click="handleRemove(item.question.id)">
                  移除
                </el-button>
              </div>
            </div>
            <div class="q-options">
              <div 
                v-for="(opt, oIndex) in item.question.options" 
                :key="oIndex" 
                class="opt-item"
                :class="{ 'is-correct': opt === item.question.correct_answer }"
              >
                <el-icon v-if="opt === item.question.correct_answer" color="#67c23a"><Check /></el-icon>
                <el-icon v-else color="#dcdfe6"><Close /></el-icon>
                <span class="opt-text">{{ opt }}</span>
              </div>
            </div>
            
            <div class="explanation-box">
              <strong>解析：</strong>
              <span v-html="formatMarkdown(item.question.explanation)"></span>
            </div>
          </el-card>
        </div>
      </el-main>
    </el-container>

    <el-dialog v-model="showMoveDialog" title="移至合集" width="400px">
      <el-form label-width="80px" @submit.prevent>
        <el-form-item label="选择合集">
          <el-select v-model="targetCollectionId" placeholder="请选择目标合集" style="width: 100%;">
            <el-option label="全部错题 (不分类)" :value="null" />
            <el-option v-for="col in collections" :key="col.id" :label="col.name" :value="col.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showMoveDialog = false">取消</el-button>
          <el-button type="primary" @click="submitMove" :loading="moving">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="showCreateDialog" title="新建错题合集" width="400px">
      <el-form :model="newCollection" label-width="80px" @submit.prevent>
        <el-form-item label="合集名称">
          <el-input v-model="newCollection.name" placeholder="例如：微积分易错题" @keyup.enter="submitCreateCollection" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newCollection.description" type="textarea" placeholder="可选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="submitCreateCollection" :loading="creating">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Collection, Folder, Delete, Check, Close, FolderOpened } from '@element-plus/icons-vue'
import { getCollections, createCollection, getFavorites, removeFavorite, addFavorite } from '../api/notebook'
import MarkdownIt from 'markdown-it'
import mkatex from 'markdown-it-katex'
import 'katex/dist/katex.min.css'

const md = new MarkdownIt().use(mkatex)
const formatMarkdown = (text: string) => text ? md.render(text) : ''

const collections = ref<any[]>([])
const favorites = ref<any[]>([])
const activeCollection = ref<number | null>(null)
const activeCollectionStr = computed(() => activeCollection.value === null ? 'all' : String(activeCollection.value))

const loading = ref(false)
const showCreateDialog = ref(false)
const creating = ref(false)
const newCollection = ref({ name: '', description: '' })

const showMoveDialog = ref(false)
const moving = ref(false)
const targetCollectionId = ref<number | null>(null)
const currentMoveQuestionId = ref<number | null>(null)

const openMoveDialog = (item: any) => {
  currentMoveQuestionId.value = item.question.id
  // 回显当前所在的合集
  targetCollectionId.value = item.collection_id 
  showMoveDialog.value = true
}

const submitMove = async () => {
  if (!currentMoveQuestionId.value) return
  moving.value = true
  try {
    // 调用后端的收藏接口，利用它的“存在即更新”逻辑
    await addFavorite({
      question_id: currentMoveQuestionId.value,
      collection_id: targetCollectionId.value
    })
    ElMessage.success('移动成功！')
    showMoveDialog.value = false
    
    // 移动完成后，重新拉取当前分类下的错题（如果是移出当前分类，它就会自动消失）
    const favRes = await getFavorites(activeCollection.value)
    favorites.value = favRes as any
  } catch (error) {
    console.error('移动失败', error)
  } finally {
    moving.value = false
  }
}

// 记载合集和错题列表
const loadData = async () => {
  loading.value = true
  try {
    const [colRes, favRes] = await Promise.all([
      getCollections(),
      getFavorites(activeCollection.value)
    ])
    collections.value = colRes as any
    favorites.value = favRes as any
  } catch (error) {
    console.error('获取错题本数据失败', error)
  } finally {
    loading.value = false
  }
}

// 切换合集
const handleSelectCollection = async (index: string) => {
  activeCollection.value = index === 'all' ? null : Number(index)
  loading.value = true
  try {
    const favRes = await getFavorites(activeCollection.value)
    favorites.value = favRes as any
  } catch (error) {
    console.error('获取分类错题失败', error)
  } finally {
    loading.value = false
  }
}

// 创建新合集
const submitCreateCollection = async () => {
  if (!newCollection.value.name.trim()) return ElMessage.warning('合集名称不能为空')
  creating.value = true
  try {
    await createCollection(newCollection.value)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    newCollection.value = { name: '', description: '' }
    // 重新拉取合集列表
    const colRes = await getCollections()
    collections.value = colRes as any
  } catch (error) {
    console.error('创建合集失败', error)
  } finally {
    creating.value = false
  }
}

// 移除错题
const handleRemove = (questionId: number) => {
  ElMessageBox.confirm('确定要把这道题移出错题本吗？', '提示', { type: 'warning' })
    .then(async () => {
      await removeFavorite(questionId)
      ElMessage.success('已移除')
      // 从列表中剔除
      favorites.value = favorites.value.filter(f => f.question.id !== questionId)
    })
    .catch(() => {})
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.notebook-container {
  height: calc(100vh - 48px);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.05);
  overflow: hidden;
}

.collection-aside {
  border-right: 1px solid #e4e7ed;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
}

.aside-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
}

.aside-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.collection-menu {
  border-right: none;
  background-color: transparent;
}

.notebook-main {
  padding: 24px;
  overflow-y: auto;
  background-color: #f5f7fa;
}

.question-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.q-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.q-prompt {
  margin: 0;
  font-size: 15px;
  font-weight: bold;
  color: #303133;
  flex: 1;
}

.q-options {
  margin-bottom: 15px;
  padding-left: 10px;
}

.opt-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  color: #606266;
  line-height: 1.5;
}

.opt-item.is-correct {
  color: #67c23a;
  font-weight: 500;
}

.opt-text {
  flex: 1;
}

.explanation-box {
  background-color: #f0f9eb;
  padding: 12px 15px;
  border-radius: 6px;
  color: #606266;
  font-size: 14px;
  border-left: 4px solid #67c23a;
}
</style>