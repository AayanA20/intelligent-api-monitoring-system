import { useEffect, useRef, useState, useCallback } from 'react'

export function usePolling(fetcher, intervalMs = 3000, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const savedFetcher = useRef(fetcher)

  useEffect(() => { savedFetcher.current = fetcher }, [fetcher])

  const run = useCallback(async () => {
    try {
      const res = await savedFetcher.current()
      setData(res)
      setError(null)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    run()
    let timer = setInterval(() => {
      if (document.visibilityState === 'visible') run()
    }, intervalMs)

    const onVis = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVis)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps])

  return { data, loading, error, refresh: run }
}