import { beforeEach, expect, it, vi } from 'vitest'
import { WORKSPACE_KEY, exportWorkspace, loadWorkspace, patchWorkspace, saveWorkspace } from '@/repositories/workspaceRepository'

const original = {
  version: 2,
  migratedAt: '2026-08-23T09:00:00.000Z',
  updatedAt: '2026-08-23T10:00:00.000Z',
  goals: [], tasks: []
}

beforeEach(() => localStorage.setItem(WORKSPACE_KEY, JSON.stringify(original)))

it('rejects an older revision without changing persisted bytes', () => {
  const before = localStorage.getItem(WORKSPACE_KEY)
  expect(() => saveWorkspace(localStorage, { ...original, goals: [{ id: 'g1' }] }, {
    expectedUpdatedAt: '2026-08-23T09:59:00.000Z'
  })).toThrow('数据已在其他页面更新，请刷新后重试')
  expect(localStorage.getItem(WORKSPACE_KEY)).toBe(before)
})

it('writes a new root revision after a matching optimistic save', () => {
  vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-08-23T11:00:00.000Z')
  saveWorkspace(localStorage, { ...original, goals: [{ id: 'g1' }] }, { expectedUpdatedAt: original.updatedAt })
  expect(loadWorkspace(localStorage)).toMatchObject({ updatedAt: '2026-08-23T11:00:00.000Z', goals: [{ id: 'g1' }] })
})

it('maps quota failure to a recoverable message and keeps the previous bytes', () => {
  const before = localStorage.getItem(WORKSPACE_KEY)
  const storage = {
    getItem: key => key === WORKSPACE_KEY ? before : null,
    setItem: () => { throw new DOMException('quota', 'QuotaExceededError') }
  }
  expect(() => saveWorkspace(storage, original, { expectedUpdatedAt: original.updatedAt }))
    .toThrow('本地存储空间不足，请先导出或清理数据')
  expect(storage.getItem(WORKSPACE_KEY)).toBe(before)
})

it('exports without mutating storage', () => {
  const before = localStorage.getItem(WORKSPACE_KEY)
  const click = vi.fn()
  const createElement = vi.spyOn(document, 'createElement').mockReturnValue({ click })
  const createObjectURL = vi.fn(() => 'blob:workspace')
  const revokeObjectURL = vi.fn()
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })

  exportWorkspace(original)

  expect(click).toHaveBeenCalledOnce()
  expect(createObjectURL).toHaveBeenCalledOnce()
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:workspace')
  expect(localStorage.getItem(WORKSPACE_KEY)).toBe(before)
  createElement.mockRestore()
})

it('does not acknowledge an external revision during a read-only export load', () => {
  loadWorkspace(localStorage)
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ ...original, updatedAt: 'external-revision' }))
  loadWorkspace(localStorage, { trackRevision: false })

  expect(() => patchWorkspace(localStorage, { goals: [{ id: 'stale' }] }))
    .toThrow('数据已在其他页面更新，请刷新后重试')
})

it('does not let a second tab overwrite the first upgrade of old V2 data', () => {
  const values = new Map([[WORKSPACE_KEY, JSON.stringify({
    version: 2, migratedAt: original.migratedAt, goals: [], tasks: []
  })]])
  const tab = () => ({
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  })
  const firstTab = tab()
  const secondTab = tab()
  loadWorkspace(firstTab)
  loadWorkspace(secondTab)

  patchWorkspace(firstTab, { goals: [{ id: 'first' }] })
  const afterFirstSave = values.get(WORKSPACE_KEY)
  expect(() => patchWorkspace(secondTab, { goals: [{ id: 'second' }] }))
    .toThrow('数据已在其他页面更新，请刷新后重试')
  expect(values.get(WORKSPACE_KEY)).toBe(afterFirstSave)
})

it('treats an explicitly expected null revision as an optimistic assertion', () => {
  expect(() => saveWorkspace(localStorage, original, { expectedUpdatedAt: null }))
    .toThrow('数据已在其他页面更新，请刷新后重试')
})
