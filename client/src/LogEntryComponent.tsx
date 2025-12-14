import { LogEntry } from '@loggy/common/types'
import styles from './LogEntryComponent.css'
import { FC } from 'kaiku'

const LogEntryComponent: FC<{ entry: LogEntry; key: number }> = ({ entry }) => {
  const date = new Date(entry.createdAt)

  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')

  const time = [hours, minutes, seconds].join(':')

  return (
    <div class={styles.logEntry}>
      <div class={styles.time}>{time}</div>
      {entry.imageAttachments.length !== 0 ? (
        <div class={styles.images}>
          {entry.imageAttachments.map((attachment) => (
            <img src={`/api/attachment/${attachment.id}/600`} />
          ))}
        </div>
      ) : null}
      <div class={styles.textContent}>{entry.textContent}</div>
    </div>
  )
}

export default LogEntryComponent
