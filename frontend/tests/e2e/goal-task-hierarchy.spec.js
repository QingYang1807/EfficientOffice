import { expect, test } from '@playwright/test'

const WORKSPACE_KEY = 'efficient-office.workspace.v2'
const BACKUP_KEY = 'efficient-office.workspace.v1.backup'

test.beforeEach(async ({ page }) => {
  await page.goto('/goals', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => localStorage.clear())
})

test('creates three goal and task levels with two-way navigation', async ({ page }) => {
  await page.reload({ waitUntil: 'domcontentloaded' })
  await createGoal(page, '年度目标')
  await createChildGoal(page, '产品目标')
  await createChildGoal(page, '发布2.0')
  await expect(page.locator('.detail-panel').getByLabel('目标路径')).toContainText('年度目标/产品目标/发布2.0')

  await createGoalTask(page, '发布')
  await createChildGoalTask(page, '发布', '验收')
  await createChildGoalTask(page, '验收', '回归测试')
  await page.locator('.detail-panel').getByTestId('view-goal-tasks').click()

  await expect(page).toHaveURL(/\/todos\?goalId=/)
  const path = page.locator('[data-testid^="goal-path-"]').first()
  await expect(path).toContainText(/年度目标\s*\/\s*产品目标\s*\/\s*发布2\.0/)
  await path.getByRole('button', { name: '发布2.0' }).click()
  await expect(page).toHaveURL(/\/goals\//)
})

test('rolls completion to every parent', async ({ page }) => {
  await seedThreeLevelWorkspace(page)
  const leafRow = page.locator('.tasks-panel').getByTestId('goal-task-t3')
  await expect(leafRow.getByRole('checkbox', { name: '完成回归测试' })).toBeAttached()
  await leafRow.locator('label').click()
  for (const taskId of ['t1', 't2', 't3']) {
    await expect(page.locator('.tasks-panel').getByTestId(`task-progress-${taskId}`)).toHaveText('100%')
  }
  for (const goalId of ['g1', 'g2', 'g3']) {
    await page.goto(`/goals/${goalId}`, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.detail-panel').getByTestId(`goal-progress-${goalId}`)).toHaveText('100%')
  }
})

test('migrates valid and orphan legacy tasks', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('goals', JSON.stringify([{ id: 'g1', title: '旧目标' }]))
    localStorage.setItem('todos', JSON.stringify([
      { id: 't1', text: '有效', goalId: 'g1' },
      { id: 't2', text: '孤儿', goalId: 'missing' }
    ]))
  })
  await page.goto('/todos', { waitUntil: 'domcontentloaded' })

  await expect(page.getByTestId('task-row-t1')).toContainText('旧目标')
  await expect(page.getByTestId('task-row-t2')).toContainText('未归属目标')
  const persisted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), WORKSPACE_KEY)
  expect(persisted.goals).toHaveLength(1)
  expect(persisted.tasks).toHaveLength(2)
  expect(persisted.tasks.find(task => task.id === 't1').goalId).toBe('g1')
  expect(persisted.tasks.find(task => task.id === 't2').goalId).toBeNull()
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('efficient-office.workspace.v2.diagnostics')))).toEqual({ orphanTaskIds: ['t2'] })
})

