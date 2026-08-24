import {
  StrictMode,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import Clarity from "@microsoft/clarity";
import brandIconUrl from "./assets/icon-only.png";
import "./design-tokens.css";
import "./styles.css";

const site = {
  name: "FinStates",
  operator: "Shenzhen Little Fish Cat Technology Co., Ltd.",
  email: "support@finstates.app",
  address: [
    "Room 2301, Building A3, Tianfu Huafu (Zone A)",
    "Lijin Community, Hangcheng Subdistrict, Bao'an District",
    "Shenzhen, Guangdong 050300, China",
  ],
} as const;

const UMAMI_WEBSITE_ID = "57595eba-4e9b-48f5-a5c9-19dba5bb8ca6";
const UMAMI_DOMAINS = "finstates.app,www.finstates.app";
const CLARITY_PROJECT_ID = "y78akq9rol";

let clarityStarted = false;

function SiteAnalytics() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;

    if (!clarityStarted) {
      clarityStarted = true;
      Clarity.init(CLARITY_PROJECT_ID);
    }

    if (document.querySelector(`script[data-website-id="${UMAMI_WEBSITE_ID}"]`)) return;

    const script = document.createElement("script");
    script.defer = true;
    script.src = "https://cloud.umami.is/script.js";
    script.dataset.websiteId = UMAMI_WEBSITE_ID;
    script.dataset.domains = UMAMI_DOMAINS;
    document.head.append(script);
  }, []);

  return null;
}

const apiBase = import.meta.env.DEV
  ? "https://api.dev.finstates.app/v1"
  : "https://api.finstates.app/v1";

type WebsiteAccount = {
  email: string;
  earlyAccessStatus: "registered" | "invited" | "activated" | null;
  earlyAccessVerifiedAt: string | null;
};

type AccountState =
  | { status: "loading" | "signed-out"; account: null }
  | { status: "signed-in"; account: WebsiteAccount };

type AccountContextValue = AccountState & {
  refresh: () => Promise<WebsiteAccount | null>;
  signOut: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

function AccountProvider({ children }: { children: ReactNode }) {
  const [accountState, setAccountState] = useState<AccountState>({ status: "loading", account: null });

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase}/account/session`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        setAccountState({ status: "signed-out", account: null });
        return null;
      }
      const account = await response.json() as WebsiteAccount;
      setAccountState({ status: "signed-in", account });
      return account;
    } catch {
      setAccountState({ status: "signed-out", account: null });
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    const response = await fetch(`${apiBase}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("We couldn’t sign you out. Please try again.");
    setAccountState({ status: "signed-out", account: null });
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <AccountContext.Provider value={{ ...accountState, refresh, signOut }}>
      {children}
    </AccountContext.Provider>
  );
}

function useAccount() {
  const account = useContext(AccountContext);
  if (!account) throw new Error("AccountProvider is missing");
  return account;
}

const creditPacks = [
  { name: "Small", credits: "200", price: "$19" },
  { name: "Medium", credits: "600", price: "$50" },
  { name: "Large", credits: "2,000", price: "$150" },
] as const;

const taskSteps = [
  ["01", "Extract", "Read the complete report and confirm its filing scope."],
  ["02", "Prepare", "Review tables, Concepts, values and source evidence."],
  ["03", "Validate", "Run ACRA structure and business-rule checks."],
  ["04", "Preview", "Inspect the exact fixed filing result before delivery."],
  ["05", "Export", "Save the validated ACRA five-file ZIP package."],
] as const;

function syncDocumentThemeColor() {
  const token = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-surface-canvas")
    .trim();
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.append(meta);
  }
  meta.content = token;
}

function SiteHeader() {
  const [compact, setCompact] = useState(false);
  const account = useAccount();
  const isRegistrationRoute = window.location.pathname.startsWith("/register");

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setCompact(window.scrollY > 96));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div className="header-rail">
      <header className="site-header" data-compact={compact}>
        <a className="brand" href="/" aria-label="FinStates home">
          <img className="brand-icon" src={brandIconUrl} alt="" />
          <span>Fin<span className="brand-accent">States</span></span>
        </a>
        {!isRegistrationRoute ? <nav className="header-actions" aria-label="Primary navigation">
          {account.status === "signed-in" ? (
            <a className="header-account" href="/register/" title={account.account.email}>
              <span className="status-dot" aria-hidden="true" />
              <span>{account.account.email}</span>
            </a>
          ) : (
            <a className="header-cta header-sign-in" href="/register/">Sign in</a>
          )}
        </nav> : null}
      </header>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-simple">
        <div className="footer-company">
          <a className="brand footer-brand" href="/" aria-label="FinStates home">
            <img className="brand-icon" src={brandIconUrl} alt="" />
            <span>Fin<span className="brand-accent">States</span></span>
          </a>
          <a className="footer-email" href={`mailto:${site.email}`}>{site.email}</a>
        </div>
        <nav className="footer-links" aria-label="Footer links">
          <a href="/support/">Support</a>
          <a href="/privacy/">Privacy</a>
          <a href="/terms/">Terms</a>
        </nav>
      </div>
    </footer>
  );
}

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}

