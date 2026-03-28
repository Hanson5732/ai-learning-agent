<template>
  <div class="landing-container">
    <nav class="landing-nav animate-on-scroll">
      <div class="logo">Polymath AI</div>
    </nav>

    <section class="hero-section animate-on-scroll">
      <h1 class="hero-title">重塑你的学习方式</h1>
      <p class="hero-subtitle">
        Polymath AI —— 你的全能智能学习伴侣。上传课件、生成专属教程、自动批改测验，一切为了更高效的掌握。
      </p>
      
      <div class="cta-group">
        <el-button type="primary" size="large" class="cta-btn primary-btn" @click="goTo('/login')">
          立即登录
        </el-button>
        <el-button size="large" class="cta-btn" @click="goTo('/register')">
          免费注册
        </el-button>
      </div>
    </section>

    <section class="features-section">
      <h2 class="section-title animate-on-scroll">核心功能，为你赋能</h2>
      
      <div class="features-grid">
        <div class="feature-card animate-on-scroll">
          <div class="feature-icon">🧠</div>
          <h3>智能知识点生成</h3>
          <p>输入任何你想学习的概念，AI 老师即刻为你生成通俗易懂的专属图文教程，支持 Markdown 与复杂数学公式。</p>
        </div>
        
        <div class="feature-card animate-on-scroll" style="transition-delay: 0.1s;">
          <div class="feature-icon">📝</div>
          <h3>随堂测验与错题本</h3>
          <p>学完即练，AI 自动为你出题并批改。答错的题目一键加入专属错题本，精准攻克你的知识盲区。</p>
        </div>

        <div class="feature-card animate-on-scroll" style="transition-delay: 0.2s;">
          <div class="feature-icon">📄</div>
          <h3>PPT / PDF 一键解析</h3>
          <p>告别繁杂的课件，直接拖拽上传 PPT 或 PDF，系统自动为你提炼核心大纲，一键转为交互式学习教程。</p>
        </div>

        <div class="feature-card animate-on-scroll" style="transition-delay: 0.3s;">
          <div class="feature-icon">📈</div>
          <h3>学习足迹追踪</h3>
          <p>记录你与 AI 探索过的每一个知识点。可视化的时间轴让你随时回顾复习，温故而知新。</p>
        </div>
      </div>
    </section>

    <section class="bottom-cta animate-on-scroll">
      <h2>准备好体验更聪明的学习方式了吗？</h2>
      <el-button type="primary" size="large" class="cta-btn primary-btn" @click="goTo('/login')">
        开启学习之旅
      </el-button>
    </section>

    <footer class="landing-footer animate-on-scroll">
      <p>© 2026 Polymath AI. Crafted with ❤️ for better learning.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 跳转函数
const goTo = (path: string) => {
  // 如果你的登录和注册是同一个页面（靠参数区分），可以自行修改这里
  router.push(path)
}

// === 核心逻辑：滚动渐进显示动画 ===
let observer: IntersectionObserver | null = null

onMounted(() => {
  // 使用 IntersectionObserver 监听元素是否进入视口
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // 当元素进入视口时，添加 visible 类名触发 CSS 动画
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        // 如果想让动画只触发一次，可以在触发后取消观察
        // observer?.unobserve(entry.target)
      }
    })
  }, {
    threshold: 0.15 // 元素露出 15% 时触发
  })

  // 获取所有带有 animate-on-scroll 类的元素并开始观察
  const elements = document.querySelectorAll('.animate-on-scroll')
  elements.forEach((el) => observer!.observe(el))
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
/* 全局容器样式 */
.landing-container {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  color: #333;
  background-color: #fafafa;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

/* === 核心动画 CSS === */
.animate-on-scroll {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.animate-on-scroll.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* 导航栏 */
.landing-nav {
  padding: 20px 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo {
  font-size: 22px;
  font-weight: bold;
  color: #409EFF;
  letter-spacing: -0.5px;
}

/* 首屏 Hero 区 */
.hero-section {
  text-align: center;
  padding: 100px 20px 80px;
  max-width: 800px;
  margin: 0 auto;
}
.hero-title {
  font-size: 56px;
  font-weight: 800;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #409EFF, #36cfc9);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero-subtitle {
  font-size: 20px;
  line-height: 1.6;
  color: #606266;
  margin-bottom: 50px;
}
.cta-group {
  display: flex;
  justify-content: center;
  gap: 20px;
}
.cta-btn {
  padding: 12px 35px;
  font-size: 16px;
  border-radius: 30px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.cta-btn:hover {
  transform: translateY(-2px);
}
.primary-btn {
  box-shadow: 0 4px 14px 0 rgba(64, 158, 255, 0.39);
}

/* 功能区 */
.features-section {
  padding: 80px 20px;
  background-color: #fff;
}
.section-title {
  text-align: center;
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 60px;
  color: #303133;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 40px;
  max-width: 1100px;
  margin: 0 auto;
}
.feature-card {
  padding: 40px 30px;
  background: #fafafa;
  border-radius: 16px;
  text-align: center;
  transition: box-shadow 0.3s, transform 0.3s;
}
.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  background: #fff;
}
.feature-icon {
  font-size: 48px;
  margin-bottom: 20px;
}
.feature-card h3 {
  font-size: 22px;
  margin-bottom: 15px;
  color: #303133;
}
.feature-card p {
  color: #606266;
  line-height: 1.6;
}

/* 底部 CTA 与页脚 */
.bottom-cta {
  text-align: center;
  padding: 100px 20px;
  background: linear-gradient(to bottom, #fff, #f0f7ff);
}
.bottom-cta h2 {
  font-size: 32px;
  margin-bottom: 30px;
}
.landing-footer {
  text-align: center;
  padding: 30px;
  color: #909399;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .hero-title { font-size: 40px; }
  .hero-subtitle { font-size: 16px; }
  .cta-group { flex-direction: column; padding: 0 20px; }
}
</style>