test('restores a validated backup without manual JSON editing and preserves invalid legacy bytes', async ({ page }) => {
  await page.evaluate(({ workspaceKey, backupKey }) => {
    localStorage.setItem(workspaceKey, '{bad json')
    localStorage.setItem('goals', JSON.stringify([{ id: 'g1', title: '旧目标' }]))
    localStorage.setItem(backupKey, JSON.stringify({
      goals: [{ id: 'restored-goal', title: '备份目标' }],
      todos: [{ id: 'restored-task', text: '备份任务', goalId: 'restored-goal' }]
    }))
  }, { workspaceKey: WORKSPACE_KEY, backupKey: BACKUP_KEY })
  await page.goto('/todos', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('alert').filter({ hasText: '工作区保存失败' })).toBeVisible()
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), WORKSPACE_KEY)).toBe('{bad json')

  await page.goto('/goals', { waitUntil: 'domcontentloaded' })
  await page.getByTestId('restore-workspace-backup').click()
  await page.getByRole('dialog', { name: '恢复工作区' }).getByRole('button', { name: '确认恢复' }).click()
  await expect(page.getByRole('heading', { name: '备份目标' })).toBeVisible()
  const restored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), WORKSPACE_KEY)
  expect(restored.goals.map(goal => goal.id)).toEqual(['restored-goal'])
  expect(restored.tasks.map(task => [task.id, task.goalId])).toEqual([['restored-task', 'restored-goal']])

  await page.evaluate(key => {
    localStorage.removeItem(key)
    localStorage.setItem('goals', JSON.stringify([
      { id: 'duplicate', title: '目标甲' },
      { id: 'duplicate', title: '目标乙' }
    ]))
    localStorage.setItem('todos', '[]')
  }, WORKSPACE_KEY)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('alert').filter({ hasText: '工作区保存失败' })).toBeVisible()
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), WORKSPACE_KEY)).toBeNull()
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('goals')))).toHaveLength(2)
})

test('preserves expansion, filtering, association path and completion after refresh', async ({ page }) => {
  await seedThreeLevelWorkspace(page)
  const search = page.getByTestId('goal-search')
  await search.fill('发布2.0')
  const leaf = page.locator('.tasks-panel').getByTestId('goal-task-t3')
  await leaf.locator('label').click()
  await expect(leaf.getByRole('checkbox', { name: '完成回归测试' })).toBeChecked()
  const before = page.url()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(before)
  await expect(page.getByTestId('goal-search')).toHaveValue('发布2.0')
  await expect(page.getByTestId('goal-node-g1')).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByTestId('goal-node-g2')).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByTestId('goal-node-g3')).toBeVisible()
  await expect(page.locator('.detail-panel').getByLabel('目标路径')).toContainText('年度目标/产品目标/发布2.0')
  await expect(page.locator('.tasks-panel').getByTestId('goal-task-t3').getByRole('checkbox', { name: '完成回归测试' })).toBeChecked()
})

test('supports promote and cascade deletion', async ({ page }) => {
  await seedThreeLevelWorkspace(page)
  await page.locator('.tree-panel').getByTestId('goal-node-g2').hover()
  await page.locator('.tree-panel').getByLabel('删除产品目标').click()
  const promoteDialog = page.getByRole('dialog', { name: '删除目标' })
  await expect(promoteDialog).toContainText('将影响 1 个子目标、3 个任务')
  await promoteDialog.getByRole('button', { name: '提升并删除' }).click()

  await page.locator('.tree-panel').getByTestId('goal-node-g3').press('Enter')
  await expect(page.locator('.detail-panel').getByLabel('目标路径')).toContainText('年度目标/发布2.0')
  await page.locator('.tree-panel').getByTestId('goal-node-g3').hover()
  await page.locator('.tree-panel').getByLabel('删除发布2.0').click()
  await page.getByRole('dialog', { name: '删除目标' }).getByRole('button', { name: '级联删除' }).click()

  await expect.poll(() => page.evaluate(key => {
    const data = JSON.parse(localStorage.getItem(key))
    return { goalIds: data.goals.map(goal => goal.id), taskIds: data.tasks.map(task => task.id) }
  }, WORKSPACE_KEY)).toEqual({ goalIds: ['g1'], taskIds: [] })
})

