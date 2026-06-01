import { useState, useCallback, useEffect } from 'react'
import {
  getCategories,
  createCategory as apiCreate,
  updateCategory as apiUpdate,
  deleteCategory as apiDelete,
} from '../api/categories'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getCategories()
      setCategories(data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refetch() }, [refetch])

  const createCategory = useCallback(async (data) => {
    await apiCreate(data)
    await refetch()
  }, [refetch])

  const updateCategory = useCallback(async (id, data) => {
    await apiUpdate(id, data)
    await refetch()
  }, [refetch])

  const deleteCategory = useCallback(async (id) => {
    await apiDelete(id)
    await refetch()
  }, [refetch])

  return { categories, loading, refetch, createCategory, updateCategory, deleteCategory }
}
