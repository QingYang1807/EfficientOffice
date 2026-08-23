import { beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGoalStore } from '@/stores/goals'
import { useTaskStore } from '@/stores/tasks'
import { deleteGoal, deleteTask } from '@/services/workspaceCommands'

beforeEach(() => {
  setActivePinia(createPinia())
})

it('creates nested goals and tasks while inheriting the parent task goal', () => {
  const goals = useGoalStore()
  const tasks = useTaskStore()
  const parent = goals.createGoal({ title: '年度目标' })
  const child = goals.createGoal({ title: '发布2.0', parentGoalId: parent.id })
  const task = tasks.createTask({ title: '发布', goalId: child.id })
  const subtask = tasks.createTask({ title: '验收', parentTaskId: task.id })

  expect(goals.pathFor(child.id).map(item => item.title)).toEqual(['年度目标', '发布2.0'])
  expect(subtask.goalId).toBe(child.id)
  expect(() => tasks.createTask({ title: '非法', parentTaskId: task.id, goalId: parent.id }))
    .toThrow('子任务必须与父任务属于同一目标')
})

it('rejects a goal cycle without changing the hierarchy', () => {
  const goals = useGoalStore()
  const root = goals.createGoal({ title: '根目标' })
  const child = goals.createGoal({ title: '子目标', parentGoalId: root.id })

  expect(() => goals.moveGoal(root.id, child.id)).toThrow('不能移动到自身后代节点')
  expect(goals.byId(root.id).parentGoalId).toBe(null)
})

it('moves a task subtree to another goal as one unit', () => {
  const goals = useGoalStore()
  const tasks = useTaskStore()
  const source = goals.createGoal({ title: '原目标' })
  const target = goals.createGoal({ title: '新目标' })
  const parent = tasks.createTask({ title: '父任务', goalId: source.id })
  const child = tasks.createTask({ title: '子任务', parentTaskId: parent.id })
  const grandchild = tasks.createTask({ title: '孙任务', parentTaskId: child.id })

  tasks.moveTask(parent.id, { goalId: target.id, parentTaskId: null })

  expect(tasks.tasks.filter(task => [parent.id, child.id, grandchild.id].includes(task.id)).map(task => task.goalId))
    .toEqual([target.id, target.id, target.id])
})

it('rejects a task cycle without changing the hierarchy', () => {
  const tasks = useTaskStore()
  const parent = tasks.createTask({ title: '父任务' })
  const child = tasks.createTask({ title: '子任务', parentTaskId: parent.id })

  expect(() => tasks.moveTask(parent.id, { parentTaskId: child.id, goalId: null }))
    .toThrow('不能移动到自身后代节点')
  expect(tasks.byId(parent.id).parentTaskId).toBe(null)
})

it('promotes children when deleting a task and cascades a goal subtree', () => {
  const goals = useGoalStore()
  const tasks = useTaskStore()
  const rootGoal = goals.createGoal({ title: '根目标' })
  const childGoal = goals.createGoal({ title: '子目标', parentGoalId: rootGoal.id })
  const rootTask = tasks.createTask({ title: '根任务', goalId: rootGoal.id })
  const middleTask = tasks.createTask({ title: '中间任务', parentTaskId: rootTask.id })
  const leafTask = tasks.createTask({ title: '叶子任务', parentTaskId: middleTask.id })
  tasks.createTask({ title: '子目标任务', goalId: childGoal.id })

  deleteTask({ taskId: middleTask.id, mode: 'promote', taskStore: tasks })
  expect(tasks.byId(leafTask.id).parentTaskId).toBe(rootTask.id)

  deleteGoal({ goalId: rootGoal.id, mode: 'cascade', goalStore: goals, taskStore: tasks })
  expect(goals.goals).toEqual([])
  expect(tasks.tasks).toEqual([])
})

it('promotes a deleted goal and preserves its task tree under the parent goal', () => {
  const goals = useGoalStore()
  const tasks = useTaskStore()
  const root = goals.createGoal({ title: '根' })
  const removed = goals.createGoal({ title: '待删', parentGoalId: root.id })
  const promoted = goals.createGoal({ title: '待提升', parentGoalId: removed.id })
  const task = tasks.createTask({ title: '任务根', goalId: removed.id })
  const subtask = tasks.createTask({ title: '子任务', parentTaskId: task.id })

  deleteGoal({ goalId: removed.id, mode: 'promote', goalStore: goals, taskStore: tasks })

  expect(goals.byId(promoted.id).parentGoalId).toBe(root.id)
  expect(tasks.byId(task.id).goalId).toBe(root.id)
  expect(tasks.byId(subtask.id).goalId).toBe(root.id)
  expect(tasks.byId(subtask.id).parentTaskId).toBe(task.id)
})

it('rolls memory back and exposes a stable error when persistence fails', () => {
  const goals = useGoalStore()
  goals.createGoal({ title: '已保存' })
  const before = goals.goals.map(goal => ({ ...goal }))
  const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota')
  })

  expect(() => goals.createGoal({ title: '不应保留' })).toThrow('工作区保存失败')
  expect(goals.goals).toEqual(before)
  expect(goals.lastError).toBe('工作区保存失败')
  setItem.mockRestore()
})

