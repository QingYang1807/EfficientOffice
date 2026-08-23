import { expect, it, vi } from 'vitest'
import { WORKSPACE_KEY } from '@/repositories/workspaceRepository'
import { installWorkspaceStorageBridge } from '@/services/workspaceEvents'

it('installs one storage bridge and only marks workspace changes stale', () => {
  const target = new EventTarget()
  const stale = vi.fn()
  target.addEventListener('workspace:stale', stale)

  expect(installWorkspaceStorageBridge(target)).toBe(true)
  expect(installWorkspaceStorageBridge(target)).toBe(false)
  const unrelated = new Event('storage')
  Object.defineProperty(unrelated, 'key', { value: 'other' })
  target.dispatchEvent(unrelated)
  expect(stale).not.toHaveBeenCalled()

  const workspace = new Event('storage')
  Object.defineProperty(workspace, 'key', { value: WORKSPACE_KEY })
  target.dispatchEvent(workspace)
  expect(stale).toHaveBeenCalledOnce()
})
