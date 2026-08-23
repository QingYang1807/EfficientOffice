import { expect, it } from 'vitest'
import { buildTree, getAncestorIds, getDescendantIds, getDepth, validateMove } from '@/domain/hierarchy'

const goals = [
  { id: 'g1', parentGoalId: null },
  { id: 'g2', parentGoalId: 'g1' },
  { id: 'g3', parentGoalId: 'g2' }
]

it('builds and traverses a tree', () => {
  expect(buildTree(goals, 'parentGoalId')[0].children[0].children[0].id).toBe('g3')
  expect(getAncestorIds(goals, 'g3', 'parentGoalId')).toEqual(['g1', 'g2'])
  expect(getDescendantIds(goals, 'g1', 'parentGoalId')).toEqual(['g2', 'g3'])
  expect(getDepth(goals, 'g3', 'parentGoalId')).toBe(3)
})

it('rejects a cycle', () => {
  expect(validateMove({ items: goals, id: 'g1', newParentId: 'g3', parentKey: 'parentGoalId', maxDepth: 20 })).toEqual({ ok: false, reason: '不能移动到自身后代节点' })
})

it('recovers an orphan as a root', () => {
  expect(buildTree([{ id: 'orphan', parentGoalId: 'missing' }], 'parentGoalId')[0].id).toBe('orphan')
})

it('rejects self-parent and depth overflow', () => {
  expect(validateMove({ items: goals, id: 'g1', newParentId: 'g1', parentKey: 'parentGoalId' }).ok).toBe(false)
  const chain = Array.from({ length: 20 }, (_, i) => ({ id: `n${i}`, parentGoalId: i ? `n${i - 1}` : null }))
  const leaf = { id: 'leaf', parentGoalId: 'root' }
  expect(validateMove({ items: [...chain, { id: 'root', parentGoalId: null }, leaf], id: 'root', newParentId: 'n19', parentKey: 'parentGoalId' }).ok).toBe(false)
})
