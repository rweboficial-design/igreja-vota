// src/App.jsx
import React from "react";
import useStore from "./store";
import HomeScreen from "./HomeScreen";
import TechDashboard from "./tech/TechDashboard";
import IndicationScreen from "./member/IndicationScreen";
import VotingScreen from "./member/VotingScreen";
import AwaitScreen from "./member/AwaitScreen";

export default function App() {
  const { stage, isTech } = useStore();

  // 1) Tela inicial de login
  if (stage === "login") return <HomeScreen />;

  // 2) Se é técnico, SEMPRE fica no painel técnico,
  //    mesmo quando a fase global muda para "indication"/"voting".
  if (isTech) return <TechDashboard />;

  // 3) Fluxo do membro (cada membro vê a fase atual)
  switch (stage) {
    case "indication":
      return <IndicationScreen />;
    case "voting":
      return <VotingScreen />;
    case "none":
    default:
      return <AwaitScreen />;
  }
}
