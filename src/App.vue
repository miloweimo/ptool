<template>
  <nav>
    <router-link v-for="route in routes" :key="route.path" :to="route.path">{{ route.meta.title }}</router-link>
  </nav>
  <router-view />
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
const routes = useRouter().getRoutes();
</script>

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