import styles from './AuthView.css'
import * as auth from './auth'

const AuthView = () => {
  const createAccount = () => {
    auth.createAccount(
      (document.getElementById('email')! as HTMLInputElement).value,
      (document.getElementById('password')! as HTMLInputElement).value
    )
  }

  const login = () => {
    auth.login(
      (document.getElementById('email')! as HTMLInputElement).value,
      (document.getElementById('password')! as HTMLInputElement).value
    )
  }

  return (
    <div class={styles.authView}>
      <form>
        <div class={styles.inputField}>
          <label for="email">Email</label>
          <input type="email" name="email" id="email" />
        </div>
        <div class={styles.inputField}>
          <label for="password">Password</label>
          <input
            type="password"
            name="password"
            min={12}
            max={64}
            id="password"
          />
        </div>

        <div class={styles.actions}>
          <button type="button" onClick={createAccount}>
            Create account
          </button>
          <button type="button" onClick={login}>
            Login
          </button>
        </div>
      </form>
    </div>
  )
}

export default AuthView
