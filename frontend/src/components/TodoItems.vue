<template>
    <div class="todo-container">
        <h1 class="text-center">待办事项</h1>
        <div class="content">
            <div class="tags">
                <ul>
                    <li v-for="(tag, index) in tags" :key="index" :style="{ backgroundColor: tag.color }">
                        {{ tag.text }}
                    </li>
                </ul>
            </div>
            <div class="todos">
                <ul>
                    <li v-for="todoItem in todoItems" :key="todoItem.id"
                        @contextmenu.prevent="openContextMenu($event, todoItem)">
                        <input type="checkbox" v-model="todoItem.starred" @change="updateTodoItem(todoItem)" />
                        {{ todoItem.title }}
                        <div class="right-click-menu" v-if="todoItem.showRightClickMenu">
                            <button @click="editTodoItem(todoItem)">编辑</button>
                            <button @click="deleteTodoItem(todoItem)">删除</button>
                            <input type="datetime-local" v-model="todoItem.alarm" @change="updateTodoItem(todoItem)" />
                        </div>
                    </li>
                </ul>
            </div>
        </div>
        <p class="instructions">使用说明...</p>
        <div class="right-click-menu" v-if="selectedTodoItem" :style="contextMenuStyles">
            <button @click="editTodoItem(selectedTodoItem)">编辑</button>
            <button @click="deleteTodoItem(selectedTodoItem)">删除</button>
            <input type="datetime-local" v-model="selectedTodoItem.alarm" @change="updateTodoItem(selectedTodoItem)" />
        </div>
    </div>
</template>
  
<script>
export default {
    data() {
        return {
            todoItems: JSON.parse(localStorage.getItem("todoItems")) || [],
            tags: [
                { text: "工作", color: "#3498db" },
                { text: "家庭", color: "#2ecc71" },
                { text: "学习", color: "#9b59b6" },
                // 更多标签...
            ],
            contextMenuStyles: {},
            selectedTodoItem: null,
        };
    },
    methods: {
        updateTodoItem(todoItem) {
            const index = this.todoItems.findIndex((item) => item.id === todoItem.id);
            this.todoItems.splice(index, 1, todoItem);
            localStorage.setItem("todoItems", JSON.stringify(this.todoItems));
        },
        editTodoItem(todoItem) {
            console.log(todoItem);
            // 编辑待办事项的实现...
        },
        deleteTodoItem(todoItem) {
            this.todoItems = this.todoItems.filter((item) => item.id !== todoItem.id);
            localStorage.setItem("todoItems", JSON.stringify(this.todoItems));
        },
        openContextMenu(event, todoItem) {
            event.preventDefault();
            this.contextMenuStyles = {
                left: `${event.clientX}px`,
                top: `${event.clientY}px`,
            };
            this.selectedTodoItem = todoItem;
        },
    },
};
</script>
  
<style scoped>
.todo-container {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    height: 100%;
}

h1 {
    font-size: 2em;
    margin-bottom: 0.5em;
    color: #2c3e50;
}

.content {
    display: flex;
    flex: 1;
}

.tags {
    flex: 1;
}

.todos {
    flex: 3;
}

.tags ul,
.todos ul {
    list-style-type: none;
    padding: 0;
}

.tags li {
    padding: 0.5em;
    margin-bottom: 0.5em;
    border-radius: 5px;
    color: white;
    font-weight: bold;
}

.todos li {
    position: relative;
    background-color: #f5f5f5;
    padding: 1em;
    border-radius: 5px;
    margin-bottom: 1em;
}

input[type="checkbox"] {
    margin-right: 0.5em;
}

.right-click-menu {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    background-color: #f5f5f5;
    padding: 0.5em;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 10;
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

.instructions {
    font-size: 1.2em;
    color: #2c3e50;
    margin-top: 1em;
    text-align: center;
}

.right-click-menu {
    position: absolute;
    background-color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    z-index: 1;
    padding: 5px;
}

.right-click-menu button {
    display: block;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    width: 100%;
    padding: 5px;
}

.right-click-menu button:hover {
    background-color: #000;
}
</style>
  