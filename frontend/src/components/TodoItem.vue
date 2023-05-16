<template>
  <div class="todo-item" @mouseover="hover=true" @mouseout="hover=false">
    <el-checkbox v-model="todoItem.completed" class="todo-checkbox"></el-checkbox>
    <el-input v-if="hover" v-model="todoItem.text" @blur="updateTodo" class=""></el-input>
    <p v-else>{{ todoItem.text }}</p>
    <el-button @click="deleteTodo" class="todo-button">删除</el-button>
  </div>
</template>

<script>
import { ElCheckbox, ElButton, ElInput } from 'element-plus';

export default {
  props: ['todo-item'],
  components: {
    ElCheckbox,
    ElButton,
    ElInput
  },
  data() {
    return {
      hover: false,
    }
  },
  methods: {
    deleteTodo() {
      this.$emit('delete', this.todoItem.id);
    },
    updateTodo() {
      this.$emit('update', this.todoItem);
    }
  }
}
</script>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.todo-checkbox {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
/* 
.todo-input {
  flex-grow: 1;
  margin-left: 1rem;
} */

.todo-input {
    margin-right: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #ced4da;
}

.todo-button {
  position: absolute;
  right: 1rem;
  background-color: #dc3545;
  color: white;
  display: none;
}

.todo-item:hover .todo-button {
  display: block;
}
</style>
