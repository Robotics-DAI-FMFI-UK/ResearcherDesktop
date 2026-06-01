import client from './client'

export const getCategories = () =>
  client.get('/api/categories')

export const getCategory = (id) =>
  client.get(`/api/categories/${id}`)

export const createCategory = (data) =>
  client.post('/api/categories', data)

export const updateCategory = (id, data) =>
  client.put(`/api/categories/${id}`, data)

export const deleteCategory = (id) =>
  client.delete(`/api/categories/${id}`)
