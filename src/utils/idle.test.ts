import { describe, expect, it, vi } from 'vitest'
import { cancelIdleTask, scheduleIdleTask } from './idle'

describe('idle utils', () => {
  it('usa requestIdleCallback quando disponivel', () => {
    const original = (window as Window & { requestIdleCallback?: typeof window.requestIdleCallback })
      .requestIdleCallback
    ;(window as Window & { requestIdleCallback?: typeof window.requestIdleCallback }).requestIdleCallback = ((
      callback: () => void,
    ) => {
        callback()
        return 101
      }) as typeof window.requestIdleCallback

    const task = vi.fn()
    const handle = scheduleIdleTask(task)

    expect(handle).toBe(101)
    expect(task).toHaveBeenCalledTimes(1)
    ;(window as Window & { requestIdleCallback?: typeof window.requestIdleCallback }).requestIdleCallback =
      original
  })

  it('cancela com cancelIdleCallback quando disponivel', () => {
    const original = (window as Window & { cancelIdleCallback?: typeof window.cancelIdleCallback })
      .cancelIdleCallback
    const cancelSpy = vi.fn()
    ;(window as Window & { cancelIdleCallback?: typeof window.cancelIdleCallback }).cancelIdleCallback = cancelSpy

    cancelIdleTask(77)

    expect(cancelSpy).toHaveBeenCalledWith(77)
    ;(window as Window & { cancelIdleCallback?: typeof window.cancelIdleCallback }).cancelIdleCallback =
      original
  })
})
