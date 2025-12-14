import './index.css'
import './auth'
import { render } from 'kaiku'
import * as api from './api'
import state from './state'
import LogEditor from './LogEditor'
import LogList from './LogList'
import Loader from './Loader'
import AuthView from './AuthView'

addEventListener('error', (err) => {
  api.sendError(err.error)
})

const App = () => {
  return (
    <>
      <main
        style={{ height: () => state.viewportHeight + 'px', width: '100%' }}
      >
        {() => {
          if (state.auth.type === 'init') {
            return null
          }

          if (state.auth.type === 'unauthenticated') {
            return <AuthView />
          }

          switch (state.currentView.type) {
            case 'list': {
              return <LogList />
            }

            case 'new': {
              return <LogEditor />
            }

            case 'edit': {
              throw new Error('TODO: implement edit')
            }

            default: {
              throw new Error('unhandled view')
            }
          }
        }}
      </main>
      <Loader />
    </>
  )
}

render(<App />, document.querySelector('div')!)
