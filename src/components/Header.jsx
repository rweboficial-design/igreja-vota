import React from 'react'
import useStore from '../store'

export default function Header(){
  const { userType, setUserType } = useStore()

  const resetRole = () => {
    localStorage.removeItem('userType')
    setUserType('') // volta para a tela de escolha
  }

  return (
    <header className="header">
      <img src="/logo.png" alt="Logo" height="40"/>
      <h1>Igreja Vota</h1>
      {userType && (
        <button onClick={resetRole} style={{marginLeft:'auto'}}>
          Trocar perfil
        </button>
      )}
    </header>
  )
}