it('rolls memory back on quota and optimistic conflicts with recoverable errors', () => {
  const goals = useGoalStore()
  goals.createGoal({ title: '已保存' })
  const before = goals.goals.map(goal => ({ ...goal }))
  const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('quota', 'QuotaExceededError')
  })

  expect(() => goals.createGoal({ title: '超出容量' }))
    .toThrow('本地存储空间不足，请先导出或清理数据')
  expect(goals.goals).toEqual(before)
  expect(goals.lastError).toBe('本地存储空间不足，请先导出或清理数据')
  setItem.mockRestore()

  const external = JSON.parse(localStorage.getItem('efficient-office.workspace.v2'))
  localStorage.setItem('efficient-office.workspace.v2', JSON.stringify({ ...external, updatedAt: 'external-revision' }))
  expect(() => goals.createGoal({ title: '冲突目标' }))
    .toThrow('数据已在其他页面更新，请刷新后重试')
  expect(goals.goals).toEqual(before)
  expect(() => goals.createGoal({ title: '仍不应覆盖' }))
    .toThrow('数据已在其他页面更新，请刷新后重试')
  expect(JSON.parse(localStorage.getItem('efficient-office.workspace.v2')).updatedAt).toBe('external-revision')
})

it('keeps batch creation atomic when a later task is invalid', () => {
  const goals = useGoalStore()
  const tasks = useTaskStore()
  const goal = goals.createGoal({ title: '目标' })
  const parent = tasks.createTask({ title: '父任务', goalId: goal.id })
  const before = tasks.tasks.map(task => ({ ...task }))

  expect(() => tasks.createBatchTasks([
    { title: '本来可创建', goalId: goal.id },
    { title: '非法子任务', parentTaskId: parent.id, goalId: 'wrong-goal' }
  ])).toThrow('子任务必须与父任务属于同一目标')
  expect(tasks.tasks).toEqual(before)
})

it('rolls both stores back when an atomic goal deletion cannot persist', () => {
  const goals = useGoalStore()
  const tasks = useTaskStore()
  const goal = goals.createGoal({ title: '目标' })
  tasks.createTask({ title: '任务', goalId: goal.id })
  const beforeGoals = goals.goals.map(item => ({ ...item }))
  const beforeTasks = tasks.tasks.map(item => ({ ...item }))
  const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota')
  })

  expect(() => deleteGoal({ goalId: goal.id, mode: 'cascade', goalStore: goals, taskStore: tasks }))
    .toThrow('工作区保存失败')
  expect(goals.goals).toEqual(beforeGoals)
  expect(tasks.tasks).toEqual(beforeTasks)
  expect(goals.lastError).toBe('工作区保存失败')
  expect(tasks.lastError).toBe('工作区保存失败')
  setItem.mockRestore()
})

it('records and completes pomodoros in V2 with atomic rollback on persistence failure', () => {
  const tasks = useTaskStore()
  const task = tasks.createTask({ title: '专注任务' })

  tasks.startPomodoro(task.id, '2026-08-23T10:00:00.000Z')
  expect(JSON.parse(localStorage.getItem('efficient-office.workspace.v2')).tasks[0].pomodoroStartedAt)
    .toBe('2026-08-23T10:00:00.000Z')
  tasks.finishPomodoro(task.id, { completed: true, now: '2026-08-23T10:25:00.000Z' })
  expect(tasks.byId(task.id)).toEqual(expect.objectContaining({
    pomodoros: 1, completed: true, completedAt: '2026-08-23T10:25:00.000Z', pomodoroStartedAt: null
  }))
  expect(JSON.parse(localStorage.getItem('efficient-office.workspace.v2')).tasks[0].pomodoros).toBe(1)
  expect(localStorage.getItem('todos')).toBe(null)

  const before = { ...tasks.byId(task.id) }
  const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
  expect(() => tasks.startPomodoro(task.id, '2026-08-23T10:30:00.000Z')).toThrow('工作区保存失败')
  expect(tasks.byId(task.id)).toEqual(before)
  expect(() => tasks.finishPomodoro(task.id, { now: '2026-08-23T10:50:00.000Z' })).toThrow('工作区保存失败')
  expect(tasks.byId(task.id)).toEqual(before)
  setItem.mockRestore()
})

it('rejects every API path that writes a parent task completed fact', () => {
  const tasks = useTaskStore()
  const parent = tasks.createTask({ title: '父任务' })
  tasks.createTask({ title: '未完成子任务', parentTaskId: parent.id })
  const before = { ...tasks.byId(parent.id) }

  expect(() => tasks.toggleTask(parent.id, true)).toThrow('父任务完成状态由子任务进度派生')
  expect(() => tasks.updateTask(parent.id, { completed: true })).toThrow('父任务完成状态由子任务进度派生')
  expect(() => tasks.moveTask(parent.id, { parentTaskId: null, goalId: null, patch: { completed: true } }))
    .toThrow('父任务完成状态由子任务进度派生')
  expect(() => tasks.finishPomodoro(parent.id, { completed: true })).toThrow('父任务完成状态由子任务进度派生')
  expect(tasks.byId(parent.id)).toEqual(before)

  tasks.finishPomodoro(parent.id)
  expect(tasks.byId(parent.id).pomodoros).toBe(1)
})
