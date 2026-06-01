import { useState, useCallback, useEffect } from 'react'
import {
  getItem, updateItem as apiUpdate, deleteItem as apiDelete,
  uploadImage as apiUploadImage,
  addFile as apiAddFile, deleteFile as apiDeleteFile, getFile,
  addComment as apiAddComment, deleteComment as apiDeleteComment,
  updateComment as apiUpdateComment,
  addLink as apiAddLink, deleteLink as apiDeleteLink,
  addRelation as apiAddRelation, removeRelation as apiRemoveRelation,
} from '../api/items'

export function useItem(id) {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(false)

  const refetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const { data } = await getItem(id)
      setItem(data)
    } catch {}
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { refetch() }, [refetch])

  const updateItem = useCallback(async (data) => {
    await apiUpdate(id, data)
    await refetch()
  }, [id, refetch])

  const deleteItem = useCallback(() => apiDelete(id), [id])

  const uploadImage = useCallback(async (file) => {
    await apiUploadImage(id, file)
    await refetch()
  }, [id, refetch])

  const addFile = useCallback(async (file) => {
    await apiAddFile(id, file)
    await refetch()
  }, [id, refetch])

  const deleteFile = useCallback(async (fileId) => {
    await apiDeleteFile(id, fileId)
    await refetch()
  }, [id, refetch])

  const addComment = useCallback(async (text) => {
    await apiAddComment(id, text)
    await refetch()
  }, [id, refetch])

  const deleteComment = useCallback(async (commentId) => {
    await apiDeleteComment(id, commentId)
    await refetch()
  }, [id, refetch])

  const updateComment = useCallback(async (commentId, text) => {
    await apiUpdateComment(id, commentId, text)
    await refetch()
  }, [id, refetch])

  const addLink = useCallback(async (url, name, description) => {
    await apiAddLink(id, url, name, description)
    await refetch()
  }, [id, refetch])

  const deleteLink = useCallback(async (linkId) => {
    await apiDeleteLink(id, linkId)
    await refetch()
  }, [id, refetch])

  const addRelation = useCallback(async (relatedId) => {
    await apiAddRelation(id, relatedId)
    await refetch()
  }, [id, refetch])

  const removeRelation = useCallback(async (relatedId) => {
    await apiRemoveRelation(id, relatedId)
    await refetch()
  }, [id, refetch])

  return {
    item, loading, refetch,
    updateItem, deleteItem,
    uploadImage, addFile, deleteFile, getFile,
    addComment, deleteComment, updateComment,
    addLink, deleteLink,
    addRelation, removeRelation,
  }
}
