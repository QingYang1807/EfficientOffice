import { beforeEach, expect, it, vi } from 'vitest'
import { WORKSPACE_KEY, exportWorkspace, loadWorkspace, patchWorkspace, saveWorkspace, workspaceForExport } from '@/repositories/workspaceRepository'

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

it('exports an actual JSON Blob through a download link and always releases its URL', async () => {
  const before = localStorage.getItem(WORKSPACE_KEY)
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  const createObjectURL = vi.fn(() => 'blob:workspace')
  const revokeObjectURL = vi.fn()
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })

  exportWorkspace(original)

  expect(click).toHaveBeenCalledOnce()
  const blob = createObjectURL.mock.calls[0][0]
  expect(blob).toBeInstanceOf(Blob)
  expect(blob.type).toBe('application/json')
  const content = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(reader.result)
    reader.readAsText(blob)
  })
  expect(JSON.parse(content)).toEqual(original)
  expect(click.mock.instances[0].href).toBe('blob:workspace')
  expect(click.mock.instances[0].download).toBe('efficient-office-workspace-v2.json')
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:workspace')
  expect(localStorage.getItem(WORKSPACE_KEY)).toBe(before)
  click.mockRestore()
})

it('exports malformed current V2 bytes in a diagnostic envelope without modifying storage', () => {
  const raw = '{bad json'
  localStorage.setItem(WORKSPACE_KEY, raw)

  const payload = workspaceForExport(localStorage)

  expect(payload).toEqual({
    exportKind: 'workspace-diagnostic',
    sourceKey: WORKSPACE_KEY,
    error: '工作区数据已损坏',
    raw
  })
  expect(localStorage.getItem(WORKSPACE_KEY)).toBe(raw)
})

it('releases the object URL even when the browser download click fails', () => {
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { throw new Error('download blocked') })
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:failed') })
  const revokeObjectURL = vi.fn()
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })

  expect(() => exportWorkspace(original)).toThrow('download blocked')
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:failed')
  click.mockRestore()
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
