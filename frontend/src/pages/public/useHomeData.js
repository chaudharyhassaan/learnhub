import { useEffect, useState } from 'react'
import getErrorMessage from '../../utils/getErrorMessage'

const pending = { loading: true, data: null, error: null }

// Ignore responses from an earlier attempt after the request changes or the page closes.
export default function useHomeData(load, version) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(pending)

  useEffect(() => {
    let active = true
    load().then(data => {
      if (active) setResult({ load, version, loading: false, data, error: null })
    }).catch(error => {
      if (active) setResult({
        load, version, loading: false, data: null, error: getErrorMessage(error).message, status: error.response?.status,
      })
    })
    return () => { active = false }
  }, [load, attempt, version])

  function retry() {
    setResult(pending)
    setAttempt(current => current + 1)
  }

  return { ...(result.load === load && result.version === version ? result : pending), retry }
}
