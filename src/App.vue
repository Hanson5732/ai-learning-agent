<template>
  <router-view />
</template>

<script setup lang="ts">
</script>


<style>
/* 顺手做个基础的全局样式重置，保证撑满全屏 */
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
  'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}
</style>