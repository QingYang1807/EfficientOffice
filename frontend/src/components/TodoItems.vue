<template>
    <div>
        <h1>待办事项</h1>
        <ul>
            <li v-for="todoItem in todoItems" :key="todoItem.id">
                {{ todoItem.title }}
            </li>
        </ul>
        <h2>添加待办事项</h2>
        <form @submit.prevent="addTodoItem">
            <label for="title">标题：</label>
            <input id="title" v-model="newTodoItem.title" type="text" />
            <label for="description">描述：</label>
            <input id="description" v-model="newTodoItem.description" type="text" />
            <!-- 其他表单字段... -->
            <button type="submit">添加</button>
        </form>

    </div>
</template>
<script>
import todoItemsApi from '@/api/todoItems';

export default {
    data() {
        return {
            todoItems: [],
            newTodoItem: {
                title: '',
                description: '',
                // 其他属性...
            },
        };
    },
    async created() {
        this.todoItems = await todoItemsApi.getAllTodoItems();
    },
    methods: {
        async addTodoItem() {
            const createdTodoItem = await todoItemsApi.createTodoItem(this.newTodoItem);
            this.todoItems.push(createdTodoItem);
            this.newTodoItem = {
                title: '',
                description: '',
                // 其他属性...
            };
        },
    },
};
</script>
<style scoped>
h1 {
    font-size: 2em;
    margin-bottom: 0.5em;
    color: #2c3e50;
}

ul {
    list-style-type: none;
    padding: 0;
}

li {
    background-color: #f5f5f5;
    padding: 1em;
    border-radius: 5px;
    margin-bottom: 1em;
}

form {
    display: flex;
    flex-direction: column;
    gap: 1em;
    background-color: #fafafa;
    padding: 1em;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

label {
    font-weight: bold;
    font-size: 1.1em;
    color: #2c3e50;
}

input {
    padding: 0.5em;
    font-size: 1em;
    border: 1px solid #ccc;
    border-radius: 5px;
    outline: none;
}

input:focus {
    border-color: #2c3e50;
}

button {
    background-color: #2c3e50;
    color: white;
    font-size: 1em;
    font-weight: bold;
    padding: 0.5em 1em;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
}

button:hover {
    background-color: #34495e;
}
</style>
