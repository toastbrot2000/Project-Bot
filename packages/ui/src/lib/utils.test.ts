import { expect, test } from 'vitest'
import { cn } from './utils'

test('cn merges classes', () => {
    expect(cn('c-1', 'c-2')).toBe('c-1 c-2')
})

test('cn handles conditions', () => {
    const condition = false
    expect(cn('c-1', condition && 'c-2', 'c-3')).toBe('c-1 c-3')
})

test('cn merges tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
})
