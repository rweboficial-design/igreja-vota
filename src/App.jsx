import React from "react";
import useStore from "./store";
import HomeScreen from "./HomeScreen";
import TechDashboard from "./tech/TechDashboard";
import IndicationScreen from "./member/IndicationScreen";
import VotingScreen from "./member/VotingScreen";
import AwaitScreen from "./member/AwaitScreen";

export default function App() {
  const { stage, isTech } = useStore();

  if (stage === "login") return <HomeScreen />;

  // Técnico sempre fica no painel
  if (isTech) return <TechDashboard />;

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
