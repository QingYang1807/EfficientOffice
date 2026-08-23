import { expect, it } from 'vitest'

it('provides browser storage', () => {
  localStorage.setItem('probe', 'ok')
  expect(localStorage.getItem('probe')).toBe('ok')
})
