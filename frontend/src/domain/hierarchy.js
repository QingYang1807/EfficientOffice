export const MAX_HIERARCHY_DEPTH = 20

export function buildTree(items, parentKey) {
  const nodes = new Map(items.map(item => [String(item.id), { ...item, children: [] }]))
  const roots = []
  for (const item of items) {
    const node = nodes.get(String(item.id))
    const parent = item[parentKey] == null ? null : nodes.get(String(item[parentKey]))
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

export function getAncestorIds(items, id, parentKey) {
  const byId = new Map(items.map(item => [String(item.id), item]))
  const result = []
  const seen = new Set([String(id)])
  let node = byId.get(String(id))
  while (node?.[parentKey] != null) {
    const parentId = String(node[parentKey])
    if (seen.has(parentId)) throw new Error('检测到循环层级')
    seen.add(parentId)
    result.unshift(parentId)
    node = byId.get(parentId)
    if (!node) break
  }
  return result
}

export function getDescendantIds(items, id, parentKey) {
  const children = new Map()
  for (const item of items) {
    const key = item[parentKey] == null ? null : String(item[parentKey])
    children.set(key, [...(children.get(key) || []), String(item.id)])
  }
  const result = []
  const queue = [...(children.get(String(id)) || [])]
  const seen = new Set([String(id)])
  while (queue.length) {
    const childId = queue.shift()
    if (seen.has(childId)) throw new Error('检测到循环层级')
    seen.add(childId)
    result.push(childId)
    queue.push(...(children.get(childId) || []))
  }
  return result
}

export function getDepth(items, id, parentKey) {
  return getAncestorIds(items, id, parentKey).length + 1
}

export function validateMove({ items, id, newParentId, parentKey, maxDepth = MAX_HIERARCHY_DEPTH }) {
  if (newParentId == null) return { ok: true }
  if (String(id) === String(newParentId)) return { ok: false, reason: '节点不能成为自己的父级' }
  if (getDescendantIds(items, id, parentKey).includes(String(newParentId))) {
    return { ok: false, reason: '不能移动到自身后代节点' }
  }
  const oldDepth = getDepth(items, id, parentKey)
  const subtreeDepth = 1 + Math.max(0, ...getDescendantIds(items, id, parentKey)
    .map(childId => getDepth(items, childId, parentKey) - oldDepth))
  const nextDepth = getDepth(items, newParentId, parentKey) + subtreeDepth
  return nextDepth <= maxDepth ? { ok: true } : { ok: false, reason: `层级不能超过${maxDepth}层` }
}
