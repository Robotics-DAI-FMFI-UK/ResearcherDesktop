import client from './client'

export const getItems = (params) => client.get('/api/items', { params })
export const getItem = (id) => client.get(`/api/items/${id}`)
export const createItem = (data) => client.post('/api/items', data)
export const updateItem = (id, data) => client.put(`/api/items/${id}`, data)
export const deleteItem = (id) => client.delete(`/api/items/${id}`)
export const addRelation = (id, relatedId) =>
  client.post(`/api/items/${id}/relations/${relatedId}`)
export const removeRelation = (id, relatedId) =>
  client.delete(`/api/items/${id}/relations/${relatedId}`)

export const uploadImage = (id, file) => {
  const fd = new FormData()
  fd.append('file', file)
  return client.post(`/api/items/${id}/image`, fd)
}

export const addFile = (id, file) => {
  const fd = new FormData()
  fd.append('file', file)
  return client.post(`/api/items/${id}/file`, fd)
}

export const deleteFile = (itemId, fileId) =>
  client.delete(`/api/items/${itemId}/files/${fileId}`)

export const getFile = (relativePath) =>
  client.get(`/api/files/${relativePath}`, { responseType: 'blob' })

export const addComment = (id, text) =>
  client.post(`/api/items/${id}/comments`, { text })

export const deleteComment = (id, commentId) =>
  client.delete(`/api/items/${id}/comments/${commentId}`)

export const updateComment = (itemId, commentId, text) =>
  client.put(`/api/items/${itemId}/comments/${commentId}`, { text })

export const addLink = (id, url, name, description) =>
  client.post(`/api/items/${id}/links`, { url, name, description })

export const deleteLink = (id, linkId) =>
  client.delete(`/api/items/${id}/links/${linkId}`)
