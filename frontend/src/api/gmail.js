import client from './client'

export const scanGmail = () => client.post('/api/gmail/scan')
export const importConference = (data) => client.post('/api/gmail/import', data)
