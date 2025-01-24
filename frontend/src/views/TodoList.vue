<template>
  <div class="todo-list-container">
    <todo-items />
  </div>
</template>

<script setup>
import TodoItems from '../components/TodoItems.vue'
</script>

<style scoped>
.todo-list-container {
  height: 100%;
}
</style> 