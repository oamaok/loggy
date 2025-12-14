import { LogEntry } from '@loggy/common/types'
import { createShallowState } from 'kaiku'

type View = { type: 'list' } | { type: 'new' } | { type: 'edit'; id: number }
type AuthState =
  | { type: 'init' }
  | { type: 'unauthenticated' }
  | { type: 'authenticated'; token: string }

const state = createShallowState({
  currentView: { type: 'list' } as View,
  auth: { type: 'init' } as AuthState,
  viewportHeight: visualViewport?.height ?? window.innerHeight,
  logEntries: [] as LogEntry[],
})

visualViewport?.addEventListener('resize', () => {
  state.viewportHeight = visualViewport!.height
})

export default state