function ProductWindow({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`product-window${compact ? " product-window-compact" : ""}`} aria-label="FinStates ACRA Workbench preview">
      <div className="window-bar">
        <div className="window-dots" aria-hidden="true"><span /><span /><span /></div>
      </div>
      <div className="window-body">
        <div className="source-pane">
          <div className="pane-heading"><strong>Source PDF</strong><span>Page 18 / 32</span></div>
          <div className="source-document">
            <span className="document-kicker">Note 17</span>
            <strong>Revenue</strong>
            <div className="document-rule" />
            <div className="document-row"><span>Rendering of services</span><b>4,261</b></div>
            <div className="document-row document-row-active"><span>Subscription revenue</span><b>1,842</b></div>
            <div className="document-row"><span>Other revenue</span><b>286</b></div>
            <div className="document-total"><span>Total</span><b>6,389</b></div>
          </div>
          <p className="evidence-caption"><span /> Evidence locator attached</p>
        </div>
        <div className="task-pane">
          <ol className="window-steps" aria-label="ACRA workflow steps">
            {taskSteps.map(([number, label], index) => (
              <li className={index === 2 ? "is-active" : index < 2 ? "is-complete" : ""} key={number}>
                <span>{number}</span><small>{label}</small>
              </li>
            ))}
          </ol>
          <div className="task-summary">
            <div><span>Validation</span><strong>Review issues</strong></div>
            <span className="result-badge">3 checks</span>
          </div>
          <div className="validation-list">
            <div><span className="check-icon">✓</span><p><strong>Taxonomy package</strong><small>ACRA 2026 release fixed</small></p></div>
            <div><span className="check-icon">✓</span><p><strong>Calculation relationships</strong><small>No blocking inconsistency</small></p></div>
            <div className="validation-review"><span className="review-icon">!</span><p><strong>Professional review</strong><small>One item requires confirmation</small></p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const validationErrors = [
    { label: "Out of balance", detail: "Total assets do not equal liabilities and equity" },
    { label: "Totals do not add up", detail: "A total does not equal the sum of its underlying values" },
    { label: "Cash flow does not tie", detail: "Closing cash does not reconcile with the statement of financial position" },
    { label: "Wrong signs or units", detail: "A value uses the wrong sign, currency or rounding level" },
    { label: "Missing disclosures", detail: "Required notes or mandatory fields have been left blank" },
  ];
  const validationChecks = [
    { label: "ACRA Taxonomy 2026", detail: "Uses the latest ACRA taxonomy and filing entry point" },
    { label: "Current & prior periods", detail: "Checks current-year and comparative-period coverage and consistency" },
    { label: "Mandatory disclosures", detail: "Checks mandatory and conditionally required filing information" },
    { label: "Calculation relationships", detail: "Checks totals, component sums and opening-to-closing movements" },
    { label: "Cross-statement consistency", detail: "Reconciles matching facts across statements and disclosure notes" },
  ];

  return (
    <section className="launch-hero" id="product" aria-labelledby="page-title">
      <div className="page-width launch-hero-inner">
        <div className="launch-heading">
          <p className="audience-line">For Singapore accounting firms, accountants, and company secretaries</p>
          <h1 id="page-title">A new workflow for XBRL preparation.</h1>
        </div>
        <div className="workflow-compare" aria-label="Two routes from financial statements to XBRL">
          <div className="workflow-source">
            <span aria-hidden="true">▤</span>
            <strong>Financial statements</strong>
          </div>
          <div className="workflow-branch" aria-hidden="true"><i /><i /></div>
          <div className="workflow-routes">
            <article className="workflow-route workflow-route-legacy">
              <header>
                <span>Current workflow</span>
                <h2>BizFinx Prep Tool</h2>
              </header>
              <ol>
                <li><span>01</span><strong>Import Word or Excel</strong></li>
                <li><span>02</span><strong>Map financial data</strong></li>
                <li><span>03</span><strong>Validate</strong></li>
                <li><span>04</span><strong>Fix and re-validate</strong></li>
              </ol>
              <div className="workflow-errors" aria-label="Examples of genuine errors">
                <small>Genuine Errors</small>
                <div className="workflow-tags">
                  {[validationErrors.slice(0, 3), validationErrors.slice(3)].map((row, index) => (
                    <div key={index}>
                      {row.map((error) => (
                        <span title={error.detail} key={error.label}>{error.label}</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </article>
            <article className="workflow-route workflow-route-finstates">
              <header>
                <span>AI-assisted workflow</span>
                <div className="workflow-title-line">
                  <h2>FinStates Desktop App</h2>
                  <div className="workflow-platforms" aria-label="Available on Windows and macOS">
                    <b>Windows</b>
                    <b>macOS</b>
                  </div>
                </div>
              </header>
              <ol>
                <li data-owner="AI"><span>01</span><strong>Import signed PDF</strong></li>
                <li data-owner="AI"><span>02</span><strong>Reconcile and validate</strong></li>
                <li data-owner="You"><span>03</span><strong>Review exceptions</strong></li>
                <li data-owner="You"><span>04</span><strong>Confirm adjustments</strong></li>
              </ol>
              <div className="workflow-checks" aria-label="Examples of validation checks passed">
                <small>AI Validation &amp; Reconciliation</small>
                <div className="workflow-tags">
                  {[validationChecks.slice(0, 3), validationChecks.slice(3)].map((row, index) => (
                    <div key={index}>
                      {row.map((check) => (
                        <span title={check.detail} key={check.label}>{check.label}</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
          <div className="workflow-merge" aria-hidden="true"><i /><i /></div>
          <div className="workflow-output"><strong>XBRL</strong><span>Ready to export</span></div>
        </div>
      </div>
    </section>
  );
}

const productTourSteps = [
  { key: "extract", label: "Extract" },
  { key: "setup", label: "Setup" },
  { key: "tag", label: "Tag" },
  { key: "validate", label: "Validate" },
  { key: "preview", label: "Preview" },
  { key: "export", label: "Export" },
] as const;

type ProductTourStep = typeof productTourSteps[number]["key"];

const productTourDurations: Record<ProductTourStep, number> = {
  extract: 4200,
  setup: 3800,
  tag: 6000,
  validate: 4200,
  preview: 3600,
  export: 4200,
};

function TourStepContent({ step }: { step: ProductTourStep }) {
  if (step === "extract") {
    return <div className="tour-step-content tour-extract" key={step}>
      <div className="tour-structure-list">
        <div><span>01</span><p><strong>Statement of financial position</strong><small>Table · 12 rows</small></p><b>Detected</b></div>
        <div><span>02</span><p><strong>Statement of profit or loss</strong><small>Table · 9 rows</small></p><b>Detected</b></div>
        <div><span>03</span><p><strong>Statement of changes in equity</strong><small>Table · 6 rows</small></p><b>Detected</b></div>
        <div><span>04</span><p><strong>Statement of cash flows</strong><small>Table · 10 rows</small></p><b>Detected</b></div>
        <div className="is-evidence-link"><span>17</span><p><strong>Note 17 · Revenue</strong><small>Current PDF evidence · 7 rows</small></p><b>Linked</b></div>
      </div>
      <div className="tour-step-status"><i />PDF structure is ready for review</div>
    </div>;
  }

  if (step === "setup") {
    return <div className="tour-step-content tour-setup" key={step}>
      <div className="tour-setup-grid">
        <div><small>Entity name</small><strong>Sample Company Pte. Ltd.</strong></div>
        <div><small>UEN</small><strong>2019•••••N</strong></div>
        <div><small>Reporting period</small><strong>31 Dec 2025</strong></div>
        <div><small>Presentation currency</small><strong>SGD</strong></div>
        <div><small>Filing type</small><strong>Full XBRL</strong></div>
        <div><small>Reporting level</small><strong>Consolidated</strong></div>
      </div>
      <div className="tour-ready-card"><span>✓</span><div><strong>Ready for AI tagging</strong><small>Scope and report structure confirmed</small></div></div>
    </div>;
  }

  if (step === "tag") {
    return <div className="tour-step-content tour-tag" key={step}>
      <div className="tour-tag-head"><span>Filing item</span><span>Current year</span><span>Prior year</span><span>Status</span></div>
      <div className="tour-tag-grid">
        <div className="tour-tag-row" style={{ "--tour-delay": "400ms" } as React.CSSProperties}>
          <p><strong>Revenue</strong><small>Evidence · Note 17</small></p><span>6,389</span><span>5,742</span><b>AI matched</b>
        </div>
        <div className="tour-tag-row" style={{ "--tour-delay": "1100ms" } as React.CSSProperties}>
          <p><strong>Profit before tax</strong><small>Evidence · Page 8</small></p><span>1,126</span><span>984</span><b>AI matched</b>
        </div>
        <div className="tour-tag-row" style={{ "--tour-delay": "1800ms" } as React.CSSProperties}>
          <p><strong>Cash and cash equivalents</strong><small>Evidence · Page 7</small></p><span>3,764</span><span>3,120</span><b>AI matched</b>
        </div>
        <div className="tour-tag-row" style={{ "--tour-delay": "2500ms" } as React.CSSProperties}>
          <p><strong>Total assets</strong><small>Evidence · Page 7</small></p><span>12,480</span><span>10,960</span><b>AI matched</b>
        </div>
        <div className="tour-tag-row" style={{ "--tour-delay": "3200ms" } as React.CSSProperties}>
          <p><strong>Total liabilities</strong><small>Evidence · Page 7</small></p><span>4,790</span><span>4,215</span><b>AI matched</b>
        </div>
        <div className="tour-tag-row" style={{ "--tour-delay": "3900ms" } as React.CSSProperties}>
          <p><strong>Total equity</strong><small>Evidence · Page 7</small></p><span>7,690</span><span>6,745</span><b>AI matched</b>
        </div>
      </div>
    </div>;
  }

  if (step === "validate") {
    return <div className="tour-step-content tour-validate" key={step}>
      <div className="tour-validation-summary"><span>✓</span><div><strong>Ready for preview</strong><small>No blocking issues found</small></div></div>
      <div className="tour-validation-list">
        {["Current ACRA taxonomy", "Calculation relationships", "Current and comparative periods", "Cross-statement consistency", "Mandatory disclosures", "Units and rounding"].map((label) => (
          <div key={label}><span>✓</span><strong>{label}</strong><small>Passed</small></div>
        ))}
      </div>
    </div>;
  }

  if (step === "preview") {
    return <div className="tour-step-content tour-preview" key={step}>
      <div className="tour-preview-sheet">
        <header><strong>Statement of financial position</strong><small>31 December 2025 · SGD '000</small></header>
        <div><span>Assets</span><b>2025</b><b>2024</b></div>
        <p><span>Property, plant and equipment</span><b>4,820</b><b>4,260</b></p>
        <p><span>Trade and other receivables</span><b>2,148</b><b>1,996</b></p>
        <p><span>Cash and cash equivalents</span><b>3,764</b><b>3,120</b></p>
        <p><span>Other current assets</span><b>1,748</b><b>1,584</b></p>
        <p className="is-subtotal"><span>Total assets</span><b>12,480</b><b>10,960</b></p>
        <p className="is-section"><span>Equity</span><b /><b /></p>
        <p><span>Share capital</span><b>5,000</b><b>5,000</b></p>
        <p><span>Retained earnings</span><b>2,690</b><b>1,745</b></p>
        <p className="is-subtotal"><span>Total equity</span><b>7,690</b><b>6,745</b></p>
        <p className="is-section"><span>Liabilities</span><b /><b /></p>
        <p><span>Trade and other payables</span><b>2,420</b><b>2,110</b></p>
        <p><span>Borrowings</span><b>2,370</b><b>2,105</b></p>
        <p className="is-subtotal"><span>Total liabilities</span><b>4,790</b><b>4,215</b></p>
        <p className="is-total"><span>Total equity and liabilities</span><b>12,480</b><b>10,960</b></p>
      </div>
    </div>;
  }

  return <div className="tour-step-content tour-export" key={step}>
    <div className="tour-package-icon"><span>ZIP</span><i>✓</i></div>
    <strong className="tour-package-title">ACRA_2025_Filing.zip</strong>
    <div className="tour-package-files">
      <span>Instance document</span><span>Presentation</span><span>Calculation</span><span>Definition</span><span>Labels</span>
    </div>
    <div className="tour-export-action">Save filing package <span>→</span></div>
  </div>;
}

function PrinciplesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const current = productTourSteps[activeStep];

  useEffect(() => {
    const nav = stepsRef.current;
    const active = nav?.querySelector<HTMLButtonElement>("button.is-active");
    if (!nav || !active) return;
    nav.scrollTo({
      left: active.offsetLeft - ((nav.clientWidth - active.clientWidth) / 2),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [activeStep]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let frame = 0;
    const updateVisibility = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        setIsVisible(rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.15);
      });
    };
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || !isVisible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => {
      setActiveStep((step) => (step + 1) % productTourSteps.length);
    }, productTourDurations[current.key]);
    return () => window.clearTimeout(timer);
  }, [current.key, isAutoPlaying, isVisible]);

  return (
    <section ref={sectionRef} className="home-panel principles-panel product-tour-panel" id="principles" aria-labelledby="principles-title">
      <div className="page-width home-panel-inner product-tour-inner">
        <header className="home-panel-heading product-tour-heading">
          <div><p className="eyebrow">Product walkthrough</p><h2 id="principles-title">From PDF to reviewable XBRL.</h2></div>
        </header>
        <div className="product-tour-window" data-step={current.key}>
          <nav ref={stepsRef} className="product-tour-steps" aria-label="Product walkthrough steps">
            {productTourSteps.map((step, index) => <button
              type="button"
              className={index === activeStep ? "is-active" : index < activeStep ? "is-complete" : ""}
              aria-current={index === activeStep ? "step" : undefined}
              onClick={() => {
                setIsAutoPlaying(false);
                setActiveStep(index);
              }}
              key={step.key}
            ><span>{index + 1}</span>{step.label}</button>)}
          </nav>
          <div className="product-tour-workspace">
            <div className="tour-pdf-pane" aria-label="Source PDF">
              <div className="tour-pdf-page">
                <small>FINANCIAL STATEMENTS</small>
                <div className="tour-source-heading"><h3>Note 17 · Revenue</h3></div>
                <p className="tour-pdf-copy">Revenue recognised during the financial year comprises:</p>
                <div className="tour-pdf-table">
                  <div><span>SGD '000</span><b>2025</b><b>2024</b></div>
                  <p className="is-section"><span>Revenue from contracts with customers</span><b>6,359</b><b>5,722</b></p>
                  <p className={`is-detail${current.key === "tag" ? " is-highlighted" : ""}`}><span>Rendering of services</span><b>4,261</b><b>3,918</b></p>
                  <p className={`is-detail${current.key === "tag" ? " is-highlighted is-second" : ""}`}><span>Subscription revenue</span><b>1,842</b><b>1,604</b></p>
                  <p className="is-detail"><span>Implementation fees</span><b>176</b><b>140</b></p>
                  <p className="is-detail"><span>Maintenance and support</span><b>80</b><b>60</b></p>
                  <p><span>Other revenue</span><b>30</b><b>20</b></p>
                  <p className="is-total"><span>Total revenue</span><b>6,389</b><b>5,742</b></p>
                </div>
              </div>
            </div>
            <div className="tour-detail-pane" aria-live="polite"><TourStepContent step={current.key} /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomePricingSection() {
  return (
    <section className="home-panel home-pricing" id="pricing" aria-labelledby="home-pricing-title">
      <div className="page-width home-panel-inner">
        <header className="home-panel-heading">
          <p className="eyebrow">AI Credits pricing</p>
          <h2 id="home-pricing-title">Credits for AI work.</h2>
        </header>
        <div className="home-price-grid" aria-label="AI Credits packs">
          {creditPacks.map((pack) => (
            <article className="home-price-card" key={pack.name}>
              <span>{pack.name}</span>
              <div><strong>{pack.credits}</strong><small>AI Credits</small></div>
              <p><b>{pack.price}</b><small>USD · one-time purchase</small></p>
            </article>
          ))}
        </div>
        <div className="home-price-rules">
          <span><strong>Never expire</strong>Purchased Credits</span>
          <span><strong>Shown before use</strong>AI Credit estimate</span>
          <span><strong>0 Credits</strong>Facts · validation · preview · export</span>
          <span className="home-price-typical-use">
            <strong>Typical AI use</strong>
            <small>Simplified 20 Credits · Full 60 Credits</small>
          </span>
        </div>
      </div>
    </section>
  );
}

function MeetSection() {
  const account = useAccount();

  return (
    <section className="home-panel meet-panel" id="meet" aria-labelledby="meet-title">
      <div className="page-width home-panel-inner">
        <header className="home-panel-heading meet-heading">
          <div>
            <p className="eyebrow">{account.status === "signed-in" ? "Meet the founder" : "Early access"}</p>
            <h2 id="meet-title">
              {account.status === "signed-in" ? "Book 30 minutes with the founder." : "Start exploring. Keep the conversation open."}
            </h2>
          </div>
          {account.status === "signed-in" ? <span className="meet-account"><i aria-hidden="true" />{account.account.email}</span> : null}
        </header>
        {account.status === "loading" ? (
          <div className="meet-loading" aria-live="polite">Checking account…</div>
        ) : account.status === "signed-in" ? (
          <div className="calendar-frame">
            <iframe
              title="Book a FinStates product conversation with the founder"
              src={`https://cal.com/wei-zhou-finstates-app/30min?embed=true&layout=month_view&theme=light&email=${encodeURIComponent(account.account.email)}`}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="meet-gate">
            <div className="meet-benefits" aria-label="Early access benefits">
              <article><strong>200 Credits</strong><p>Included when you start using the Desktop app.</p></article>
              <article><strong>Talk with the founder</strong><p>Book a 30-minute conversation anytime.</p></article>
            </div>
            <a className="launch-cta" href="/register/">Get early access <span aria-hidden="true">→</span></a>
          </div>
        )}
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <PageFrame>
      <main id="main-content">
        <Hero />
        <PrinciplesSection />
        <HomePricingSection />
        <MeetSection />
      </main>
    </PageFrame>
  );
}

function ContentPage({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <PageFrame>
      <main id="main-content" className="content-page page-width">
        <header className="content-page-header"><p className="eyebrow">{label}</p><h1>{title}</h1></header>
        <div className="prose">{children}</div>
      </main>
    </PageFrame>
  );
}

function SupportPage() {
  return (
    <ContentPage label="Contact" title="Support and company enquiries">
      <p className="prose-lead">FinStates is in active development and is not yet available for public download.</p>
      <section><h2>Email</h2><p><a href={`mailto:${site.email}`}>{site.email}</a></p><p>Product, business, security and developer programme verification enquiries are welcome.</p></section>
      <section><h2>Company</h2><p><strong>{site.operator}</strong></p><address>{site.address.map((line) => <span key={line}>{line}</span>)}</address></section>
      <section><h2>Product status</h2><p>The FinStates desktop application and its first ACRA 2026 XBRL filing workflow are under active development. Public downloads will only be linked from this website after validation, signing and publication.</p></section>
    </ContentPage>
  );
}

function RegistrationPage() {
  const account = useAccount();
  const [email, setEmail] = useState("");
  const [productUpdates, setProductUpdates] = useState(false);
  const [state, setState] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const signOut = async () => {
    setMessage("");
    try {
      await account.signOut();
      setState("idle");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn’t sign you out. Please try again.");
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || state === "submitting") return;
    setState("submitting");
    setMessage("");
    try {
      const response = await fetch(`${apiBase}/early-access/registrations`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), productUpdates }),
      });
      const body = await response.json().catch(() => null) as {
        error?: { message?: string; retryAfterSeconds?: number };
      } | null;
      if (!response.ok) throw new Error(body?.error?.message ?? "We couldn’t start registration. Please try again.");
      setState("sent");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn’t start registration. Please try again.");
      setState("error");
    }
  };

  return (
    <PageFrame>
      <main id="main-content" className="conversion-page page-width">
        <section className="conversion-copy" aria-labelledby="registration-title">
          <p className="eyebrow">Early access</p>
          <h1 id="registration-title">{account.status === "signed-in" ? "Your FinStates account." : "Join early access."}</h1>
        </section>
        <div className="conversion-benefits" aria-label="Registration benefits">
          <article className="registration-benefit">
            <strong><b>200</b><span>Credits</span></strong>
            <p>First Desktop sign-in</p>
          </article>
          <article className="registration-benefit">
            <strong><b>30 min</b><span>With the founder</span></strong>
            <p>Available after sign-in</p>
          </article>
        </div>
        <section className="registration-card" aria-label="Early access registration form">
          {account.status === "signed-in" ? (
            <div className="form-result account-result" role="status">
              <span className="form-result-icon">✓</span>
              <p className="eyebrow">Signed in</p>
              <h2>You’re signed in.</h2>
              <p><strong>{account.account.email}</strong></p>
              {message ? <p className="form-error" role="alert">{message}</p> : null}
              <button className="button-secondary" type="button" onClick={() => void signOut()}>Sign out</button>
            </div>
          ) : state === "sent" ? (
            <div className="form-result" role="status">
              <span className="form-result-icon">✓</span>
              <h2>Check your email.</h2>
              <p>We sent a confirmation link to <strong>{email.trim()}</strong>. Open it within 24 hours to create or sign in to your account.</p>
              <button className="button-secondary" type="button" onClick={() => setState("idle")}>Use another email</button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="form-heading">
                <h2>Register or sign in</h2>
              </div>
              <label className="field-label" htmlFor="registration-email">Email</label>
              <input
                className="text-input"
                id="registration-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => { setEmail(event.target.value); setState("idle"); setMessage(""); }}
                placeholder="you@company.com"
              />
              <label className="checkbox-field">
                <input type="checkbox" checked={productUpdates} onChange={(event) => setProductUpdates(event.target.checked)} />
                <span className="checkbox-copy">
                  <strong>News, tips, and offers</strong>
                  <span>Be the first to know what’s new and what’s worth checking out.</span>
                </span>
              </label>
              {state === "error" ? <p className="form-error" role="alert">{message}</p> : null}
              <button className="button-primary" type="submit" disabled={state === "submitting"}>
                {state === "submitting" ? "Sending…" : "Continue with email"}
              </button>
              <p className="form-legal">By continuing, you agree to the <a href="/terms/">Website Terms</a> and acknowledge the <a href="/privacy/">Privacy Notice</a>.</p>
            </form>
          )}
        </section>
      </main>
    </PageFrame>
  );
}

function RegistrationConfirmPage() {
  const account = useAccount();
  const [state, setState] = useState<"ready" | "submitting" | "confirmed" | "invalid">("ready");
  const [email, setEmail] = useState("");
  const token = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token") ?? "";

  useEffect(() => {
    if (!token) setState("invalid");
  }, [token]);

  const confirm = async () => {
    if (!token || state === "submitting") return;
    setState("submitting");
    try {
      const response = await fetch(`${apiBase}/early-access/registrations/confirm`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await response.json().catch(() => null) as { email?: string } | null;
      if (!response.ok || !body?.email) throw new Error("invalid");
      setEmail(body.email);
      await account.refresh();
      window.history.replaceState(null, "", window.location.pathname);
      setState("confirmed");
    } catch {
      setState("invalid");
    }
  };

  return (
    <PageFrame>
      <main id="main-content" className="confirmation-page page-width">
        <section className="confirmation-card">
          {state === "confirmed" ? (
            <>
              <span className="form-result-icon">✓</span>
              <p className="eyebrow">Account confirmed</p>
              <h1>You’re registered and signed in.</h1>
              <p><strong>{email}</strong> is now your FinStates account email. This browser is signed in, and the account indicator will remain visible in the navigation.</p>
              <div className="confirmation-actions"><a className="button-primary" href="/register/">View my account</a><a className="button-secondary" href="/">Return home</a></div>
            </>
          ) : state === "invalid" ? (
            <>
              <p className="eyebrow">Confirmation link</p>
              <h1>This link is invalid or has expired.</h1>
              <p>Request a new confirmation email to continue.</p>
              <a className="button-primary" href="/register/">Return to registration</a>
            </>
          ) : (
            <>
              <p className="eyebrow">Confirm your email</p>
              <h1>Create your FinStates account.</h1>
              <p>This confirms your email, registers your early access account and signs this browser in.</p>
              <button className="button-primary" type="button" onClick={() => void confirm()} disabled={state === "submitting"}>
                {state === "submitting" ? "Confirming…" : "Confirm early access"}
              </button>
            </>
          )}
        </section>
      </main>
    </PageFrame>
  );
}

function PricingPage() {
  return (
    <PageFrame>
      <main id="main-content" className="pricing-page page-width">
        <header className="pricing-header">
          <p className="eyebrow">Credits pricing</p>
          <h1>Pay for the AI work you use.</h1>
          <p>FinStates keeps local Facts, validation, preview and export available without Credits. Credits cover AI report identification, structure recognition and automatic tagging.</p>
        </header>
        <section className="pricing-grid" aria-label="AI Credits packs">
          {creditPacks.map((pack) => (
            <article className="price-card" key={pack.name}>
              <span>{pack.name}</span>
              <strong>{pack.credits}</strong>
              <p>AI Credits</p>
              <b>{pack.price}</b>
              <small>USD · one-time purchase</small>
            </article>
          ))}
        </section>
        <section className="pricing-details" aria-labelledby="pricing-details-title">
          <div><p className="eyebrow">How it works</p><h2 id="pricing-details-title">Clear before every AI action.</h2></div>
          <dl>
            <div><dt>Purchased Credits</dt><dd>Never expire. Packs use the same models and processing quality.</dd></div>
            <div><dt>Usage</dt><dd>Varies by report length and complexity. FinStates shows an estimate before processing and charges actual successful usage.</dd></div>
            <div><dt>Report capacity</dt><dd>Any completed Credits purchase increases simultaneous report processing capacity from one report to up to five.</dd></div>
            <div><dt>MinerU parsing</dt><dd>Does not consume Credits or create a separate page balance. Account processing limits still apply.</dd></div>
          </dl>
        </section>
        <section className="pricing-cta">
          <div><p className="eyebrow">Before launch</p><h2>Register now. Start with 200 promotional Credits.</h2><p>They are granted when you first sign in to the released desktop app and expire 30 days later.</p></div>
          <a className="button-primary" href="/register/">Get early access</a>
        </section>
        <p className="pricing-note">Purchases will be available through the Apple App Store and Microsoft Store after FinStates is released. The applicable store presents the final local price and transaction terms.</p>
      </main>
    </PageFrame>
  );
}

function PrivacyPage() {
  return (
    <ContentPage label="Privacy" title="Website privacy notice">
      <p className="prose-meta">Last updated: 24 August 2026</p>
      <p className="prose-lead">This notice describes the public FinStates website at finstates.app.</p>
      <section><h2>Account and early access information</h2><p>When you register, we process your email address, confirmation status, early access status and, if selected, your consent to receive news, tips and offers. Your verified email becomes your FinStates account identity and can later be used to sign in to the desktop app. Confirming your email creates a website session so you can see that you are signed in.</p></section>
      <section><h2>Security and service delivery</h2><p>We process limited technical request data to deliver and protect the website and registration service. Confirmation tokens are stored only as protected hashes with expiry and consumption records. Hosting, network and email providers process the information needed to deliver these services. The website uses a strictly necessary, secure session cookie for account status and sign-out. It does not accept document uploads or run advertising trackers.</p></section>
      <section><h2>Website analytics</h2><p>We use Umami Cloud and Microsoft Clarity to understand and improve the public website. Umami provides cookieless, aggregated traffic information such as pages visited, referral source, country or region, browser, operating system and device type. Clarity uses analytics cookies and may record interactions such as clicks, scrolling and page views to produce heatmaps and session replays. We do not associate this analytics data with your FinStates account email.</p></section>
      <section><h2>When you contact us</h2><p>If you email us, we use the contact details and message content you provide to respond, maintain necessary correspondence and protect our services. We do not sell personal information received through company correspondence.</p></section>
      <section><h2>News, tips and offers</h2><p>If you separately select news, tips and offers, we may use your email to send occasional FinStates product news, guidance and promotions. You can withdraw that choice by contacting us. Account confirmation, security and requested availability notices may still be sent as service messages.</p></section>
      <section><h2>Retention and choices</h2><p>We retain account and early access records as needed to provide the requested account, operate promotions, prevent abuse and meet legal obligations. You can ask about your information or request correction or deletion by contacting us, subject to records we must retain.</p></section>
      <section><h2>Contact</h2><p>Questions can be sent to <a href={`mailto:${site.email}`}>{site.email}</a>.</p><p>{site.operator}, Shenzhen, Guangdong, China.</p></section>
    </ContentPage>
  );
}

function TermsPage() {
  return (
    <ContentPage label="Terms" title="Website terms of use">
      <p className="prose-meta">Last updated: 23 August 2026</p>
      <p className="prose-lead">These terms apply to the public FinStates website. Product licence terms will be provided separately when FinStates is released.</p>
      <section><h2>Website purpose</h2><p>This website provides factual information about FinStates, its developer and its current development status. Features described as in development are not an offer, purchase commitment or promise of a release date.</p></section>
      <section><h2>Early access registration</h2><p>Confirming your email creates a FinStates account and records your interest in early access. It does not guarantee a test invitation, product availability or a release date. Promotional Credits are subject to the amount, activation condition and validity period shown when you register.</p></section>
      <section><h2>Pricing</h2><p>Website pricing describes the current planned Credits packs. Purchases are not available until enabled in a released app. The applicable app store presents the final local price, taxes and transaction terms before purchase.</p></section>
      <section><h2>No professional advice</h2><p>Website content is general product information. It is not accounting, legal, investment, tax or filing advice and does not replace professional judgment or official guidance.</p></section>
      <section><h2>Intellectual property</h2><p>The FinStates name, branding, website content and product materials are owned by {site.operator} or used with permission. Third-party names and standards remain the property of their respective owners.</p></section>
      <section><h2>Availability and changes</h2><p>We may correct, update or remove website content as the product develops. We do not guarantee uninterrupted availability of the public website.</p></section>
      <section><h2>Contact</h2><p>Questions can be sent to <a href={`mailto:${site.email}`}>{site.email}</a>.</p></section>
    </ContentPage>
  );
}

function NotFoundPage() {
  return <ContentPage label="404" title="Page not found"><p className="prose-lead">The page you requested does not exist.</p><p><a href="/">Return to the FinStates homepage →</a></p></ContentPage>;
}

function resolvePage() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return <HomePage />;
  if (path === "/support") return <SupportPage />;
  if (path === "/register") return <RegistrationPage />;
  if (path === "/register/confirm") return <RegistrationConfirmPage />;
  if (path === "/pricing") return <HomePage />;
  if (path === "/privacy") return <PrivacyPage />;
  if (path === "/terms") return <TermsPage />;
  return <NotFoundPage />;
}

syncDocumentThemeColor();

createRoot(document.getElementById("root")!).render(
  <StrictMode><SiteAnalytics /><AccountProvider>{resolvePage()}</AccountProvider></StrictMode>,
);
