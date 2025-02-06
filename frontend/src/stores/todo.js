import { defineStore } from 'pinia'
import dayjs from 'dayjs'

export const useTodoStore = defineStore('todo', {
  state: () => ({
    todos: JSON.parse(localStorage.getItem('todos') || '[]')
  }),

  actions: {
    addTodo(todo) {
      this.todos.push({
        id: Date.now(),
        text: todo.title,
        completed: false,
        category: todo.category || '其他目标',
        priority: todo.priority || '中',
        date: todo.date,
        dueDate: todo.dueDate || null,
        description: todo.description || '',
        pomodoros: 0,
        createdAt: Date.now()
      })
      this.saveTodos()
    },

    updateTodo(todo) {
      const index = this.todos.findIndex(t => t.id === todo.id)
      if (index !== -1) {
        this.todos[index] = { ...this.todos[index], ...todo }
        this.saveTodos()
      }
    },

    toggleTodo(id, completed) {
      const todo = this.todos.find(t => t.id === id)
      if (todo) {
        todo.completed = completed
        this.saveTodos()
      }
    },

    deleteTodo(id) {
      const index = this.todos.findIndex(todo => todo.id === id)
      if (index !== -1) {
        this.todos.splice(index, 1)
        this.saveTodos()
      }
    },

    deleteTodosByDate(date) {
      const dateStr = dayjs(date).format('YYYY-MM-DD')
      this.todos = this.todos.filter(todo => todo.date !== dateStr)
      this.saveTodos()
    },

    saveTodos() {
      localStorage.setItem('todos', JSON.stringify(this.todos))
    }
  },

  getters: {
    getTodosByDate: (state) => (date) => {
      const dateStr = dayjs(date).format('YYYY-MM-DD')
      return state.todos.filter(todo => {
        const todoDate = todo.date === dateStr
        const todoDueDate = todo.dueDate && dayjs(todo.dueDate).format('YYYY-MM-DD') === dateStr
        return todoDate || todoDueDate
      })
    },

    activeTodos: (state) => {
      return state.todos.filter(todo => !todo.completed)
    },

    completedTodos: (state) => {
      return state.todos.filter(todo => todo.completed)
    },

    getTodosByCategory: (state) => (category) => {
      return state.todos.filter(todo => todo.category === category)
    }
  }
}) 