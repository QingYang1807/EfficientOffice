export function buildGoalSummaries({ goalStore, taskStore, now = Date.now() }) {
  return goalStore.goals.map(goal => ({
    ...goal,
    ...goalStore.viewFor(goal.id, taskStore.tasks, now)
  }))
}
