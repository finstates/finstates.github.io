import {
  StrictMode,
  createContext,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { getCalApi } from "@calcom/embed-react";
import Clarity from "@microsoft/clarity";
import brandIconUrl from "./assets/icon-only.png";
import "./design-tokens.css";
import "./styles.css";
import "./hero.css";

const site = {
  name: "FinStates",
  email: "support@finstates.app",
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
  creditsBalance: number;
  accountStatus: "free" | "paid";
  processingSlotsUsed: number;
  processingSlotsLimit: number;
  processingReports: Array<{
    slotId: string;
    taskId: string;
    fileName: string;
    status: "occupied" | "cooldown";
    occupiedAt: string;
    cooldownUntil: string | null;
  }>;
  reportPageLimitExclusive: number | null;
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
  { name: "Small", credits: "200", price: "$19", recommended: false },
  { name: "Medium", credits: "600", price: "$50", recommended: true },
  { name: "Large", credits: "2,000", price: "$150", recommended: false },
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
  const isAccountRoute = window.location.pathname.startsWith("/account");
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
          <span className="brand-icon brand-icon-animated" aria-hidden="true">
            <img className="brand-icon-bee" src={brandIconUrl} alt="" />
          </span>
          <span>Fin<span className="brand-accent">States</span></span>
        </a>
        {!isRegistrationRoute ? <nav className="header-actions" aria-label="Primary navigation">
          {account.status === "signed-in" ? (
            isAccountRoute ? (
              <span className="header-account" title={account.account.email} aria-label={`Signed in as ${account.account.email}`}>
                <span className="status-dot" aria-hidden="true" />
                <span>{account.account.email}</span>
              </span>
            ) : (
              <a className="header-account" href="/account/" title={account.account.email}>
                <span className="status-dot" aria-hidden="true" />
                <span>{account.account.email}</span>
              </a>
            )
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

function ConverterHeroVisual() {
  const reportFacts = [
    { label: "Entity name", value: "Northstar Holdings", period: "—", unit: "—", type: "Text" },
    { label: "Entity identifier", value: "FS-204810", period: "—", unit: "—", type: "Identifier" },
    { label: "Period end", value: "2025-12-31", period: "—", unit: "—", type: "Date" },
    { label: "Reporting currency", value: "SGD", period: "FY 2025", unit: "—", type: "Currency" },
    { label: "Total revenue", value: "3,725", period: "FY 2025", unit: "SGD 'M", type: "Monetary" },
    { label: "Rental income", value: "1,021", period: "FY 2025", unit: "SGD 'M", type: "Monetary" },
    { label: "Management fee income", value: "990", period: "FY 2025", unit: "SGD 'M", type: "Monetary" },
    { label: "Revenue disclosure", value: "Disaggregated by activity", period: "FY 2025", unit: "—", type: "Text block" },
  ] as const;
  const factStyle = (index: number) => ({ "--delay": `${index * 1.9}s` }) as CSSProperties;

  return (
    <div
      className="conversion-demo"
      role="img"
      aria-label="Animation showing AI converting a dense financial report note with paragraphs, comparative tables and footnotes into a clean table of structured filing facts."
    >
      <div className="conversion-stage" aria-hidden="true">
        <article className="source-sheet">
          <header className="source-running-header">
            <strong>Notes to the Financial Statements</strong>
            <small className="source-fact" style={factStyle(2)}>For the financial year ended 31 December 2025</small>
          </header>

          <section className="source-note">
            <h3><b>24</b><span>Revenue</span></h3>
            <p className="source-intro">Revenue of the Group is analysed as follows:</p>

            <table className="source-note-table">
              <thead>
                <tr>
                  <th />
                  <th>The Group</th>
                  <th className="source-fact" style={factStyle(3)}>2025<br /><small>SGD 'M</small></th>
                  <th>2024<br /><small>SGD 'M</small></th>
                </tr>
              </thead>
              <tbody>
                <tr><th>Revenue from contracts with customers</th><td /><td>1,188</td><td>999</td></tr>
                <tr className="source-fact" style={factStyle(5)}><th>Rental and related income from investment properties</th><td /><td>1,021</td><td>1,067</td></tr>
                <tr className="source-fact" style={factStyle(6)}><th>Investment and management fee income</th><td /><td>990</td><td>801</td></tr>
                <tr><th>Lodging management fee income</th><td /><td>316</td><td>302</td></tr>
                <tr><th>Other operating income</th><td /><td>210</td><td>(14)</td></tr>
                <tr className="source-total source-fact" style={factStyle(4)}><th>Total revenue</th><td /><td>3,725</td><td>3,155</td></tr>
              </tbody>
            </table>

            <div className="source-footnotes">
              <p className="source-fact" style={factStyle(7)}><b>(a)</b><span>Revenue is disaggregated by operating activity and the timing of recognition. Variable consideration is included only when it is highly probable that a significant reversal will not occur.</span></p>
              <p><b>(b)</b><span>Amounts are recognised net of rebates and other directly attributable adjustments.</span></p>
            </div>
          </section>

          <footer className="source-page-footer">
            <span className="source-fact" style={factStyle(0)}>Northstar Holdings</span>
            <small className="source-fact" style={factStyle(1)}>Company No. FS-204810</small>
            <b>144</b>
          </footer>
        </article>

        <div className="conversion-engine">
          <div className="conversion-rotor">
            <i className="conversion-rotor-ring" />
            <i className="conversion-rotor-orbit" />
            <div className="conversion-engine-word"><strong>AI</strong></div>
          </div>
          <small>Converter</small>
        </div>

        <article className="filing-sheet">
          <table className="filing-table">
            <thead>
              <tr><th>Fact</th><th>Value</th><th>Period</th><th>Unit</th></tr>
            </thead>
            <tbody>
              {reportFacts.map((fact, index) => (
                <tr className="filing-fact" key={fact.label} style={factStyle(index)}>
                  <th><strong>{fact.label}</strong><small>{fact.type}</small></th>
                  <td>{fact.value}</td>
                  <td>{fact.period}</td>
                  <td>{fact.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>
    </div>
  );
}

function Hero() {
  useLayoutEffect(() => {
    const logo = document.querySelector<HTMLElement>(".site-header .brand-icon");
    const brand = logo?.closest<HTMLElement>(".brand");
    const button = document.querySelector<HTMLElement>(".hero-cta");
    if (!logo || !brand || !button) return;

    const propertyNames = [
      "--hero-bee-start-x", "--hero-bee-start-y",
      "--hero-bee-in-1-x", "--hero-bee-in-1-y",
      "--hero-bee-in-2-x", "--hero-bee-in-2-y",
      "--hero-bee-in-3-x", "--hero-bee-in-3-y",
      "--hero-bee-button-x", "--hero-bee-button-y",
      "--hero-bee-out-1-x", "--hero-bee-out-1-y",
      "--hero-bee-out-2-x", "--hero-bee-out-2-y",
      "--hero-bee-out-3-x", "--hero-bee-out-3-y",
    ] as const;

    const quadraticPoint = (
      start: readonly [number, number],
      control: readonly [number, number],
      end: readonly [number, number],
      progress: number,
    ) => {
      const inverse = 1 - progress;
      return [
        (inverse * inverse * start[0]) + (2 * inverse * progress * control[0]) + (progress * progress * end[0]),
        (inverse * inverse * start[1]) + (2 * inverse * progress * control[1]) + (progress * progress * end[1]),
      ] as const;
    };

    const setTrajectory = () => {
      const brandRect = brand.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const logoCenter = [
        brandRect.left + (logo.offsetWidth / 2),
        brandRect.top + (brandRect.height / 2),
      ] as const;
      const buttonPoint = [
        buttonRect.left + (buttonRect.width / 2) - logoCenter[0],
        buttonRect.top - (logo.offsetHeight * 0.62) - logoCenter[1],
      ] as const;
      const startPoint = [
        window.innerWidth + logo.offsetWidth - logoCenter[0],
        Math.max(buttonPoint[1] * 0.42, logo.offsetHeight * 3),
      ] as const;
      const arrivalControl = [
        (startPoint[0] + buttonPoint[0]) / 2,
        buttonPoint[1] + Math.min(window.innerHeight * 0.22, 180),
      ] as const;
      const departureControl = [buttonPoint[0] * 0.48, Math.max(window.innerHeight * 0.04, 24)] as const;
      const arrivalPoints = [0.25, 0.5, 0.75].map((progress) =>
        quadraticPoint(startPoint, arrivalControl, buttonPoint, progress));
      const departurePoints = [0.25, 0.5, 0.75].map((progress) =>
        quadraticPoint(buttonPoint, departureControl, [0, 0], progress));
      const values = [
        ...startPoint,
        ...arrivalPoints.flat(),
        ...buttonPoint,
        ...departurePoints.flat(),
      ];

      propertyNames.forEach((propertyName, index) => {
        logo.style.setProperty(propertyName, `${values[index].toFixed(2)}px`);
      });
    };

    setTrajectory();
    const animationFrame = window.requestAnimationFrame(setTrajectory);
    window.addEventListener("resize", setTrajectory);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", setTrajectory);
      propertyNames.forEach((propertyName) => logo.style.removeProperty(propertyName));
    };
  }, []);

  return (
    <section className="launch-hero hero-refined" id="product" aria-labelledby="page-title">
      <div className="page-width launch-hero-inner">
        <div className="launch-hero-copy">
          <p className="hero-audience">For accounting firms, finance teams, and company secretaries</p>
          <h1 className="hero-title-focus" id="page-title">XBRL Conversion &amp; Tagging</h1>
          <div className="hero-product-meta">
            <span className="hero-desktop-label">AI-Assisted Desktop Software</span>
            <span className="hero-platforms" aria-label="Desktop platforms: macOS and Windows">
              <svg className="hero-platform-icon hero-platform-apple" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 8.53 7.31c1.22.07 2.07.67 2.79.72 1.08-.22 2.11-.85 3.37-.77 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.42 4.08h-.01ZM12.03 6.36c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
              </svg>
              <svg className="hero-platform-icon hero-platform-windows" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 4.1 11 2.85v8.65H2V4.1Zm10-1.39L22 1.3v10.2H12V2.71ZM2 12.5h9v8.65L2 19.9v-7.4Zm10 0h10v10.2l-10-1.41V12.5Z" />
              </svg>
            </span>
          </div>
          <a className="launch-cta hero-cta" href="/register/">
            Get early access
            <svg className="hero-cta-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
        <ConverterHeroVisual />
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

const supportedStandards = [
  { key: "singapore", country: "Singapore", standard: "ACRA 2026", flag: "/flags/singapore.svg" },
  { key: "malaysia", country: "Malaysia", standard: "SSM MBRS 2.0", flag: "/flags/malaysia.svg" },
] as const;

type SupportedCountry = typeof supportedStandards[number]["key"];

const productTourDurations: Record<ProductTourStep, number> = {
  extract: 4200,
  setup: 3800,
  tag: 6000,
  validate: 4200,
  preview: 3600,
  export: 4200,
};

function TourStepContent({ step, country }: { step: ProductTourStep; country: SupportedCountry }) {
  const countryConfig = country === "singapore"
    ? {
      entityName: "Sample Company Pte. Ltd.",
      identifierLabel: "UEN",
      identifierValue: "2019•••••N",
      currency: "SGD",
      filingWorkflow: "ACRA XBRL",
      validationLabels: ["ACRA filing requirements", "Calculation relationships", "Current and comparative periods", "Cross-statement consistency", "Mandatory disclosures", "Units and rounding"],
      packageName: "Singapore_Filing.zip",
      packageFiles: ["Instance document", "Presentation", "Calculation", "Definition", "Labels"],
    }
    : {
      entityName: "Sample Company Sdn. Bhd.",
      identifierLabel: "Registration no.",
      identifierValue: "201901••••••",
      currency: "MYR",
      filingWorkflow: "SSM MBRS",
      validationLabels: ["SSM filing requirements", "Profile eligibility", "Required supporting files", "Calculation relationships", "Current and comparative periods", "Units and rounding"],
      packageName: "Malaysia_Filing.zip",
      packageFiles: ["XBRL ZIP", "Review copy", "Supporting-file checklist"],
    };

  if (step === "extract") {
    return <div className="tour-step-content tour-extract" key={`${country}-${step}`}>
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
    return <div className="tour-step-content tour-setup" key={`${country}-${step}`}>
      <div className="tour-setup-grid">
        <div><small>Entity name</small><strong>{countryConfig.entityName}</strong></div>
        <div><small>{countryConfig.identifierLabel}</small><strong>{countryConfig.identifierValue}</strong></div>
        <div><small>Reporting period</small><strong>31 Dec 2025</strong></div>
        <div><small>Presentation currency</small><strong>{countryConfig.currency}</strong></div>
        <div><small>Filing workflow</small><strong>{countryConfig.filingWorkflow}</strong></div>
        <div><small>Reporting level</small><strong>Consolidated</strong></div>
      </div>
      <div className="tour-ready-card"><span>✓</span><div><strong>Ready for AI tagging</strong><small>Scope and report structure confirmed</small></div></div>
    </div>;
  }

  if (step === "tag") {
    return <div className="tour-step-content tour-tag" key={`${country}-${step}`}>
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
    return <div className="tour-step-content tour-validate" key={`${country}-${step}`}>
      <div className="tour-validation-summary"><span>✓</span><div><strong>Ready for preview</strong><small>No blocking issues found</small></div></div>
      <div className="tour-validation-list">
        {countryConfig.validationLabels.map((label) => (
          <div key={label}><span>✓</span><strong>{label}</strong><small>Passed</small></div>
        ))}
      </div>
    </div>;
  }

  if (step === "preview") {
    return <div className="tour-step-content tour-preview" key={`${country}-${step}`}>
      <div className="tour-preview-sheet">
        <header><strong>Statement of financial position</strong><small>31 December 2025 · {countryConfig.currency} '000</small></header>
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

  return <div className="tour-step-content tour-export" key={`${country}-${step}`}>
    <div className="tour-package-icon"><span>ZIP</span><i>✓</i></div>
    <strong className="tour-package-title">{countryConfig.packageName}</strong>
    <div className="tour-package-files">
      {countryConfig.packageFiles.map((file) => <span key={file}>{file}</span>)}
    </div>
    <div className="tour-export-action">Save filing package <span>→</span></div>
  </div>;
}

function PrinciplesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLElement>(null);
  const [country, setCountry] = useState<SupportedCountry>("singapore");
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const current = productTourSteps[activeStep];
  const presentationCurrency = country === "singapore" ? "SGD" : "MYR";

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
        <header className="standard-picker">
          <h2 id="principles-title">From signed PDFs to review-ready XBRL.</h2>
          <div className="standard-switch" aria-label="Supported filing standards">
            {supportedStandards.map((option) => <button
              type="button"
              aria-label={`${option.country} — ${option.standard}`}
              aria-pressed={country === option.key}
              className={`standard-option${country === option.key ? " is-active" : ""}`}
              onClick={() => {
                setIsAutoPlaying(false);
                setCountry(option.key);
              }}
              key={option.key}
            ><img src={option.flag} alt="" aria-hidden="true" /><strong>{option.standard}</strong></button>)}
          </div>
        </header>
        <div className="product-tour-window" data-step={current.key} data-country={country}>
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
                  <div><span>{presentationCurrency} '000</span><b>2025</b><b>2024</b></div>
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
            <div className="tour-detail-pane" aria-live="polite"><TourStepContent step={current.key} country={country} /></div>
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
            <article className={`home-price-card${pack.recommended ? " is-recommended" : ""}`} key={pack.name}>
              <span>{pack.name}</span>
              {pack.recommended && <span className="home-price-badge">Most popular</span>}
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

function HomePage() {
  return (
    <PageFrame>
      <main id="main-content">
        <Hero />
        <PrinciplesSection />
        <HomePricingSection />
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
    <ContentPage label="Contact" title="FinStates support">
      <p className="prose-lead">FinStates is in active development and is not yet available for public download.</p>
      <section><h2>Email</h2><p><a href={`mailto:${site.email}`}>{site.email}</a></p><p>Product, business, security and developer programme verification enquiries are welcome.</p></section>
      <section><h2>Product status</h2><p>The FinStates desktop application and its first ACRA 2026 XBRL filing workflow are under active development. Public downloads will only be linked from this website after validation, signing and publication.</p></section>
    </ContentPage>
  );
}

function formatCredits(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

function earlyAccessLabel(status: WebsiteAccount["earlyAccessStatus"]) {
  if (status === "activated") return "Desktop activated";
  if (status === "invited") return "Desktop access invited";
  if (status === "registered") return "Early access registered";
  return "FinStates account";
}

function AccountPage() {
  const account = useAccount();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (account.status === "signed-out") window.location.replace("/register/");
  }, [account.status]);

  useEffect(() => {
    void (async () => {
      const cal = await getCalApi({ namespace: "30min" });
      cal("ui", { hideEventTypeDetails: true, layout: "month_view" });
    })();
  }, []);

  if (account.status !== "signed-in") {
    return (
      <PageFrame>
        <main id="main-content" className="account-loading page-width" aria-live="polite">Checking your account…</main>
      </PageFrame>
    );
  }

  const data = account.account;
  const activated = data.earlyAccessStatus === "activated";

  const refresh = async () => {
    setBusy(true);
    setMessage("");
    try {
      await account.refresh();
    } catch {
      setMessage("We couldn’t refresh your account. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    setMessage("");
    try {
      await account.signOut();
      window.location.replace("/register/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn’t sign you out. Please try again.");
      setBusy(false);
    }
  };

  return (
    <PageFrame>
      <main id="main-content" className="account-page page-width">
        <div className="account-settings">
          <header className="account-settings-header">
            <h1>Account</h1>
            <p>Manage your account, usage and access.</p>
          </header>

          <section className="account-settings-panel" aria-label="Account details">
            <dl className="account-settings-list">
              <div className="account-settings-row">
                <dt><strong>Email</strong></dt>
                <dd>{data.email}</dd>
              </div>
              <div className="account-settings-row">
                <dt><strong>Status</strong></dt>
                <dd><span className="account-live"><i aria-hidden="true" />Signed in</span></dd>
              </div>
              <div className="account-settings-row">
                <dt><strong>Account type</strong></dt>
                <dd>{data.accountStatus === "paid" ? "Paid" : "Free"}</dd>
              </div>
            </dl>
          </section>

          <section className="account-settings-section" aria-labelledby="cloud-usage-title">
            <div className="account-settings-section-heading">
              <h2 id="cloud-usage-title">Cloud usage</h2>
              <button className="account-refresh" type="button" disabled={busy} onClick={() => void refresh()}>
                {busy ? "Refreshing…" : "Refresh usage"}
              </button>
            </div>

            {message ? <p className="form-error" role="alert">{message}</p> : null}

            <div className="account-settings-panel">
              <div className="account-settings-row">
                <div className="account-setting-copy"><strong>AI Credits</strong><small>Credits available for AI-powered processing</small></div>
                <span className="account-setting-value">{formatCredits(data.creditsBalance)}</span>
              </div>
              {!activated && data.earlyAccessStatus ? (
                <div className="account-settings-row">
                  <div className="account-setting-copy"><strong>Promotional Credits</strong><small>Granted on your first Desktop sign-in · Valid for 30 days</small></div>
                  <span className="account-setting-value account-setting-bonus">+200 pending</span>
                </div>
              ) : (
                <div className="account-settings-row">
                  <div className="account-setting-copy"><strong>Credits balance</strong><small>Shared with the FinStates Desktop app</small></div>
                  <span className="account-setting-value">Live</span>
                </div>
              )}
              <div className="account-settings-row">
                <div className="account-setting-copy">
                  <strong>Reports in progress</strong>
                  <small>{data.reportPageLimitExclusive === null
                    ? `Your account can process up to ${data.processingSlotsLimit} reports at the same time`
                    : `Free accounts can process reports under ${data.reportPageLimitExclusive} pages`}</small>
                </div>
                <span className="account-setting-value">{data.processingSlotsUsed} of {data.processingSlotsLimit}</span>
              </div>
              {data.processingReports.map((report) => (
                <div className="account-settings-row" key={report.slotId}>
                  <div className="account-setting-copy"><strong>{report.fileName}</strong><small>Cloud processing report</small></div>
                  <span className="account-setting-value">{report.status === "cooldown" ? "Cooling down" : "In progress"}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="account-settings-section" aria-labelledby="account-access-title">
            <div className="account-settings-section-heading"><h2 id="account-access-title">Access</h2></div>
            <ol className="account-settings-panel account-access-list">
              <li>
                <span className="account-access-icon" data-complete="true">✓</span>
                <p><strong>Email confirmed</strong><small>Your account identity is verified</small></p>
                <span className="account-setting-state">Confirmed</span>
              </li>
              <li>
                <span className="account-access-icon" data-complete={data.earlyAccessStatus !== null}>{data.earlyAccessStatus ? "✓" : "—"}</span>
                <p><strong>Early access registered</strong><small>{data.earlyAccessStatus ? "Your place is recorded" : "No early access registration"}</small></p>
                <span className="account-setting-state">{data.earlyAccessStatus ? "Registered" : "Not registered"}</span>
              </li>
              <li>
                <span className="account-access-icon" data-complete={activated}>{activated ? "✓" : "—"}</span>
                <p><strong>Desktop activation</strong><small>{activated ? "Your Desktop account is active" : "Complete your first Desktop sign-in"}</small></p>
                <span className="account-setting-state">{activated ? "Active" : "Pending"}</span>
              </li>
            </ol>
          </section>

          <section className="account-settings-section" aria-labelledby="account-calendar-title">
            <div className="account-settings-section-heading"><h2 id="account-calendar-title">Conversation</h2></div>
            <div className="account-settings-panel account-conversation-panel">
              <div className="account-settings-row">
                <div className="account-setting-copy"><strong>Book a 30-minute conversation</strong><small>Choose a time to discuss your workflow or FinStates</small></div>
                <button
                  className="button-secondary account-calendar-button"
                  type="button"
                  data-cal-namespace="30min"
                  data-cal-link="wei-zhou-finstates-app/30min"
                  data-cal-config={JSON.stringify({
                    email: data.email,
                    layout: "month_view",
                    useSlotsViewOnSmallScreen: "true",
                  })}
                >
                  Choose a time
                </button>
              </div>
            </div>
          </section>

          <section className="account-settings-section" aria-labelledby="account-sign-out-title">
            <div className="account-settings-section-heading"><h2 id="account-sign-out-title">Sign out</h2></div>
            <div className="account-settings-panel">
              <div className="account-settings-row">
                <div className="account-setting-copy"><strong>Sign out of this browser</strong><small>You can sign in again with your account email</small></div>
                <button className="button-secondary account-sign-out" type="button" disabled={busy} onClick={() => void signOut()}>Sign out</button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </PageFrame>
  );
}

function RegistrationPage() {
  const account = useAccount();
  const [email, setEmail] = useState("");
  const [productUpdates, setProductUpdates] = useState(false);
  const [state, setState] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (account.status === "signed-in") window.location.replace("/account/");
  }, [account.status]);

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
          <h1 id="registration-title">Join early access.</h1>
        </section>
        <div className="conversion-infinity" aria-label="Registration benefits">
          <svg className="conversion-infinity-orbit" viewBox="0 0 640 360" aria-hidden="true" focusable="false">
            <path
              id="registration-benefit-orbit"
              d="M320 180 C390 25 630 35 630 180 C630 325 390 335 320 180 C250 25 10 35 10 180 C10 325 250 335 320 180"
            />
            <g className="conversion-bee-orbit">
              <animateMotion dur="12s" repeatCount="1" rotate="auto" fill="freeze">
                <mpath href="#registration-benefit-orbit" />
              </animateMotion>
              <g className="conversion-bee-heading" transform="rotate(45)">
                <image href={brandIconUrl} x="-30" y="-30" width="60" height="60" />
              </g>
            </g>
            <g className="conversion-bee-static" transform="translate(320 48) rotate(12)">
              <image href={brandIconUrl} x="-25" y="-25" width="50" height="50" />
            </g>
          </svg>
          <article className="infinity-benefit infinity-benefit-credits">
            <strong><b>200</b><span>Credits</span></strong>
            <p>Granted after your first Desktop sign-in</p>
          </article>
          <article className="infinity-benefit infinity-benefit-session">
            <strong><b>30-minute</b><span>Founder session</span></strong>
            <p>Available after sign-in</p>
          </article>
        </div>
        <section className="registration-card" aria-label="Early access registration form">
          {account.status === "loading" || account.status === "signed-in" ? (
            <div className="form-result" role="status">
              <p className="eyebrow">Account</p>
              <h2>Checking your account…</h2>
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
  const [state, setState] = useState<"confirming" | "invalid" | "error" | "sign-in-error">("confirming");
  const [token] = useState(() => (
    new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token") ?? ""
  ));
  const confirmationStarted = useRef(false);

  useEffect(() => {
    if (account.status === "loading") return;
    if (account.status === "signed-in") {
      window.location.replace("/account/");
      return;
    }
    if (!token) {
      setState("invalid");
      return;
    }
    if (confirmationStarted.current) return;
    confirmationStarted.current = true;

    void (async () => {
      try {
        const response = await fetch(`${apiBase}/early-access/registrations/confirm`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const body = await response.json().catch(() => null) as { email?: string } | null;
        if (response.status === 401) {
          setState("invalid");
          return;
        }
        if (!response.ok || !body?.email) {
          setState("error");
          return;
        }
        const signedInAccount = await account.refresh();
        if (!signedInAccount) {
          setState("sign-in-error");
          return;
        }
        window.location.replace("/account/");
      } catch {
        setState("error");
      }
    })();
  }, [account.status, account.refresh, token]);

  return (
    <PageFrame>
      <main id="main-content" className="confirmation-page page-width">
        <section className="confirmation-card" aria-live="polite">
          {state === "invalid" ? (
            <>
              <p className="eyebrow">Confirmation link</p>
              <h1>This link is invalid or has expired.</h1>
              <p>Request a new confirmation email to continue.</p>
              <a className="button-primary" href="/register/">Send a new email</a>
            </>
          ) : state === "sign-in-error" ? (
            <>
              <p className="eyebrow">Email confirmed</p>
              <h1>Sign-in didn’t finish.</h1>
              <p>Your account is ready, but this browser could not be signed in. Request a new email to continue.</p>
              <a className="button-primary" href="/register/">Send a new email</a>
            </>
          ) : state === "error" ? (
            <>
              <p className="eyebrow">Confirmation unavailable</p>
              <h1>We couldn’t confirm your email.</h1>
              <p>Please try the email link again.</p>
              <a className="button-primary" href="/register/">Return to sign in</a>
            </>
          ) : (
            <>
              <p className="eyebrow">Account</p>
              <h1>Confirming and signing you in…</h1>
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
      <section><h2>Contact</h2><p>Questions can be sent to <a href={`mailto:${site.email}`}>{site.email}</a>.</p></section>
    </ContentPage>
  );
}

function TermsPage() {
  return (
    <ContentPage label="Terms" title="Website terms of use">
      <p className="prose-meta">Last updated: 23 August 2026</p>
      <p className="prose-lead">These terms apply to the public FinStates website. Product licence terms will be provided separately when FinStates is released.</p>
      <section><h2>Website purpose</h2><p>This website provides factual information about FinStates and its current development status. Features described as in development are not an offer, purchase commitment or promise of a release date.</p></section>
      <section><h2>Early access registration</h2><p>Confirming your email creates a FinStates account and records your interest in early access. It does not guarantee a test invitation, product availability or a release date. Promotional Credits are subject to the amount, activation condition and validity period shown when you register.</p></section>
      <section><h2>Pricing</h2><p>Website pricing describes the current planned Credits packs. Purchases are not available until enabled in a released app. The applicable app store presents the final local price, taxes and transaction terms before purchase.</p></section>
      <section><h2>No professional advice</h2><p>Website content is general product information. It is not accounting, legal, investment, tax or filing advice and does not replace professional judgment or official guidance.</p></section>
      <section><h2>Intellectual property</h2><p>The FinStates name, branding, website content and product materials are protected intellectual property. Third-party names and standards remain the property of their respective owners.</p></section>
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
  if (path === "/account") return <AccountPage />;
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
