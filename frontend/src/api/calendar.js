import client from './client'

export const getCalendarStatus = () => client.get('/api/calendar/status')
export const getCalendarAuthUrl = () => client.get('/api/calendar/auth')
export const getCalendarEvents = (params) => client.get('/api/calendar/events', { params })
export const createCalendarEvent = (data) => client.post('/api/calendar/events', data)
export const deleteCalendarEvent = (eventId) => client.delete(`/api/calendar/events/${eventId}`)
