import { useEffect } from 'kaiku'
import state from './state'
import * as api from './api'
import LogEntryComponent from './LogEntryComponent'
import styles from './LogList.css'
import Navbar from './Navbar'

const LogList = () => {
  useEffect(() => {
    api.getLogEntries().then((entries) => {
      state.logEntries = entries
    })
  })

  return (
    <>
      <div class={styles.logList}>
        <div>
          {state.logEntries.map((entry) => (
            <LogEntryComponent key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
      <Navbar />
    </>
  )
}

export default LogList
