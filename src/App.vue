<template>
  <nav>
    <router-link to="/">首页</router-link>
    <router-link to="/resize-image">图片压缩</router-link>
  </nav>
  <router-view />
</template>

<style scoped>
nav {
  display: flex;
  gap: 10px;
}

nav a {
  text-decoration: none;
  color: #333;
  padding: 10px;
  border-radius: 5px;
  background-color: #f0f0f0;
}

nav a:hover {
  background-color: #e0e0e0;
}
</style>