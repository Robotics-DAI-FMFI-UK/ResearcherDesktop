import { useState, useCallback, useEffect } from 'react'
import { getKeywords, createKeyword as apiCreate, deleteKeyword as apiDelete } from '../api/keywords'

export function useKeywords() {
  const [keywords, setKeywords] = useState([])
  const [loading, setLoading] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getKeywords()
      setKeywords(data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refetch() }, [refetch])

  const createKeyword = useCallback(async (name) => {
    const { data } = await apiCreate(name)
    setKeywords((prev) => [...prev, data])
    return data
  }, [])

  const deleteKeyword = useCallback(async (id) => {
    await apiDelete(id)
    setKeywords((prev) => prev.filter((k) => k.id !== id))
  }, [])

  return { keywords, loading, refetch, createKeyword, deleteKeyword }
}