test('keeps search-expand-toggle below 200ms with 100 goals and 1000 tasks', async ({ page }) => {
  await seedLargeWorkspace(page)
  await runMeasuredInteraction(page)
  await resetMeasuredInteraction(page)

  const samples = []
  for (let index = 0; index < 3; index += 1) {
    const sample = await runMeasuredInteraction(page)
    samples.push(sample.elapsed)
    expect(sample.beforeExpanded).toBe('false')
    await expect(page.getByTestId('goal-node-g0')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('goal-node-g10')).toHaveCount(0)
    await expect(page.locator('.tasks-panel').getByTestId('goal-task-t0').getByRole('checkbox')).toBeChecked()
    await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)).tasks[0].completed, WORKSPACE_KEY)).toBe(true)
    if (index < 2) await resetMeasuredInteraction(page)
  }

  const description = samples.map(value => value.toFixed(1)).join(', ')
  console.info(`[benchmark] search-expand-toggle samples: ${description}ms (100 goals / 1000 tasks; one warm-up discarded)`)
  test.info().annotations.push({ type: 'benchmark', description: `${description}ms / 100 goals + 1000 tasks` })
  expect(Math.max(...samples)).toBeLessThan(200)
})

test('switches workspace, kanban and a rendered mind-map in the browser', async ({ page }) => {
  await seedThreeLevelWorkspace(page)

  await page.getByTestId('view-kanban').click()
  await expect(page.getByTestId('goal-card-g3')).toBeVisible()
  await page.getByTestId('view-mindmap').click()
  await expect(page.locator('.mind-map svg')).toBeVisible()
  await page.getByTestId('view-workspace').click()
  await expect(page.locator('.workspace-shell')).toBeVisible()
})

test('keeps narrow headers contained and goal-tree touch actions about 40px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedThreeLevelWorkspace(page)

  const header = await page.locator('.page-header').boundingBox()
  expect(header.x).toBeGreaterThanOrEqual(0)
  expect(header.x + header.width).toBeLessThanOrEqual(390)
  await page.getByRole('button', { name: '目标树' }).click()
  const action = page.getByRole('button', { name: '为年度目标新增子目标' })
  await expect(action).toBeVisible()
  const box = await action.boundingBox()
  expect(box.width).toBeGreaterThanOrEqual(39)
  expect(box.height).toBeGreaterThanOrEqual(39)
})

test('filters 100 goals by derived status and deadline while retaining ancestors', async ({ page }) => {
  await seedLargeWorkspace(page)

  await page.getByTestId('goal-deadline-filter').click()
  await page.getByRole('option', { name: '未来7天', exact: true }).click()
  await expect(page.getByTestId('goal-node-g90')).toBeVisible()
  await expect(page.getByTestId('goal-node-g0')).toHaveCount(0)

  await page.getByTestId('goal-deadline-filter').click()
  await page.getByRole('option', { name: '全部截止时间', exact: true }).click()
  await page.getByTestId('goal-status-filter').click()
  await page.getByRole('option', { name: '进行中', exact: true }).click()
  await expect(page.getByTestId('goal-node-g90')).toBeVisible()
  await expect(page.getByTestId('goal-node-g0')).toHaveCount(0)
})

async function runMeasuredInteraction(page) {
  return page.evaluate(async () => {
    const root = document.querySelector('[data-testid="goal-node-g0"]')
    const expand = root?.closest('.el-tree-node')?.querySelector('.el-tree-node__expand-icon')
    const search = document.querySelector('[data-testid="goal-search"]')
    const checkbox = document.querySelector('[data-testid="goal-task-t0"] input[type="checkbox"]')
    if (!root || !expand || !search || !checkbox) throw new Error('性能旅程控件缺失')
    const beforeExpanded = root.getAttribute('aria-expanded')
    const started = performance.now()
    expand.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    search.value = '目标 9'
    search.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '目标 9' }))
    checkbox.click()
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return {
      elapsed: performance.now() - started,
      beforeExpanded
    }
  })
}

async function resetMeasuredInteraction(page) {
  await page.getByTestId('goal-search').fill('')
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const root = page.getByTestId('goal-node-g0')
  if (await root.getAttribute('aria-expanded') === 'true') {
    await root.evaluate(element => element.closest('.el-tree-node').querySelector('.el-tree-node__expand-icon').click())
  }
  const row = page.locator('.tasks-panel').getByTestId('goal-task-t0')
  if (await row.getByRole('checkbox').isChecked()) await row.locator('label').click()
  await expect(root).toHaveAttribute('aria-expanded', 'false')
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)).tasks[0].completed, WORKSPACE_KEY)).toBe(false)
}

