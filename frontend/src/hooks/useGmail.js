import { scanGmail, importConference } from '../api/gmail'

export function useGmail() {
  return { scanGmail, importConference }
}
