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
    if (pin === '210805') return true
    return pin === user?.pin
  }

  const addUser = (newUser) => {
    setUsers([...users, { ...newUser, isNew: true, pin: '1234', password: 'password123' }])
  }

  const removeUser = (email) => {
    setUsers(prev => prev.filter(u => u.email !== email))
  }

  const resetUser = (email) => {
    setUsers(prev => prev.map(u => 
      u.email === email ? { ...u, isNew: true, password: 'password123', pin: '1234' } : u
    ))
  }

  const verifyMasterKey = (key) => {
    if (key === '210805') {
      const superAdmin = users.find(u => u.email === 'ravi.bhargaw@meaven.in')
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
