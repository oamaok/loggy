import { ImageAttachment, LogEntry } from '@loggy/common/types'
import state from './state'

export const getAuthHeaders = (token?: string): HeadersInit => {
  if (token) {
    return {
      authorization: token,
    }
  }

  if (state.auth.type === 'authenticated') {
    return {
      authorization: state.auth.token,
    }
  }

  return {}
}

const expectSuccess = async (res: Response) => {
  if (res.status !== 200) {
    const json = await res.json()
    const errorMsg = json?.error ?? json?.message
    throw new Error(errorMsg)
  }

  return res
}

export const getFreshToken = (
  token: string
): Promise<{ token: string | null }> =>
  fetch('/api/refresh-token', {
    method: 'GET',
    headers: getAuthHeaders(token),
  }).then((res) => {
    if (res.status === 200) {
      return res.json()
    }

    return { token: null }
  })

export const login = (
  email: string,
  password: string
): Promise<{ token: string }> =>
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ email, password }),
  })
    .then(expectSuccess)
    .then((res) => res.json())

export const createAccount = (
  email: string,
  password: string
): Promise<{ token: string }> =>
  fetch('/api/create-account', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ email, password }),
  })
    .then(expectSuccess)
    .then((res) => res.json())

export const whoami = (): Promise<{ id: number; email: string } | null> =>
  fetch('/api/whoami', {
    method: 'GET',
    headers: getAuthHeaders(),
  }).then((res) => {
    if (res.status === 200) {
      return res.json()
    }

    return null
  })
export const getLogEntries = (): Promise<LogEntry[]> =>
  fetch('/api/log', {
    method: 'GET',
    headers: getAuthHeaders(),
  })
    .then(expectSuccess)
    .then((res) => res.json())

export const sendError = (error: any) =>
  fetch('/api/browserError', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(error, Object.getOwnPropertyNames(error)),
  })

export const createLogEntry = (logEntry: {
  textContent: string
  longitude: number
  latitude: number
}): Promise<LogEntry> =>
  fetch('/api/log', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(logEntry),
  })
    .then(expectSuccess)
    .then((res) => res.json())

export const createImageAttachment = (
  logEntryId: number,
  image: File
): Promise<ImageAttachment> => {
  const formData = new FormData()
  formData.append('image', image)

  return fetch(`/api/log/${logEntryId}/attachment`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  })
    .then(expectSuccess)
    .then((res) => res.json())
}
