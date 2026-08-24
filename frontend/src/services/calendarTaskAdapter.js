import dayjs from 'dayjs'
import { getDescendantIds } from '@/domain/hierarchy'

function dateKey(value) {
  return value == null ? null : dayjs(value).format('YYYY-MM-DD')
}

function taskInput(form) {
  const title = String(form.title ?? '').trim()
  if (!title) throw new Error('任务标题不能为空')
  return {
    title,
    description: String(form.description || ''),
    priority: ['高', '中', '低'].includes(form.priority) ? form.priority : '中',
    deadline: form.deadline ?? null
  }
}

export function calendarFormFromTask(task) {
  return {
    id: String(task.id),
    title: task.title,
    description: task.description || '',
    priority: task.priority || '中',
    deadline: task.deadline == null ? null : dateKey(task.deadline)
  }
}

export function calendarTaskIsDueOnDate(task, date) {
  return task.deadline != null && dateKey(task.deadline) === dateKey(date)
}

export function getCalendarTasksByDate(taskStore, date) {
  const selected = dateKey(date)
  return taskStore.tasks
    .filter(task => dateKey(task.deadline) === selected)
    .map(task => ({
      ...task,
      id: String(task.id),
      text: task.title,
      dueDate: task.deadline,
      completed: taskStore.viewFor(task.id).completed
    }))
}

export function createCalendarTask(form, taskStore) {
  return taskStore.createTask({
    ...taskInput(form),
    goalId: null,
    parentTaskId: null,
    weight: 1
  })
}

export function updateCalendarTask(id, form, taskStore) {
  return taskStore.updateTask(String(id), taskInput(form))
}

export function toggleCalendarTask(id, completed, taskStore) {
  return taskStore.toggleTask(String(id), completed)
}

export function getCalendarDeletionImpact(date, taskStore) {
  const selected = getCalendarTasksByDate(taskStore, date)
  const selectedIds = new Set(selected.map(task => String(task.id)))
  const cascadeIds = new Set()
  for (const task of selected) {
    getDescendantIds(taskStore.tasks, task.id, 'parentTaskId').forEach(id => cascadeIds.add(id))
  }
  const summary = task => ({
    id: String(task.id),
    title: task.title || task.text || '未命名任务',
    deadline: task.deadline == null ? null : dateKey(task.deadline)
  })
  return {
    selected: selected.map(summary),
    cascadeOnly: taskStore.tasks
      .filter(task => cascadeIds.has(String(task.id)) && !selectedIds.has(String(task.id)))
      .map(summary)
  }
}

export function deleteCalendarTasks(date, taskStore, mode = 'promote') {
  const ids = getCalendarTasksByDate(taskStore, date).map(task => task.id)
  if (ids.length) taskStore.deleteBatchTasks(ids, { mode })
  return ids
}
