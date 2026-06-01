import client from './client'

export const getKeywords = () => client.get('/api/keywords')
export const createKeyword = (name) => client.post('/api/keywords', { name })
export const deleteKeyword = (id) => client.delete(`/api/keywords/${id}`)
