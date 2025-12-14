import styles from './Navbar.css'

import state from './state'
import * as auth from './auth'
import Icon from './Icon'

const openNewLog = () => {
  state.currentView = { type: 'new' }
}

const Navbar = () => {
  return (
    <div class={styles.navbar}>
      {/*
      <button onClick={auth.logout}>
        <Icon name="logout" />
      </button>
      */}
      <button onClick={openNewLog}>
        <Icon name="add_notes" />
      </button>
    </div>
  )
}

export default Navbar
