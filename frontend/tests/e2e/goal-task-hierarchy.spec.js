import { expect, test } from '@playwright/test'

const WORKSPACE_KEY = 'efficient-office.workspace.v2'

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
  await expect(page.locator('.tasks-panel').getByTestId('task-progress-发布')).toHaveText('100%')
  await expect(page.locator('[data-testid="goal-progress"][data-goal-title="发布2.0"]').first()).toHaveText('100%')
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
  expect(persisted.tasks.find(task => task.id === 't1').goalId).toBe('g1')
  expect(persisted.tasks.find(task => task.id === 't2').goalId).toBeNull()
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('efficient-office.workspace.v2.diagnostics')))).toEqual({ orphanTaskIds: ['t2'] })
})

test('preserves malformed and duplicate legacy data for recovery', async ({ page }) => {
  await page.evaluate(key => {
    localStorage.setItem(key, '{bad json')
    localStorage.setItem('goals', JSON.stringify([{ id: 'g1', title: '旧目标' }]))
  }, WORKSPACE_KEY)
  await page.goto('/todos', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('alert').filter({ hasText: '工作区保存失败' })).toBeVisible()
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), WORKSPACE_KEY)).toBe('{bad json')

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

test('preserves hierarchy and selection after refresh', async ({ page }) => {
  await seedThreeLevelWorkspace(page)
  const before = page.url()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(before)
  await expect(page.locator('.detail-panel').getByLabel('目标路径')).toContainText('年度目标/产品目标/发布2.0')
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

  const elapsed = await page.evaluate(async () => {
    const started = performance.now()
    const expand = document.querySelector('.el-tree-node__expand-icon')
    const search = document.querySelector('[data-testid="goal-search"]')
    const checkbox = document.querySelector('[data-testid="goal-task-t0"] input[type="checkbox"]')
    if (!expand || !search || !checkbox) throw new Error('性能旅程控件缺失')
    expand.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    search.value = '目标 0'
    search.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '目标 0' }))
    checkbox.click()
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return performance.now() - started
  })

  expect(elapsed).toBeLessThan(200)
  console.info(`[benchmark] search-expand-toggle: ${elapsed.toFixed(1)}ms (100 goals / 1000 tasks)`)
  await expect(page.getByTestId('goal-node-g0')).toBeVisible()
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)).tasks[0].completed, WORKSPACE_KEY)).toBe(true)
  test.info().annotations.push({ type: 'benchmark', description: `${elapsed.toFixed(1)}ms / 100 goals + 1000 tasks` })
})

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
      manualProgress: 0,
      weight: 1,
      startDate: null,
      deadline: null,
      createdAt: now,
      updatedAt: now
    }))
    const tasks = Array.from({ length: 1000 }, (_, index) => ({
      id: `t${index}`,
      goalId: `g${index % 100}`,
      parentTaskId: null,
      title: `任务 ${index}`,
      description: '',
      completed: false,
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
