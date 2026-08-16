import { StrictMode, type ReactNode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
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
        <a className="header-status" href="/#status">
          <span className="status-dot" aria-hidden="true" />
          Development status
        </a>
      </header>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-main">
        <div className="footer-company">
          <a className="brand footer-brand" href="/" aria-label="FinStates home">
            <img className="brand-icon" src={brandIconUrl} alt="" />
            <span>Fin<span className="brand-accent">States</span></span>
          </a>
          <a className="footer-email" href={`mailto:${site.email}`}>{site.email}</a>
        </div>
        <FooterColumn title="Product">
          <a href="/#workflow">ACRA workflow</a>
          <a href="/#evidence">Evidence and control</a>
          <a href="/#status">Development status</a>
        </FooterColumn>
        <FooterColumn title="Company">
          <a href="/support/">Support and contact</a>
          <a href={`mailto:${site.email}`}>Email</a>
        </FooterColumn>
        <FooterColumn title="Legal">
          <a href="/privacy/">Privacy</a>
          <a href="/terms/">Terms</a>
        </FooterColumn>
      </div>
      <div className="page-width footer-bottom">
        <p>© 2026 {site.operator}. All rights reserved.</p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav className="footer-column" aria-label={`${title} links`}>
      <strong>{title}</strong>
      {children}
    </nav>
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
        <strong>FinStates · ACRA Workbench</strong>
        <span className="window-badge">Local workspace</span>
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
  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
  };

  return (
    <section className="hero" id="product" aria-labelledby="page-title" onPointerMove={handlePointerMove}>
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />
      <div className="page-width hero-layout">
        <div className="hero-copy">
          <a className="announcement" href="#status">
            <span>In development</span>
            ACRA 2026 end-to-end filing workflow
            <b aria-hidden="true">→</b>
          </a>
          <h1 id="page-title">From financial report to reviewable ACRA filing.</h1>
          <p>
            A local-first desktop workspace for Singapore accounting professionals.
            Keep every XBRL Fact connected to its evidence, validation and exact data version.
          </p>
        </div>
        <div className="hero-actions">
          <a className="action-card" href="#workflow">
            <strong>Explore the workflow</strong>
            <span>PDF to validated five-file ZIP</span>
            <b aria-hidden="true">↗</b>
          </a>
          <a className="action-card" href="#status">
            <strong>Development status</strong>
            <span>See what is implemented and what remains</span>
            <b aria-hidden="true">↗</b>
          </a>
        </div>
        <div className="hero-visual"><ProductWindow /></div>
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <PageFrame>
      <main id="main-content">
        <Hero />

        <section className="section page-width" aria-labelledby="result-title">
          <div className="section-heading">
            <p className="eyebrow">The professional result</p>
            <h2 id="result-title">One filing result, with the work behind it still intact.</h2>
            <p>A filing package is only useful when a professional can inspect how it was produced and return to the exact source evidence.</p>
          </div>
          <div className="result-grid">
            <article><span>01</span><strong>Validated filing</strong><p>ACRA structure, calculation and business-rule checks run against one fixed dataset.</p></article>
            <article><span>02</span><strong>Evidence-backed Facts</strong><p>Values retain the report locator, period, unit, dimensions and controlled taxonomy identity.</p></article>
            <article><span>03</span><strong>Five-file delivery</strong><p>Preview the filing result, pass the final gate and save the ACRA five-file ZIP package.</p></article>
          </div>
        </section>

        <section className="section workflow-section" id="workflow" aria-labelledby="workflow-title">
          <div className="page-width workflow-layout">
            <div className="workflow-copy">
              <p className="eyebrow">A fixed professional workflow</p>
              <h2 id="workflow-title">Five steps from one complete PDF.</h2>
              <ol className="workflow-nav">
                {taskSteps.map(([number, label, description]) => (
                  <li key={number}><span>{number}</span><div><strong>{label}</strong><p>{description}</p></div></li>
                ))}
              </ol>
            </div>
            <div className="workflow-preview"><ProductWindow compact /></div>
          </div>
        </section>

        <section className="section page-width" id="evidence" aria-labelledby="evidence-title">
          <div className="section-heading section-heading-wide">
            <div><p className="eyebrow">Evidence and control</p><h2 id="evidence-title">Automation that leaves professional judgment visible.</h2></div>
            <p>FinStates can help identify report structure and Concepts. It does not silently invent missing values, units, periods or source evidence.</p>
          </div>
          <div className="control-grid">
            <article className="control-card evidence-card">
              <div className="control-card-top"><span>Source → Fact</span><b>Open evidence</b></div>
              <div className="evidence-flow"><div><small>PDF page</small><strong>Note 17 · Revenue</strong></div><span>→</span><div><small>XBRL Fact</small><strong>Revenue · SGD 6,389k</strong></div></div>
              <p>A reviewer can move from the structured Fact back to its source page and locator.</p>
            </article>
            <article className="control-card version-card">
              <div className="control-card-top"><span>Dataset history</span><b>Current · v4</b></div>
              <div className="version-line"><i /><i /><i /><i className="is-current" /></div>
              <div className="version-labels"><span>Imported</span><span>Prepared</span><span>Reviewed</span><span>Current</span></div>
              <p>Corrections create a new immutable version. Prior Tasks and results keep their exact original inputs.</p>
            </article>
          </div>
        </section>

        <section className="section page-width" aria-labelledby="reuse-title">
          <div className="reuse-panel">
            <div className="reuse-copy"><p className="eyebrow">Built for repeat professional work</p><h2 id="reuse-title">Process companies independently. Reuse their financial data later.</h2></div>
            <div className="reuse-grid">
              <article><span>Batch</span><strong>Multiple reports, isolated Tasks</strong><p>Each company keeps its own source, run, issues, usage, result and delivery.</p></article>
              <article><span>Financials</span><strong>Long-lived client Facts</strong><p>Reviewed data remains in the local workspace for later filing, research and analysis Tasks.</p></article>
            </div>
          </div>
        </section>

        <section className="section page-width" id="status" aria-labelledby="status-title">
          <div className="status-panel">
            <div><p className="eyebrow">Development status</p><h2 id="status-title">The first workflow is being validated end to end.</h2></div>
            <div className="status-detail">
              <p>FinStates Desktop and the ACRA 2026 XBRL filing Task are in active development and are not yet publicly released.</p>
              <p>Public downloads will appear here only after the release has completed product validation, signing and publication.</p>
              <a href="/support/">Contact FinStates <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>
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

function PrivacyPage() {
  return (
    <ContentPage label="Privacy" title="Website privacy notice">
      <p className="prose-meta">Last updated: 16 August 2026</p>
      <p className="prose-lead">This notice describes the public FinStates website at finstates.app.</p>
      <section><h2>Information this website handles</h2><p>This static informational website does not provide user accounts, accept document uploads, run advertising trackers or set application cookies. Hosting and network providers may process limited technical request data to deliver and protect the website.</p></section>
      <section><h2>When you contact us</h2><p>If you email us, we use the contact details and message content you provide to respond, maintain necessary correspondence and protect our services. We do not sell personal information received through company correspondence.</p></section>
      <section><h2>Third-party services</h2><p>The website is delivered using third-party domain, network and hosting infrastructure. Links to other websites are governed by those providers' own notices.</p></section>
      <section><h2>Contact</h2><p>Questions can be sent to <a href={`mailto:${site.email}`}>{site.email}</a>.</p><p>{site.operator}, Shenzhen, Guangdong, China.</p></section>
    </ContentPage>
  );
}

function TermsPage() {
  return (
    <ContentPage label="Terms" title="Website terms of use">
      <p className="prose-meta">Last updated: 16 August 2026</p>
      <p className="prose-lead">These terms apply to the public FinStates website. Product licence terms will be provided separately when FinStates is released.</p>
      <section><h2>Website purpose</h2><p>This website provides factual information about FinStates, its developer and its current development status. Features described as in development are not an offer, purchase commitment or promise of a release date.</p></section>
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
  if (path === "/privacy") return <PrivacyPage />;
  if (path === "/terms") return <TermsPage />;
  return <NotFoundPage />;
}

syncDocumentThemeColor();

createRoot(document.getElementById("root")!).render(
  <StrictMode>{resolvePage()}</StrictMode>,
);
