import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)
export const RegistrationContext = createContext(null)
export const CheckinContext = createContext(null)

export const useAuth = () => useContext(AuthContext)
export const useRegistration = () => useContext(RegistrationContext)
export const useCheckin = () => useContext(CheckinContext)
