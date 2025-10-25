import { create } from "zustand";

// Estado global com persistência em localStorage
const useStore = create((set, get) => ({
  // stage pode ser: 'login' | 'none' | 'indication' | 'voting' | 'tech'
  stage: "login",
  isTech: false,
  // member: { id, name }
  member: null,

  // Sessão atual que o técnico controla (opcional)
  session: {
    ministry_id: "",
    role_id: "",
    stage: "none",
  },

  // Ações
  setStage: (stage, ministry_id = "", role_id = "") =>
    set((state) => ({
      stage,
      session: {
        ...state.session,
        ministry_id: ministry_id || state.session.ministry_id,
        role_id: role_id || state.session.role_id,
        stage,
      },
    })),

  setTech: (value) => set({ isTech: !!value }),

  setMember: (member) => set({ member }),

  // Utilitários
  logout: () =>
    set({
      stage: "login",
      isTech: false,
      member: null,
      session: { ministry_id: "", role_id: "", stage: "none" },
    }),
}));

// Persistência simples em localStorage
// (restaura no load)
const KEY = "igreja_vota_store_v1";
try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const saved = JSON.parse(raw);
    if (saved && typeof saved === "object") {
      const s = useStore.getState();
      useStore.setState({
        ...s,
        ...saved,
        // segurança: se algo vier inválido, força 'login'
        stage: saved.stage || "login",
        isTech: !!saved.isTech,
      });
    }
  }
} catch {}

useStore.subscribe((state) => {
  try {
    const toSave = {
      stage: state.stage,
      isTech: state.isTech,
      member: state.member,
      session: state.session,
    };
    localStorage.setItem(KEY, JSON.stringify(toSave));
  } catch {}
});

export default useStore;
