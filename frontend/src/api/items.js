import client from './client'

export const getItems = (params) => client.get('/items', { params })
export const getItem = (id) => client.get(`/items/${id}`)
export const createItem = (data) => client.post('/items', data)
export const updateItem = (id, data) => client.put(`/items/${id}`, data)
export const deleteItem = (id) => client.delete(`/items/${id}`)
export const addRelation = (id, relatedId) =>
  client.post(`/items/${id}/relations/${relatedId}`)
export const removeRelation = (id, relatedId) =>
  client.delete(`/items/${id}/relations/${relatedId}`)

export const uploadImage = (id, file) => {
  const fd = new FormData()
  fd.append('file', file)
  return client.post(`/items/${id}/image`, fd)
}

export const uploadFile = (id, file) => {
  const fd = new FormData()
  fd.append('file', file)
  return client.post(`/items/${id}/file`, fd)
}

export const getFile = (relativePath) =>
  client.get(`/files/${relativePath}`, { responseType: 'blob' })
