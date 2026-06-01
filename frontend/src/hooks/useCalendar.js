import { useState, useCallback, useEffect } from 'react'
import {
  getCalendarStatus,
  getCalendarAuthUrl,
  getCalendarEvents,
  createCalendarEvent as apiCreate,
} from '../api/calendar'

export function useCalendar() {
  const [connected, setConnected] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  const checkStatus = useCallback(async () => {
    try {
      const { data } = await getCalendarStatus()
      setConnected(data.connected)
    } catch {
      setConnected(false)
    }
  }, [])

  useEffect(() => { checkStatus() }, [checkStatus])

  const fetchEvents = useCallback(async (params) => {
    setLoading(true)
    try {
      const { data } = await getCalendarEvents(params)
      setEvents(data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  const getAuthUrl = useCallback(async () => {
    const { data } = await getCalendarAuthUrl()
    return data.authUrl
  }, [])

  const createEvent = useCallback(async (data) => {
    return apiCreate(data)
  }, [])

  return { connected, setConnected, events, loading, checkStatus, fetchEvents, getAuthUrl, createEvent }
}
