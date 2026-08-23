export function createTasksFromAi({ suggestions, goalId, parentTaskId = null, taskStore }) {
  const parent = parentTaskId == null ? null : taskStore.byId(parentTaskId)
  const inheritedGoalId = parent ? parent.goalId : goalId
  const inputs = suggestions.map(item => ({
    title: item.name,
    description: Array.isArray(item.steps) ? item.steps.join('\n') : '',
    priority: item.priority,
    deadline: item.deadline || null,
    goalId: inheritedGoalId == null ? null : String(inheritedGoalId),
    parentTaskId: parentTaskId == null ? null : String(parentTaskId),
    weight: 1
  }))

  return taskStore.createBatchTasks(inputs)
}
