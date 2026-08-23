import { WORKSPACE_KEY } from '@/repositories/workspaceRepository'

const INSTALL_KEY = '__efficientOfficeWorkspaceStorageBridge__'

export function installWorkspaceStorageBridge(target = window) {
  if (target[INSTALL_KEY]) return false
  target.addEventListener('storage', event => {
    if (event.key === WORKSPACE_KEY) target.dispatchEvent(new CustomEvent('workspace:stale'))
  })
  target[INSTALL_KEY] = true
  return true
}
