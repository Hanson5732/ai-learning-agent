<template>
  <el-container class="home-container">
    <el-aside width="220px" class="aside-menu">
      <div class="logo">
        <h2>Polymath AI</h2>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        router
      >
        <el-menu-item index="/learn">
          <el-icon><Edit /></el-icon>
          <span>知识学习</span>
        </el-menu-item>
        <el-menu-item index="/history">
          <el-icon><Clock /></el-icon>
          <span>历史记录</span>
        </el-menu-item>
        <el-menu-item index="/notebook">
          <el-icon><Notebook /></el-icon>
          <span>错题本</span>
        </el-menu-item>
        <el-menu-item index="/ppt">
          <el-icon><Document /></el-icon>
          <span>PPT 上传解析</span>
        </el-menu-item>
      </el-menu>
      
      <div class="user-info">
        <el-avatar :size="36" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
        <div class="user-detail">
          <span class="username">{{ userStore.userInfo?.username || '测试用户' }}</span>
        </div>
        <el-button type="danger" link @click="handleLogout">退出</el-button>
      </div>
    </el-aside>

    <el-container>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
// 引入 Element Plus 的图标
import { Edit, Clock, Notebook, Document } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const activeMenu = ref('/learn')

// 退出登录逻辑
const handleLogout = () => {
  userStore.clearAuth()
  router.push('/login')
}

onMounted(() => {
  if (userStore.token && !userStore.userInfo) {
    userStore.fetchUserInfo()
  }
})
</script>

<style scoped>
.home-container {
  height: 100vh;
  background-color: #f5f7fa;
}

.aside-menu {
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e4e7ed;
  box-shadow: 2px 0 8px 0 rgba(29,35,41,.05);
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409EFF;
  border-bottom: 1px solid #e4e7ed;
}

.el-menu-vertical {
  flex: 1;
  border-right: none;
}

.user-info {
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid #e4e7ed;
  background-color: #fafafa;
}

.user-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.username {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-content {
  padding: 24px;
  /* 可以在这里给主内容区加个小卡片样式 */
}

.welcome-box {
  background: #fff;
  padding: 40px;
  border-radius: 8px;
  text-align: center;
  color: #606266;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.05);
}
</style>