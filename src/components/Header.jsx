// src/components/Header.jsx
import React from 'react'
import useStore from '../store'

export default function Header() {
  const { userType, setUserType } = useStore()

  const toggleProfile = () => {
    setUserType(userType === 'member' ? 'tech' : 'member')
  }

  return (
    <header className="header">
      <h1>Igreja Vota</h1>
      <div style={{ marginLeft: 'auto' }}>
        <button onClick={toggleProfile}>
          {userType === 'member' ? 'Entrar como Técnico' : 'Entrar como Membro'}
        </button>
      </div>
    </header>
  )
}
