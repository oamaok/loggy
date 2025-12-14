import state from './state'
import * as auth from './auth'
import * as api from './api'
import { useEffect } from 'kaiku'
import LogEntryComponent from './LogEntryComponent'

const LogList = () => {
  const openNewLog = () => {
    state.currentView = { type: 'new' }
  }

  useEffect(() => {
    api.getLogEntries().then((entries) => {
      state.logEntries = entries
    })
  })

  return (
    <div>
      <button onClick={openNewLog}>add</button>
      <button onClick={auth.logout}>logout</button>

      <div>
        {state.logEntries.map((entry) => (
          <LogEntryComponent key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

export default LogList
