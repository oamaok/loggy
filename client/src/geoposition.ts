import assert from './assert'

let initialPositionResolved = false
let resolveInitialPosition: () => void
const initialPositionPromise: Promise<void> = new Promise((resolve) => {
  resolveInitialPosition = resolve
})
let latestPosition: GeolocationCoordinates | null = null

navigator.geolocation.watchPosition((pos) => {
  latestPosition = pos.coords

  if (!initialPositionResolved) {
    resolveInitialPosition()
    initialPositionResolved = true
  }
})

export const getGeoposition = async (): Promise<GeolocationCoordinates> => {
  if (!initialPositionResolved) {
    await initialPositionPromise
  }

  assert(latestPosition)
  return latestPosition
}
