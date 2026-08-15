import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import brandIconUrl from "./assets/icon-only.png";
import "./styles.css";

function App() {
  return (
    <div className="page-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="FinStates home">
          <img className="brand-icon" src={brandIconUrl} alt="" />
          <span>Fin<span className="brand-accent">States</span></span>
        </a>
        <span className="status-label">
          <span className="status-dot" aria-hidden="true" />
          In development
        </span>
      </header>

      <main className="hero">
        <section className="hero-copy" aria-labelledby="page-title">
          <p className="eyebrow">Local-first professional workspace</p>
          <h1 id="page-title">Facts first.</h1>
          <p className="intro">
            FinStates is built around reusable XBRL Facts.
          </p>
        </section>

        <div className="brand-stage" aria-hidden="true">
          <div className="brand-halo" />
          <img src={brandIconUrl} alt="" />
        </div>
      </main>

      <footer className="site-footer">
        <span>FinStates</span>
        <span>© 2026</span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
