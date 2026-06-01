import { loginApi, registerApi, resetRequestApi, resetConfirmApi } from '../api/auth'

export function useAuthApi() {
  return { login: loginApi, register: registerApi, resetRequest: resetRequestApi, resetConfirm: resetConfirmApi }
}
