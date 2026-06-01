import { useState, useCallback } from 'react'
import {
  getItems, getItem, createItem, updateItem, deleteItem,
  uploadImage, addFile, deleteFile, getFile,
  addRelation, removeRelation,
  addComment, deleteComment,
  addLink, deleteLink,
} from '../api/items'

export function useItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchItems = useCallback(async (params) => {
    setLoading(true)
    try {
      const { data } = await getItems(params)
      setItems(data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  return {
    items, loading, fetchItems,
    getItem, createItem, updateItem, deleteItem,
    uploadImage, addFile, deleteFile, getFile,
    addRelation, removeRelation,
    addComment, deleteComment,
    addLink, deleteLink,
  }
}
