import { useState, useEffect } from 'react'

const useAuth = () => {
  const [user, setUser] = useState(null)
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  
  // Mock User Data
  const [storedUser, setStoredUser] = useState({
    email: 'ravi@meaven.in',
    password: 'password123',
    pin: '123456',
    isNew: true
  })

  const login = (email, password) => {
    if (email === storedUser.email && password === storedUser.password) {
      setUser({ email })
      if (storedUser.isNew) setIsFirstLogin(true)
      return true
    }
    return false
  }

  const updateSecurity = (newPassword, newPin) => {
    setStoredUser({ ...storedUser, password: newPassword, pin: newPin, isNew: false })
    setIsFirstLogin(false)
  }

  const verifyPin = (pin) => {
    return pin === storedUser.pin
  }

  return { user, login, isFirstLogin, updateSecurity, verifyPin, showPinModal, setShowPinModal }
}

export default useAuth
