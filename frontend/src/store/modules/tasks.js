import { defineStore } from 'pinia'

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: []
  }),

  actions: {
    async createBatchTasks(tasks) {
      try {
        const newTasks = tasks.map(task => ({
          id: Date.now() + Math.random(),
          text: task.title,
          description: task.description,
          priority: this.convertPriority(task.priority),
          category: task.goalId ? '目标任务' : '普通任务',
          completed: false,
          createdAt: new Date().toISOString(),
          dueDate: task.deadline,
          goalId: task.goalId,
          estimatedTime: task.estimatedTime,
          pomodoros: 0
        }))

        // 添加到任务列表
        this.tasks.push(...newTasks)
        
        return newTasks
      } catch (error) {
        console.error('创建任务失败:', error)
        throw error
      }
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
  },

  persist: {
    key: 'tasks-store',
    storage: localStorage
  }
}) 