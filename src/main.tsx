import { StrictMode, type ReactNode } from "react";
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
    "Shenzhen, Guangdong, China",
  ],
} as const;

const principles = [
  {
    number: "01",
    title: "Local-first by design",
    text: "Workspaces and their long-lived financial data live on the user's device. Local work remains available without a platform account or cloud service.",
  },
  {
    number: "02",
    title: "Evidence stays attached",
    text: "Facts retain source locators and XBRL context so a reviewer can move from a value back to the report evidence that supports it.",
  },
  {
    number: "03",
    title: "History is immutable",
    text: "Corrections create new versions instead of overwriting prior work. Tasks keep the exact dataset version used for each result.",
  },
  {
    number: "04",
    title: "Professional workflows",
    text: "FinStates ships fixed, validated Tasks for specific work. Users review professional results without assembling generic automation nodes.",
  },
] as const;

const audiences = [
  "Accounting firms",
  "Accountants",
  "Company secretaries",
  "Corporate finance teams",
] as const;

function syncDocumentThemeColor() {
  const token = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-brand-primary")
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
  return (
    <header className="site-header page-width">
      <a className="brand" href="/" aria-label="FinStates home">
        <img className="brand-icon" src={brandIconUrl} alt="" />
        <span>Fin<span className="brand-accent">States</span></span>
      </a>
      <nav className="site-nav" aria-label="Primary navigation">
        <a href="/#product">Product</a>
        <a href="/#approach">Approach</a>
        <a href="/#company">Company</a>
        <a href="/support/">Support</a>
      </nav>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-grid">
        <div className="footer-company">
          <a className="brand footer-brand" href="/" aria-label="FinStates home">
            <img className="brand-icon" src={brandIconUrl} alt="" />
            <span>Fin<span className="brand-accent">States</span></span>
          </a>
          <p>{site.name} is developed and operated by {site.operator}</p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="/#company">Company</a>
          <a href="/support/">Support</a>
          <a href="/privacy/">Privacy</a>
          <a href="/terms/">Terms</a>
        </nav>
        <p className="footer-meta">© 2026 {site.operator}</p>
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

function WorkflowCard() {
  return (
    <div className="workflow-card" aria-label="FinStates product workflow">
      <div className="workflow-brand">
        <img src={brandIconUrl} alt="" />
        <span>FinStates workflow</span>
      </div>
      <ol>
        <li><span>01</span><strong>Source evidence</strong><small>Financial reports remain traceable to their origin.</small></li>
        <li><span>02</span><strong>Reusable XBRL Facts</strong><small>Structured data keeps its complete business context.</small></li>
        <li><span>03</span><strong>Professional Tasks</strong><small>Fixed workflows produce reviewable results and artifacts.</small></li>
      </ol>
    </div>
  );
}

function FactModel() {
  return (
    <div className="fact-model" aria-label="Example XBRL Fact context">
      <div className="fact-model-heading">
        <span className="fact-status">Evidence linked</span>
        <strong>Revenue</strong>
      </div>
      <dl>
        <div><dt>Entity</dt><dd>Reporting company</dd></div>
        <div><dt>Period</dt><dd>Financial year</dd></div>
        <div><dt>Unit</dt><dd>Reporting currency</dd></div>
        <div><dt>Taxonomy</dt><dd>Controlled release</dd></div>
        <div><dt>Dimensions</dt><dd>Business context</dd></div>
        <div><dt>Evidence</dt><dd>Source locator</dd></div>
      </dl>
    </div>
  );
}

function HomePage() {
  return (
    <PageFrame>
      <main id="main-content">
        <section className="hero page-width" id="product" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="eyebrow">Local-first XBRL workspace</p>
            <h1 id="page-title">Financial facts that stay useful.</h1>
            <p className="intro">
              FinStates turns financial reports into evidence-backed XBRL Facts
              that professionals can review, maintain and reuse across filing,
              research and analysis work.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#approach">Explore the product</a>
              <a className="button button-secondary" href="#company">Company information</a>
            </div>
            <p className="development-note">
              <span className="status-dot" aria-hidden="true" />
              Desktop application in active development
            </p>
          </div>
          <WorkflowCard />
        </section>

        <aside className="trust-strip" aria-label="Product characteristics">
          <ul className="page-width">
            <li><strong>Local-first</strong><span>User-controlled workspaces</span></li>
            <li><strong>Traceable</strong><span>Evidence attached to Facts</span></li>
            <li><strong>Versioned</strong><span>History is never overwritten</span></li>
          </ul>
        </aside>

        <section className="section page-width split-section" id="approach" aria-labelledby="approach-title">
          <div className="section-copy">
            <p className="eyebrow">Facts first</p>
            <h2 id="approach-title">Build durable data once. Reuse it for real work.</h2>
            <p>
              A financial value is only useful when its meaning travels with it.
              FinStates keeps the concept, entity, period, unit, dimensions,
              taxonomy and source evidence together as one reviewable Fact.
            </p>
            <p>
              Users maintain Facts as long-lived data. Each Task fixes an exact
              dataset version, follows a defined professional workflow and
              produces a result without taking ownership of the underlying data.
            </p>
          </div>
          <FactModel />
        </section>

        <section className="section section-tonal" aria-labelledby="task-title">
          <div className="page-width task-layout">
            <div className="section-copy">
              <p className="eyebrow">First workflow in development</p>
              <h2 id="task-title">ACRA 2026 Simplified XBRL filing</h2>
              <p>
                FinStates is currently validating an end-to-end desktop workflow
                for Singapore accounting firms, accountants, company secretaries
                and finance teams preparing ACRA Simplified XBRL filings.
              </p>
              <p className="status-copy">
                This workflow is under active development and is not yet publicly released.
              </p>
            </div>
            <ol className="task-steps">
              <li><span>01</span><div><strong>Start from the report</strong><p>Identify the company, reporting period and applicable filing regime from supplied material.</p></div></li>
              <li><span>02</span><div><strong>Review Facts and evidence</strong><p>Keep report values connected to controlled taxonomy concepts and source locators.</p></div></li>
              <li><span>03</span><div><strong>Validate and prepare delivery</strong><p>Run defined checks and prepare reviewable filing artifacts through the Task workflow.</p></div></li>
            </ol>
          </div>
        </section>

        <section className="section page-width" aria-labelledby="principles-title">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Product principles</p>
              <h2 id="principles-title">Professional work needs a trustworthy foundation.</h2>
            </div>
            <p>FinStates separates long-lived financial data from the Tasks that use it.</p>
          </div>
          <div className="principle-grid">
            {principles.map((principle) => (
              <article className="principle-card" key={principle.number}>
                <span>{principle.number}</span>
                <h3>{principle.title}</h3>
                <p>{principle.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section section-brand" aria-labelledby="audience-title">
          <div className="page-width audience-layout">
            <div>
              <p className="eyebrow eyebrow-on-brand">Built for financial professionals</p>
              <h2 id="audience-title">Clear review paths for work where context matters.</h2>
            </div>
            <ul>
              {audiences.map((audience) => <li key={audience}>{audience}</li>)}
            </ul>
          </div>
        </section>

        <section className="section page-width company-section" id="company" aria-labelledby="company-title">
          <div className="company-card">
            <div className="company-copy">
              <p className="eyebrow">Company</p>
              <h2 id="company-title">FinStates is developed and operated by {site.operator}</h2>
              <p>
                We are a technology company based in Shenzhen, China, building
                local-first software for structured financial data and professional XBRL workflows.
              </p>
              <a className="text-link" href="/support/">Contact and support information <span aria-hidden="true">→</span></a>
            </div>
            <address>
              <span>Registered office</span>
              {site.address.map((line) => <div key={line}>{line}</div>)}
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </address>
          </div>
        </section>
      </main>
    </PageFrame>
  );
}

function ContentPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <PageFrame>
      <main id="main-content" className="content-page page-width">
        <header className="content-page-header">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </header>
        <div className="prose">{children}</div>
      </main>
    </PageFrame>
  );
}

function SupportPage() {
  return (
    <ContentPage eyebrow="Contact" title="Support and company enquiries">
      <p className="prose-lead">
        FinStates is in active development and is not yet available for public download.
        We welcome product, business, security and developer programme verification enquiries.
      </p>
      <section>
        <h2>Email</h2>
        <p><a href={`mailto:${site.email}`}>{site.email}</a></p>
        <p>Please include enough context for us to route and answer your enquiry.</p>
      </section>
      <section>
        <h2>Company</h2>
        <p><strong>{site.operator}</strong></p>
        <address>{site.address.map((line) => <div key={line}>{line}</div>)}</address>
      </section>
      <section>
        <h2>Product status</h2>
        <p>
          The FinStates desktop application and its first ACRA 2026 XBRL filing
          workflow are under active development. Public downloads will only be
          linked from this website after a release has completed validation,
          signing and publication.
        </p>
      </section>
    </ContentPage>
  );
}

function PrivacyPage() {
  return (
    <ContentPage eyebrow="Legal" title="Website privacy notice">
      <p className="prose-meta">Last updated: 16 August 2026</p>
      <p className="prose-lead">
        This notice describes the public FinStates website at finstates.app.
        Product-specific privacy information will be published before the FinStates application is released.
      </p>
      <section>
        <h2>Information this website handles</h2>
        <p>
          This is a static informational website. It does not provide user accounts,
          accept document uploads, run advertising trackers or set application cookies.
          Our hosting and network providers may process limited technical request data,
          such as IP address, browser information and request time, to deliver and protect the website.
        </p>
      </section>
      <section>
        <h2>When you contact us</h2>
        <p>
          If you email us, we use the contact details and message content you provide
          to respond, maintain necessary correspondence and protect our services.
          We do not sell personal information received through company correspondence.
        </p>
      </section>
      <section>
        <h2>Third-party services</h2>
        <p>
          The website is delivered using third-party domain, network and hosting
          infrastructure. Links to third-party websites are governed by those providers' own notices.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Questions about this notice can be sent to <a href={`mailto:${site.email}`}>{site.email}</a>.</p>
        <p>{site.operator}, Shenzhen, Guangdong, China.</p>
      </section>
    </ContentPage>
  );
}

function TermsPage() {
  return (
    <ContentPage eyebrow="Legal" title="Website terms of use">
      <p className="prose-meta">Last updated: 16 August 2026</p>
      <p className="prose-lead">
        These terms apply to the public FinStates website. Product licence terms
        will be provided separately when FinStates is released.
      </p>
      <section>
        <h2>Website purpose</h2>
        <p>
          This website provides factual information about FinStates, its developer
          and its current development status. Features described as in development
          are not an offer, purchase commitment or promise of a release date.
        </p>
      </section>
      <section>
        <h2>No professional advice</h2>
        <p>
          Website content is general product information. It is not accounting,
          legal, investment, tax or filing advice and does not replace professional judgment or official guidance.
        </p>
      </section>
      <section>
        <h2>Intellectual property</h2>
        <p>
          The FinStates name, branding, website content and product materials are
          owned by {site.operator} or used with permission. Third-party names and standards remain the property of their respective owners.
        </p>
      </section>
      <section>
        <h2>Availability and changes</h2>
        <p>
          We may correct, update or remove website content as the product develops.
          We do not guarantee uninterrupted availability of the public website.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Questions about these terms can be sent to <a href={`mailto:${site.email}`}>{site.email}</a>.</p>
      </section>
    </ContentPage>
  );
}

function NotFoundPage() {
  return (
    <ContentPage eyebrow="404" title="Page not found">
      <p className="prose-lead">The page you requested does not exist.</p>
      <p><a className="text-link" href="/">Return to the FinStates homepage <span aria-hidden="true">→</span></a></p>
    </ContentPage>
  );
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
