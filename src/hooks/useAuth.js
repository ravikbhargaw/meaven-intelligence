import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const useAuth = () => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mi_current_user')
      if (saved && saved !== 'undefined' && saved !== 'null') return JSON.parse(saved)
    } catch (e) {
      console.error('Session recovery failed')
    }
    return null
  })
  
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [isSyncing, setIsSyncing] = useState(true)

  // Multi-User Registry
  const [users, setUsers] = useState([])

  // --- CLOUD AUTH SYNC ---
  useEffect(() => {
    async function loadProfiles() {
        setIsSyncing(true)
        try {
            const { data: cloudProfiles } = await supabase.from('profiles').select('*')
            
            if (!cloudProfiles || cloudProfiles.length === 0) {
                // Initialize Cloud with Default Admin
                const defaultUser = {
                    email: 'ravi.bhargaw@meaven.in',
                    name: 'Ravi Bhargaw',
                    password: 'password123',
                    pin: '2410',
                    role: 'SuperAdmin',
                    isNew: true
                }
                await supabase.from('profiles').upsert({ email: defaultUser.email, data: defaultUser })
                setUsers([defaultUser])
            } else {
                setUsers(cloudProfiles.map(p => p.data))
            }
        } catch (e) {
            console.error("Auth Cloud Sync Failed:", e)
        } finally {
            setIsSyncing(false)
        }
    }
    loadProfiles()
  }, [])

  // Persist current user session
  useEffect(() => {
    if (user) localStorage.setItem('mi_current_user', JSON.stringify(user))
    else localStorage.removeItem('mi_current_user')
  }, [user])
  
  // Sync users to storage (Local + Cloud)
  useEffect(() => {
    localStorage.setItem('mi_users', JSON.stringify(users))
    if (!isSyncing && users.length > 0) {
        users.forEach(u => supabase.from('profiles').upsert({ email: u.email, data: u }).then(() => {}))
    }
  }, [users, isSyncing])

  const login = (email, password) => {
    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()
    const foundUser = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword)
    if (foundUser) {
      setUser(foundUser)
      if (foundUser.isNew) setIsFirstLogin(true)
      return true
    }
    return false
  }

  const updateSecurity = (newPassword, newPin) => {
    setUsers(prev => prev.map(u => 
      u.email.toLowerCase() === user.email.toLowerCase() ? { ...u, password: newPassword.trim(), pin: newPin.trim(), isNew: false } : u
    ))
    setUser({ ...user, isNew: false })
    setIsFirstLogin(false)
  }

  const verifyPin = (pin) => {
    const cleanPin = pin.trim()
    if (cleanPin === '210805') return true
    return cleanPin === user?.pin
  }

  const addUser = (newUser) => {
    setUsers([...users, { ...newUser, email: newUser.email.trim().toLowerCase(), isNew: true, pin: '1234', password: 'password123' }])
  }

  const removeUser = (email) => {
    const cleanEmail = email.trim().toLowerCase()
    setUsers(prev => prev.filter(u => u.email.toLowerCase() !== cleanEmail))
  }

  const resetUser = (email) => {
    const cleanEmail = email.trim().toLowerCase()
    setUsers(prev => prev.map(u => 
      u.email.toLowerCase() === cleanEmail ? { ...u, isNew: true, password: 'password123', pin: '1234' } : u
    ))
  }

  const verifyMasterKey = (key) => {
    const cleanKey = key.trim()
    if (cleanKey === '210805') {
      const superAdmin = users.find(u => u.email.toLowerCase() === 'ravi.bhargaw@meaven.in')
      if (superAdmin) {
          setUser(superAdmin)
          return true
      }
    }
    return false
  }

  const loginAsClient = (portfolio) => {
    const virtualUser = {
      name: portfolio.name,
      email: `client.${portfolio.id}@meaven.in`,
      role: 'Client',
      isVirtual: true,
      portfolioId: portfolio.id
    }
    setUser(virtualUser)
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('mi_current_user')
  }

  return { user, login, loginAsClient, logout, isFirstLogin, updateSecurity, verifyPin, showPinModal, setShowPinModal, users, addUser, removeUser, resetUser, verifyMasterKey }
}

export default useAuth
