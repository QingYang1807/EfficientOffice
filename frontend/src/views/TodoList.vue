<template>
  <div class="todo-list-container">
    <todo-items />
  </div>
</template>

<script setup>
import TodoItems from '@/components/TodoItems.vue'
</script>

<style scoped>
.todo-list-container {
  height: 100%;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
</style> 