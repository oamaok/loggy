import { createShallowState } from 'kaiku'
import styles from './Loader.css'

const spinnerState = createShallowState({
  active: true,
})

const Loader = () => {
  return (
    <div class={[styles.loader, { [styles.active!]: spinnerState.active }]}>
      <div class={styles.spinner} />
    </div>
  )
}

export default Loader

export async function withLoadingSpinner<T>(fn: () => Promise<T>): Promise<T> {
  spinnerState.active = true
  try {
    const res = await fn()
    return res
  } finally {
    spinnerState.active = false
  }
}
