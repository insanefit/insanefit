type IdleHandle = number

type RequestIdleCallbackFn = (
  callback: () => void,
  options?: { timeout?: number },
) => IdleHandle

type CancelIdleCallbackFn = (handle: IdleHandle) => void

const hasRequestIdleCallback = (): boolean =>
  typeof window !== 'undefined' &&
  typeof (window as Window & { requestIdleCallback?: RequestIdleCallbackFn }).requestIdleCallback === 'function'

const hasCancelIdleCallback = (): boolean =>
  typeof window !== 'undefined' &&
  typeof (window as Window & { cancelIdleCallback?: CancelIdleCallbackFn }).cancelIdleCallback === 'function'

export const scheduleIdleTask = (task: () => void, timeout = 1200): IdleHandle => {
  if (hasRequestIdleCallback()) {
    return (window as Window & { requestIdleCallback: RequestIdleCallbackFn }).requestIdleCallback(task, {
      timeout,
    })
  }
  return window.setTimeout(task, 120)
}

export const cancelIdleTask = (handle: IdleHandle) => {
  if (hasCancelIdleCallback()) {
    ;(window as Window & { cancelIdleCallback: CancelIdleCallbackFn }).cancelIdleCallback(handle)
    return
  }
  window.clearTimeout(handle)
}

