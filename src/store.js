import { create } from 'zustand'
import { api } from './api'

const useStore = create((set,get)=>({
  userType: localStorage.getItem('userType')||'',
  setUserType: t=>{ localStorage.setItem('userType', t); set({ userType:t }) },
  memberId: localStorage.getItem('memberId')||'',
  setMemberId: id=>{ localStorage.setItem('memberId', id); set({ memberId:id }) },
  session: { status:'idle', stage:'none' },
  async pollSession(){ try{ const s = await api('session'); set({ session:s }); } catch(e){ console.error(e) } },
  async setStage(stage, ministry_id=null, role_id=null){
    await api('session', { method:'POST', body: JSON.stringify({ status: stage==='none'?'idle':stage, stage, ministry_id, role_id }) });
    await get().pollSession()
  },
}))

export default useStore