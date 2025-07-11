import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { pwaService } from "./lib/pwa.ts";

// Initialize PWA service
pwaService;

createRoot(document.getElementById("root")!).render(<App />);
