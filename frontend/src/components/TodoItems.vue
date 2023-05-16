<template>
    <div class="todo-list">
        <h1 class="title">待办清单</h1>
        <div class="todo-container">
            <todo-item v-for="todo in todos" :key="todo.id" :todoItem="todo" @delete="deleteTodo" @update="updateTodo"
                class="todo-item">
            </todo-item>
        </div>
        <div class="add-todo">
            <el-input v-model="newTodo" placeholder="有什么需要完成的事项?" @keyup.enter="addTodo" class="add-input"></el-input>
            <el-button @click="addTodo" class="add-button">添加</el-button>
        </div>
    </div>
</template>

<script>
import { ElInput, ElButton } from 'element-plus';
import TodoItem from './TodoItem.vue'

export default {
    components: { TodoItem, ElInput, ElButton },
    data() {
        return {
            newTodo: '',
            todos: [
                { id: 1, text: 'Learn Vue.js', completed: false },
                { id: 2, text: 'Learn ElementUI', completed: false },
            ],
        }
    },
    methods: {
        addTodo() {
            if (this.newTodo) {
                this.todos.push({ id: Date.now(), text: this.newTodo, completed: false });
                this.newTodo = '';
            }
        },
        deleteTodo(id) {
            this.todos = this.todos.filter(todo => todo.id !== id);
        },
        updateTodo(updatedTodo) {
            const index = this.todos.findIndex(todo => todo.id === updatedTodo.id);
            if (index !== -1) {
                this.todos.splice(index, 1, updatedTodo);
            }
        }
    }
}
</script>

<style scoped>
.title {
    text-align: center;
    margin-bottom: 2rem;
    color: #343a40;
    font-weight: bold;
}

.add-todo {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;

    position: absolute;
    bottom: 0;
    width: 100%;
    padding: 0 10rem;
}

.add-input {
    margin-right: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #ced4da;
}

.add-button {
    background-color: #007bff;
    color: white;
    border-radius: 0.5rem;
}

.todo-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.todo-item {
    margin-bottom: 1rem;
    width: 80%;
}
</style>