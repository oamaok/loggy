function assert(
  condition: boolean | undefined | object | null,
  message?: string
): asserts condition {
  if (!Boolean(condition)) {
    throw new Error(message ?? 'Assertation failed')
  }
}
export default assert
