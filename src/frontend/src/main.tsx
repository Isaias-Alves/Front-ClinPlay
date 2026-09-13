import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { agendarRegistroServiceWorker } from "./services/registrarServiceWorker";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento #root não encontrado no index.html.");
}

// Instalação na tela inicial e funcionamento offline dependem disto.
agendarRegistroServiceWorker();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