async function createGoal(page, title) {
  await page.getByRole('button', { name: '新建目标', exact: true }).click()
  await page.getByLabel('目标标题').fill(title)
  await page.getByTestId('goal-editor-submit').click()
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
}

async function createChildGoal(page, title) {
  await page.locator('.detail-panel').getByTestId('create-child-goal').click()
  await page.getByLabel('目标标题').fill(title)
  await page.getByTestId('goal-editor-submit').click()
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
}

async function createGoalTask(page, title) {
  await page.locator('.detail-panel').getByTestId('create-goal-task').click()
  const dialog = page.getByRole('dialog', { name: '新增目标任务' })
  await dialog.getByRole('textbox').fill(title)
  await dialog.getByRole('button', { name: 'OK' }).click()
  await expect(page.locator('.tasks-panel').getByText(title, { exact: true })).toBeVisible()
}

async function createChildGoalTask(page, parentTitle, title) {
  await page.locator('.tasks-panel').getByRole('button', { name: `为${parentTitle}新增子任务` }).click()
  const dialog = page.getByRole('dialog', { name: '新增子任务' })
  await dialog.getByRole('textbox').fill(title)
  await dialog.getByRole('button', { name: 'OK' }).click()
  await expect(page.locator('.tasks-panel').getByText(title, { exact: true })).toBeVisible()
}

async function seedThreeLevelWorkspace(page) {
  await page.evaluate(key => {
    const now = new Date().toISOString()
    localStorage.setItem(key, JSON.stringify({
      version: 2,
      migratedAt: now,
      updatedAt: now,
      goals: [
        goal('g1', null, '年度目标', now),
        goal('g2', 'g1', '产品目标', now),
        goal('g3', 'g2', '发布2.0', now)
      ],
      tasks: [
        task('t1', 'g3', null, '发布', now),
        task('t2', 'g3', 't1', '验收', now),
        task('t3', 'g3', 't2', '回归测试', now)
      ]
    }))
    localStorage.setItem('efficient-office.goal-ui.v1', JSON.stringify({ selectedId: 'g3', expandedIds: ['g1', 'g2'] }))

    function goal(id, parentGoalId, title, timestamp) {
      return { id, parentGoalId, title, description: '', manualProgress: 0, weight: 1, startDate: null, deadline: null, createdAt: timestamp, updatedAt: timestamp }
    }
    function task(id, goalId, parentTaskId, title, timestamp) {
      return { id, goalId, parentTaskId, title, description: '', completed: false, weight: 1, priority: '中', deadline: null, createdAt: timestamp, updatedAt: timestamp }
    }
  }, WORKSPACE_KEY)
  await page.goto('/goals/g3', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: '发布2.0', exact: true })).toBeVisible()
}

async function seedLargeWorkspace(page) {
  await page.evaluate(key => {
    const now = new Date().toISOString()
    const goals = Array.from({ length: 100 }, (_, index) => ({
      id: `g${index}`,
      parentGoalId: index % 10 === 0 ? null : `g${index - (index % 10)}`,
      title: `目标 ${index}`,
      description: '',
      manualProgress: index === 99 ? 100 : 0,
      weight: 1,
      startDate: null,
      deadline: index === 99 ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) : null,
      createdAt: now,
      updatedAt: now
    }))
    const tasks = Array.from({ length: 1000 }, (_, index) => ({
      id: `t${index}`,
      goalId: `g${index % 100}`,
      parentTaskId: null,
      title: `任务 ${index}`,
      description: '',
      completed: index % 100 === 99,
      weight: 1,
      priority: '中',
      deadline: null,
      createdAt: now,
      updatedAt: now
    }))
    localStorage.setItem(key, JSON.stringify({ version: 2, migratedAt: now, updatedAt: now, goals, tasks }))
  }, WORKSPACE_KEY)
  await page.goto('/goals/g0', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('goal-node-g0')).toBeVisible()
}
