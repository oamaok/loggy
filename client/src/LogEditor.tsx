import { useRef, useShallowState } from 'kaiku'
import Icon from './Icon'
import styles from './LogEditor.css'
import * as api from './api'
import { getGeoposition } from './geoposition'
import { withLoadingSpinner } from './Loader'
import state from './state'

const LogEditor = () => {
  const imageInputRef = useRef<HTMLInputElement>()
  const componentState = useShallowState<{
    images: { file: File; srcUrl: string }[]
  }>({
    images: [],
  })

  const submitLog = async () => {
    withLoadingSpinner(async () => {
      const textContent =
        (document.getElementById('logTextContent')! as HTMLTextAreaElement)
          .value ?? ''
      const geoposition = await getGeoposition()
      const logEntry = await api.createLogEntry({
        textContent,
        longitude: geoposition.longitude,
        latitude: geoposition.latitude,
      })

      for (const image of componentState.images) {
        await api.createImageAttachment(logEntry.id, image.file)
      }

      state.currentView = { type: 'list' }
    })
  }

  const addFiles = () => {
    componentState.images = [
      ...componentState.images,
      ...Array.from(imageInputRef.current?.files ?? []).map((file) => ({
        file,
        srcUrl: URL.createObjectURL(file),
      })),
    ]
  }

  return (
    <div class={styles.logEditor}>
      <input
        accept="image/*"
        type="file"
        ref={imageInputRef}
        class={styles.hidden}
        onChange={addFiles}
      />

      <div class={styles.actions}>
        <button
          class={styles.submit}
          onClick={() => {
            state.currentView = { type: 'list' }
          }}
        >
          <Icon name="close" />
        </button>
      </div>
      <textarea placeholder="Write something..." id="logTextContent"></textarea>
      {() =>
        componentState.images.length ? (
          <div class={styles.imagePreview}>
            {componentState.images.map((image) => (
              <img src={image.srcUrl} />
            ))}
          </div>
        ) : null
      }
      <div class={styles.actions}>
        <button
          onClick={() => {
            imageInputRef.current?.click()
          }}
        >
          <Icon name="add_a_photo" />
        </button>
        <button>
          <Icon name="new_label" />
        </button>
        <button class={styles.submit} onClick={submitLog}>
          <Icon name="send" />
        </button>
      </div>
    </div>
  )
}

export default LogEditor
