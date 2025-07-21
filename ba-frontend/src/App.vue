<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/">Generator</RouterLink>
        <RouterLink to="/history">Riwayat</RouterLink>
      </nav>
    </div>
  </header>
  <RouterView v-slot="{ Component }">
    <KeepAlive>
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
  position: sticky;
}
nav {
  width: 100%;
  font-size: 1rem;
  text-align: center;
  padding: 1rem 0;
  background-color: #f4f4f4;
  border-bottom: 1px solid #ddd;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
nav a.router-link-exact-active {
  color: hsla(160, 100%, 37%, 1);
}
nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
  color: #333;
  font-weight: bold;
}
nav a:first-of-type {
  border: 0;
}
</style>