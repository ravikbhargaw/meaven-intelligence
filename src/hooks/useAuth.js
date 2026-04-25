import { useState, useEffect } from 'react'

const useAuth = () => {
  const [user, setUser] = useState(null)
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  
  // Multi-User Registry
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('mi_users')
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.error('Auth sync failed, resetting to defaults')
    }
    return [
      {
        email: 'ravi.bhargaw@meaven.in',
        name: 'Ravi Bhargaw',
        password: 'password123',
        pin: '2410',
        role: 'SuperAdmin',
        isNew: true
      }
    ]
  })

  // Sync users to storage
  useEffect(() => {
    localStorage.setItem('mi_users', JSON.stringify(users))
  }, [users])

  const login = (email, password) => {
    const foundUser = users.find(u => u.email === email && u.password === password)
    if (foundUser) {
      setUser(foundUser)
      if (foundUser.isNew) setIsFirstLogin(true)
      return true
    }
    return false
  }

  const updateSecurity = (newPassword, newPin) => {
    setUsers(prev => prev.map(u => 
      u.email === user.email ? { ...u, password: newPassword, pin: newPin, isNew: false } : u
    ))
    setUser({ ...user, isNew: false })
    setIsFirstLogin(false)
  }

  const verifyPin = (pin) => {
    return pin === user?.pin
  }

  const addUser = (newUser) => {
    setUsers([...users, { ...newUser, isNew: true, pin: '1234', password: 'password123' }])
  }

  const verifyMasterKey = (key) => {
    if (key === '210805') {
      const superAdmin = users.find(u => u.email === 'ravi.bhargaw@meaven.in')
      setUser(superAdmin)
      return true
    }
    return false
  }

  const resetUser = (email) => {
    setUsers(prev => prev.map(u => 
      u.email === email ? { ...u, isNew: true, password: 'password123', pin: '1234' } : u
    ))
  }

  return { user, login, isFirstLogin, updateSecurity, verifyPin, showPinModal, setShowPinModal, users, addUser, removeUser, resetUser, verifyMasterKey }
}

export default useAuth
