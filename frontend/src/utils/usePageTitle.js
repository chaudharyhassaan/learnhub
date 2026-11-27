import { useEffect } from 'react'

// Keep the browser tab in sync with client-side navigation.
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title + ' | LearnHub'
  }, [title])
}
