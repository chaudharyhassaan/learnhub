export default function getErrorMessage(error) {
  const data = error.response?.data
  if (!error.response && error.request) {
    return { message: 'Cannot reach the server. Check your connection and try again.', fieldErrors: {} }
  }
  return {
    message: data?.message || 'Something went wrong. Please try again.',
    fieldErrors: data?.errors || {},
  }
}
