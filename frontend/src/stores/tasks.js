import { defineStore } from 'pinia'

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: []
  }),

  getters: {
    getAllTasks: (state) => state.tasks
  },

  actions: {
    // 初始化任务列表
    initTasks() {
      const storedTasks = localStorage.getItem('tasks')
      if (storedTasks) {
        this.tasks = JSON.parse(storedTasks)
      }
    },

    // 获取所有任务
    getTasks() {
      return this.tasks
    },

    // 创建单个任务
    createTask(task) {
      const newTask = {
        ...task,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      }
      this.tasks.push(newTask)
      this.saveTasks()
      return newTask
    },

    // 批量创建任务
    createBatchTasks(newTasks) {
      const tasksWithIds = newTasks.map(task => ({
        ...task,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      }))
      this.tasks.push(...tasksWithIds)
      this.saveTasks()
      return tasksWithIds
    },

    // 更新任务
    updateTask(updatedTask) {
      const index = this.tasks.findIndex(t => t.id === updatedTask.id)
      if (index !== -1) {
        this.tasks[index] = updatedTask
        this.saveTasks()
      }
      return updatedTask
    },

    // 删除任务
    deleteTask(taskId) {
      this.tasks = this.tasks.filter(t => t.id !== taskId)
      this.saveTasks()
    },

    // 切换任务完成状态
    toggleTaskComplete(taskId) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        task.completed = !task.completed
        this.saveTasks()
      }
    },

    // 保存到 localStorage
    saveTasks() {
      localStorage.setItem('tasks', JSON.stringify(this.tasks))
    },

    // 转换优先级格式
    convertPriority(priority) {
      const priorityMap = {
        '高': '高',
        '中': '中',
        '低': '低'
      }
      return priorityMap[priority] || '中'
    }
  }
}) 