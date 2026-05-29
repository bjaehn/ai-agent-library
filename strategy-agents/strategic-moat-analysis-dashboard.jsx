import { useState, useMemo } from "react";

// ─── Sample Data ──────────────────────────────────────────────────────────────

const COMPANY = "Acme Data Platform";
const ANALYSIS_DATE = "May 29, 2026";
const MOAT_CLASS = "EMERGING MOAT";
const MOAT_CLASS_SHORT = "EMERGING";
const TIME_HORIZON = "24-36 months";

const MOAT_DIMENSIONS = [
  {
    id: "customer",
    label: "Customer Moat",
    score: 4,
    compA: 3,
    compB: 2,
    evidence: "High",
    durability: "18-36mo",
    erosion: "Low",
    interpretation: "Deep workflow integration with enterprise accounts creates meaningful switching friction. 6 of top 10 accounts have 3+ years of data history embedded. Average documented migration cost: ~40 engineer-hours.",
    topErosionMove: "Competitor offers free data migration tooling + 3-month credits to subsidize switching",
    earlyWarning: "Customer success renewal conversations shifting to pricing; new contacts asking for data export",
    assumption: "Switching costs are uniform across account segments",
  },
  {
    id: "product",
    label: "Product Moat",
    score: 3,
    compA: 4,
    compB: 3,
    evidence: "Medium",
    durability: "6-18mo",
    erosion: "High",
    interpretation: "Differentiated on real-time pipeline observability. Core capability is ~14 months ahead of Competitor A based on feature benchmarking, but Competitor A has faster engineering velocity.",
    topErosionMove: "Competitor A ships native observability module in their next major release (flagged on public roadmap)",
    earlyWarning: "Competitor A launches beta of observability feature; customers mention it in renewal calls",
    assumption: "14-month lead is accurate (based on feature comparison, not customer interviews)",
  },
  {
    id: "data",
    label: "Data Moat",
    score: 3,
    compA: 2,
    compB: 4,
    evidence: "Low",
    durability: "6-18mo",
    erosion: "High",
    interpretation: "Proprietary anomaly benchmarks built from 3 years of multi-tenant usage. However, these benchmarks have not been independently validated as product differentiators in customer research. Claimed but not proven.",
    topErosionMove: "Open-source benchmark dataset published by academic group or cloud provider",
    earlyWarning: "Customers stop mentioning benchmarks as a reason for choosing platform",
    assumption: "Benchmark data actually creates product advantage (not yet proven in customer interviews)",
  },
  {
    id: "distribution",
    label: "Distribution Moat",
    score: 2,
    compA: 4,
    compB: 2,
    evidence: "Medium",
    durability: "6-18mo",
    erosion: "High",
    interpretation: "No exclusive channel relationships. Sales is direct and self-serve. Competitor A has deep AWS Marketplace presence and reseller relationships that provide structural distribution advantage.",
    topErosionMove: "Competitor A deepens AWS co-sell program, accessing enterprise procurement channels we don't have",
    earlyWarning: "Increasing deal cycles; customers requiring procurement approval where we were previously bypassed",
    assumption: null,
  },
  {
    id: "brand",
    label: "Brand / Trust Moat",
    score: 3,
    compA: 3,
    compB: 2,
    evidence: "Medium",
    durability: "18-36mo",
    erosion: "Medium",
    interpretation: "Earned trust in the data engineering community via open-source contributions (2.1k GitHub stars, 14k npm weekly downloads). NPS of 47 is above category average but not exceptional. Trust is real but not yet a switching barrier.",
    topErosionMove: "Major security incident or data breach would permanently impair trust moat",
    earlyWarning: "NPS trend reversal; negative coverage in data engineering communities",
    assumption: "NPS 47 reflects genuine product satisfaction, not selection bias from power users",
  },
  {
    id: "network",
    label: "Network Effects",
    score: 1,
    compA: 2,
    compB: 1,
    evidence: "Low",
    durability: "0-6mo",
    erosion: "Low",
    interpretation: "No evidence of network effects. Usage by Customer A does not increase value for Customer B. Community activity does not drive product improvement in a measurable feedback loop. Claimed in marketing; not demonstrated in product.",
    topErosionMove: "N/A — no meaningful moat to erode",
    earlyWarning: "N/A",
    assumption: null,
  },
  {
    id: "cost",
    label: "Cost Advantage",
    score: 2,
    compA: 3,
    compB: 2,
    evidence: "Low",
    durability: "6-18mo",
    erosion: "High",
    interpretation: "Claimed infrastructure cost advantage of ~20% over Competitor A. Unverified externally. Scale-based advantage is replicable by any well-funded competitor at similar ARR. Not structural.",
    topErosionMove: "Well-funded competitor achieves similar scale, eliminating cost delta",
    earlyWarning: "Competitor A begins pricing below us on identical workloads",
    assumption: "Cost advantage estimate is accurate (internal claim, not third-party verified)",
  },
  {
    id: "regulatory",
    label: "Regulatory / Compliance",
    score: 3,
    compA: 2,
    compB: 1,
    evidence: "High",
    durability: "18-36mo",
    erosion: "Low",
    interpretation: "SOC2 Type II certified, HIPAA BAA available, GDPR compliant. Competitor B lacks SOC2. In regulated verticals (healthcare, finance), compliance certification is a real procurement gate. 3 enterprise deals specifically cited compliance as primary qualifier.",
    topErosionMove: "Competitor B obtains SOC2 and HIPAA certification (estimated 9-12 months)",
    earlyWarning: "Competitor B publicly announces SOC2 audit in progress",
    assumption: "Compliance remains a procurement gate in financial services and healthcare verticals",
  },
  {
    id: "ecosystem",
    label: "Ecosystem / Platform",
    score: 2,
    compA: 4,
    compB: 2,
    evidence: "Medium",
    durability: "6-18mo",
    erosion: "High",
    interpretation: "47 native integrations. No third-party developer ecosystem. No partner app marketplace. Competitor A has a published API and 200+ community-built connectors. Platform moat is aspirational, not current.",
    topErosionMove: "Competitor A's connector ecosystem reaches critical mass, making their platform the default integration hub",
    earlyWarning: "Customers asking whether key integrations are natively supported vs. requiring custom work",
    assumption: null,
  },
  {
    id: "ai",
    label: "AI Moat",
    score: 2,
    compA: 3,
    compB: 2,
    evidence: "Low",
    durability: "6-18mo",
    erosion: "High",
    interpretation: "Uses LLM for natural language query interface. No proprietary model. No unique training data. The NL query feature is differentiated today but will be feature-parity with competitors within 12-18 months as foundation model capabilities commoditize this use case.",
    topErosionMove: "Foundation model providers (OpenAI, Anthropic, Google) release native data query APIs that eliminate the need for a middleman layer",
    earlyWarning: "Customers begin evaluating direct LLM integrations with their data warehouse as alternatives",
    assumption: null,
  },
];

const SWOT = [
  { type: "S", label: "Deep workflow integration in enterprise accounts", evidence: "High", validated: true, implication: "Switching friction creates retention moat if compounded" },
  { type: "S", label: "SOC2 Type II + HIPAA compliance as procurement qualifier", evidence: "High", validated: true, implication: "Real barrier in regulated verticals; 3 deals cited it" },
  { type: "S", label: "Community trust via open-source contributions", evidence: "Medium", validated: true, implication: "Low CAC from developer community; brand credibility" },
  { type: "W", label: "No distribution moat — no channel, marketplace, or partner relationships", evidence: "Medium", validated: true, implication: "Sales efficiency disadvantage vs. Competitor A" },
  { type: "W", label: "AI moat is feature parity, not structural — commoditizes in 12-18mo", evidence: "Low", validated: false, implication: "NL query differentiation window is closing" },
  { type: "W", label: "Data moat claim is unvalidated in customer research", evidence: "Low", validated: false, implication: "Benchmark differentiator may be marketing, not product reality" },
  { type: "O", label: "Financial services vertical adoption gated by compliance — we qualify, competitors don't", evidence: "High", validated: true, implication: "Beachhead opportunity in regulated industries" },
  { type: "O", label: "Competitor B is weak on compliance and has low product moat — acquirable customers", evidence: "Medium", validated: false, implication: "Displacement strategy with compliance as wedge" },
  { type: "T", label: "Competitor A has a 14-month faster engineering velocity on core features", evidence: "Medium", validated: false, implication: "Product lead narrows unless we compound customer moat" },
  { type: "T", label: "AWS Marketplace co-sell gives Competitor A distribution advantage in enterprise", evidence: "Medium", validated: true, implication: "Deal cycles lengthen if procurement requires marketplace" },
];

const STRATEGIC_OPTIONS = [
  {
    name: "Regulated Industry Beachhead",
    logic: "Double down on financial services and healthcare where compliance (SOC2+HIPAA) creates a structural procurement gate competitors can't cross for 9-12 months.",
    primaryMoat: "Regulatory / Compliance",
    secondaryMoat: "Customer Moat",
    horizon: "6-12 months",
    confidence: "High",
    nextMove: "Pilot",
    evidence: "3 enterprise deals cited compliance as primary qualifier. Competitor B has no SOC2. Competitor A has SOC2 but not HIPAA BAA.",
  },
  {
    name: "Deepen Workflow Ownership",
    logic: "Expand use cases within existing enterprise accounts. Each additional workflow embedded increases switching cost and contract size.",
    primaryMoat: "Customer Moat",
    secondaryMoat: "Product Moat",
    horizon: "6-18 months",
    confidence: "Medium",
    nextMove: "Discovery",
    evidence: "Top 10 accounts have avg. 2.3 workflows. Internal hypothesis: accounts with 4+ workflows churn at <1% vs. 8% for accounts with 1-2 workflows. (Needs validation.)",
  },
  {
    name: "Build Proprietary Data Feedback Loops",
    logic: "Instrument product to collect usage patterns, anomaly signals, and benchmark data at scale. Build a model that improves from collective usage — turning claimed data moat into a real one.",
    primaryMoat: "Data Moat",
    secondaryMoat: "AI Moat",
    horizon: "12-24 months",
    confidence: "Low",
    nextMove: "Experiment",
    evidence: "Current benchmark data is static. No reinforcing feedback loop exists. This is an investment to build one, not leverage an existing one.",
  },
  {
    name: "AWS Marketplace / Cloud Partner Program",
    logic: "Close the distribution gap with Competitor A by establishing a marketplace presence and co-sell relationships with AWS and GCP.",
    primaryMoat: "Distribution Moat",
    secondaryMoat: "Ecosystem Moat",
    horizon: "6-18 months",
    confidence: "Medium",
    nextMove: "Investment",
    evidence: "Competitor A's AWS co-sell cited in 4 competitive loss analyses. AWS Marketplace procurement bypass is relevant for enterprise procurement.",
  },
  {
    name: "Move from Tool to System of Record",
    logic: "Make the platform the authoritative source of pipeline health data. When customers report pipeline status to their executives, they cite this platform — making it essential infrastructure.",
    primaryMoat: "Customer Moat",
    secondaryMoat: "Brand Moat",
    horizon: "12-24 months",
    confidence: "Medium",
    nextMove: "Discovery",
    evidence: "Hypothesis only. Customer research needed to validate whether exec-level reporting use case is real and valued.",
  },
];

const EVIDENCE_LEDGER = [
  { claim: "Average migration cost is ~40 engineer-hours", source: "Customer interviews (n=8)", type: "Primary", date: "Mar 2026", proves: "Documented switching friction from actual users", doesnt: "Whether friction is uniform across all customer segments", confidence: "High" },
  { claim: "NPS of 47 (above category average)", source: "Internal NPS dashboard", type: "Primary", date: "Apr 2026", proves: "Customer satisfaction is measured and above-average", doesnt: "Whether NPS translates to switching resistance or premium willingness-to-pay", confidence: "High" },
  { claim: "SOC2 Type II certified, HIPAA BAA available", source: "Company compliance documentation", type: "Primary", date: "Jan 2026", proves: "Compliance certifications are current and in place", doesnt: "Whether compliance is the deciding factor in all enterprise deals", confidence: "High" },
  { claim: "3 enterprise deals cited compliance as primary qualifier", source: "Sales win analysis (internal)", type: "Primary", date: "Q1 2026", proves: "Compliance is a real procurement gate in specific deals", doesnt: "Whether this pattern holds across all enterprise segments", confidence: "High" },
  { claim: "47 native integrations available", source: "Product documentation (public)", type: "Secondary", date: "May 2026", proves: "Integration breadth as claimed", doesnt: "Whether integrations are maintained, high-quality, or valued by customers", confidence: "Medium" },
  { claim: "Competitor A has 200+ community-built connectors", source: "Competitor A developer docs (public)", type: "Secondary", date: "Apr 2026", proves: "Competitor A has an active developer ecosystem", doesnt: "Quality or reliability of connectors vs. native integrations", confidence: "Medium" },
  { claim: "2.1k GitHub stars, 14k npm weekly downloads for OSS library", source: "GitHub / npm public stats", type: "Secondary", date: "May 2026", proves: "Developer community engagement with open-source project", doesnt: "Whether OSS engagement converts to paid product adoption", confidence: "Medium" },
  { claim: "Anomaly benchmarks built from 3 years multi-tenant usage", source: "Internal product documentation", type: "Primary", date: "Feb 2026", proves: "Data has been collected for this use case", doesnt: "Whether benchmarks create a product advantage customers actually value", confidence: "Low" },
  { claim: "20% infrastructure cost advantage vs. Competitor A", source: "Internal finance model", type: "Primary", date: "Mar 2026", proves: "Internal estimate of cost delta exists", doesnt: "Whether estimate is accurate; not externally verified", confidence: "Low" },
  { claim: "Competitor A on public roadmap to ship observability module", source: "Competitor A public product roadmap (website)", type: "Secondary", date: "May 2026", proves: "Competitor A is actively closing the product gap", doesnt: "Timeline accuracy or feature depth of their implementation", confidence: "Medium" },
];

// ─── Color System ─────────────────────────────────────────────────────────────

const C = {
  bg: "#0C1220",
  surface: "#111827",
  surfaceAlt: "#162032",
  border: "#1E2D42",
  borderLight: "#243548",
  text: "#E8EDF5",
  muted: "#5A7090",
  subtle: "#8BA4BE",
  gold: "#C9A84C",
  goldLight: "#F0CC72",
  cyan: "#3BBFCF",
  green: "#3DBF8A",
  amber: "#D4872A",
  red: "#C45252",
  purple: "#7C6FC4",
  emerging: "#3BBFCF",
};

const MOAT_CLASS_COLORS = {
  "DURABLE": C.green,
  "EMERGING": C.cyan,
  "NARROW": C.gold,
  "EXECUTION-DEPENDENT": C.amber,
  "WEAK": C.red,
  "NO CURRENT": C.muted,
};

const evidenceColor = (e) => e === "High" ? C.green : e === "Medium" ? C.amber : C.red;
const erosionColor = (e) => e === "Low" ? C.green : e === "Medium" ? C.amber : C.red;

const DURABILITY_ORDER = ["0-6mo", "6-18mo", "18-36mo", "36+mo"];
const durabilityWidth = (d) => {
  const idx = DURABILITY_ORDER.indexOf(d);
  if (idx === -1) return 25;
  return [20, 45, 70, 95][idx];
};

const SWOT_COLORS = { S: "#3DBF8A", W: "#C45252", O: "#3BBFCF", T: "#D4872A" };
const SWOT_LABELS = { S: "STRENGTH", W: "WEAKNESS", O: "OPPORTUNITY", T: "THREAT" };

// ─── Sub-Components ───────────────────────────────────────────────────────────

function PipScore({ score, max = 5, color = C.gold }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} style={{
          width: 9, height: 9, borderRadius: 2,
          background: i < score ? color : "rgba(255,255,255,0.07)",
          border: `1px solid ${i < score ? color : "rgba(255,255,255,0.1)"}`,
          transition: "background 0.3s",
        }} />
      ))}
      <span style={{ fontSize: 11, fontWeight: 700, color, marginLeft: 5, fontFamily: "monospace" }}>{score}/5</span>
    </div>
  );
}

function EvidenceBadge({ level }) {
  return (
    <span style={{
      fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
      background: `${evidenceColor(level)}18`,
      border: `1px solid ${evidenceColor(level)}50`,
      color: evidenceColor(level),
      fontFamily: "monospace", letterSpacing: 0.8,
    }}>{level.toUpperCase()}</span>
  );
}

function ErosionBadge({ level }) {
  return (
    <span style={{
      fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 3,
      background: `${erosionColor(level)}12`,
      border: `1px solid ${erosionColor(level)}40`,
      color: erosionColor(level),
      fontFamily: "monospace", letterSpacing: 0.8,
    }}>⚠ {level.toUpperCase()} EROSION</span>
  );
}

function DurabilityBar({ durability }) {
  const w = durabilityWidth(durability);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{ width: 72, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
        <div style={{ width: `${w}%`, height: "100%", background: C.cyan, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 9, color: C.subtle, fontFamily: "monospace" }}>{durability}</span>
    </div>
  );
}

function CompScore({ score, compA, compB }) {
  const cols = [C.gold, "#FF9F50", "#A888F7"];
  const labels = ["You", "Co. A", "Co. B"];
  const scores = [score, compA, compB];
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {scores.map((s, i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <div style={{ display: "flex", gap: 2, justifyContent: "center", marginBottom: 3 }}>
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} style={{
                width: 6, height: 6, borderRadius: 1,
                background: j < s ? cols[i] : "rgba(255,255,255,0.06)",
              }} />
            ))}
          </div>
          <span style={{ fontSize: 8, color: i === 0 ? cols[0] : C.muted, fontFamily: "monospace" }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function DimensionCard({ dim, expanded, onToggle }) {
  const active = dim.score >= 3;
  return (
    <div onClick={() => onToggle(dim.id)}
      style={{
        border: `1px solid ${expanded ? (active ? C.gold + "60" : C.border) : C.border}`,
        borderLeft: `3px solid ${active ? (dim.score >= 4 ? C.green : C.gold) : C.muted}`,
        borderRadius: 6,
        background: expanded ? C.surfaceAlt : C.surface,
        padding: "12px 14px",
        cursor: "pointer",
        marginBottom: 7,
        transition: "all 0.2s ease",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: expanded ? 0 : 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'Georgia', serif" }}>{dim.label}</span>
            {!active && <span style={{ fontSize: 8, color: C.muted, fontFamily: "monospace", border: `1px solid ${C.border}`, padding: "1px 5px", borderRadius: 3 }}>BELOW THRESHOLD</span>}
          </div>
          {!expanded && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <PipScore score={dim.score} color={active ? (dim.score >= 4 ? C.green : C.gold) : C.muted} />
              <EvidenceBadge level={dim.evidence} />
              <ErosionBadge level={dim.erosion} />
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <CompScore score={dim.score} compA={dim.compA} compB={dim.compB} />
          <span style={{ color: C.muted, fontSize: 14 }}>{expanded ? "−" : "+"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
            <div><div style={{ fontSize: 8, color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>SCORE</div><PipScore score={dim.score} color={active ? (dim.score >= 4 ? C.green : C.gold) : C.muted} /></div>
            <div><div style={{ fontSize: 8, color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>EVIDENCE QUALITY</div><EvidenceBadge level={dim.evidence} /></div>
            <div><div style={{ fontSize: 8, color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>EROSION RISK</div><ErosionBadge level={dim.erosion} /></div>
            <div><div style={{ fontSize: 8, color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>DURABILITY</div><DurabilityBar durability={dim.durability} /></div>
          </div>
          <p style={{ fontSize: 11, color: C.subtle, lineHeight: 1.65, marginBottom: 12, fontFamily: "'Georgia', serif" }}>{dim.interpretation}</p>
          {dim.assumption && (
            <div style={{ padding: "8px 10px", background: `${C.amber}10`, border: `1px solid ${C.amber}30`, borderRadius: 5, marginBottom: 10 }}>
              <span style={{ fontSize: 8, color: C.amber, fontFamily: "monospace", letterSpacing: 0.8 }}>⚠ KEY ASSUMPTION: </span>
              <span style={{ fontSize: 10, color: C.text, fontFamily: "'Georgia', serif" }}>{dim.assumption}</span>
            </div>
          )}
          {active && (
            <div style={{ padding: "8px 10px", background: `${C.red}08`, border: `1px solid ${C.red}25`, borderRadius: 5 }}>
              <div style={{ fontSize: 8, color: C.red, fontFamily: "monospace", letterSpacing: 0.8, marginBottom: 3 }}>TOP EROSION MOVE</div>
              <span style={{ fontSize: 10, color: C.subtle, fontFamily: "'Georgia', serif" }}>{dim.topErosionMove}</span>
              {dim.earlyWarning !== "N/A" && (
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 8, color: C.muted, fontFamily: "monospace" }}>EARLY WARNING: </span>
                  <span style={{ fontSize: 10, color: C.muted, fontFamily: "'Georgia', serif" }}>{dim.earlyWarning}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MoatAnalysisDashboard() {
  const [activeTab, setActiveTab] = useState("assessment");
  const [expandedDim, setExpandedDim] = useState(null);
  const [filterScore, setFilterScore] = useState("all");
  const [filterErosion, setFilterErosion] = useState("all");
  const [swotFilter, setSwotFilter] = useState("all");

  const filteredDims = useMemo(() => MOAT_DIMENSIONS
    .filter(d => filterScore === "all" || (filterScore === "active" ? d.score >= 3 : d.score < 3))
    .filter(d => filterErosion === "all" || d.erosion === filterErosion),
    [filterScore, filterErosion]
  );

  const filteredSwot = useMemo(() => swotFilter === "all" ? SWOT : SWOT.filter(s => s.type === swotFilter), [swotFilter]);

  const avgScore = (MOAT_DIMENSIONS.reduce((s, d) => s + d.score, 0) / MOAT_DIMENSIONS.length).toFixed(1);
  const activeMoats = MOAT_DIMENSIONS.filter(d => d.score >= 3).length;
  const highErosion = MOAT_DIMENSIONS.filter(d => d.erosion === "High" && d.score >= 3).length;

  const TABS = [
    { id: "assessment", label: "MOAT ASSESSMENT" },
    { id: "competitive", label: "COMPETITIVE BASELINE" },
    { id: "swot", label: "SWOT" },
    { id: "options", label: "STRATEGIC OPTIONS" },
    { id: "evidence", label: "EVIDENCE LEDGER" },
    { id: "checklist", label: "QUARTERLY REVIEW" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Georgia', serif", paddingBottom: 60 }}>

      {/* Header */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "20px 28px 16px", position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: 3, color: C.muted, fontFamily: "monospace", marginBottom: 6 }}>
              STRATEGIC MOAT ANALYSIS AGENT — EVIDENCE-FIRST
            </div>
            <div style={{ fontSize: 22, fontWeight: 400, color: C.text, letterSpacing: -0.5, fontStyle: "italic" }}>
              {COMPANY}
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 3, fontFamily: "monospace" }}>
              Analysis Date: {ANALYSIS_DATE} · Horizon: {TIME_HORIZON}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ textAlign: "center", padding: "10px 16px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.gold, fontFamily: "monospace" }}>{avgScore}</div>
              <div style={{ fontSize: 8, color: C.muted, fontFamily: "monospace", letterSpacing: 1 }}>AVG SCORE</div>
            </div>
            <div style={{ textAlign: "center", padding: "10px 16px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.cyan, fontFamily: "monospace" }}>{activeMoats}</div>
              <div style={{ fontSize: 8, color: C.muted, fontFamily: "monospace", letterSpacing: 1 }}>ACTIVE MOATS</div>
            </div>
            <div style={{ textAlign: "center", padding: "10px 16px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.red, fontFamily: "monospace" }}>{highErosion}</div>
              <div style={{ fontSize: 8, color: C.muted, fontFamily: "monospace", letterSpacing: 1 }}>HIGH EROSION</div>
            </div>
            <div style={{
              padding: "12px 20px",
              background: `${MOAT_CLASS_COLORS[MOAT_CLASS_SHORT]}15`,
              border: `2px solid ${MOAT_CLASS_COLORS[MOAT_CLASS_SHORT]}`,
              borderRadius: 6,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 9, color: C.muted, fontFamily: "monospace", letterSpacing: 1.5, marginBottom: 3 }}>CLASSIFICATION</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: MOAT_CLASS_COLORS[MOAT_CLASS_SHORT], fontFamily: "monospace", letterSpacing: 1 }}>{MOAT_CLASS}</div>
            </div>
          </div>
        </div>

        {/* Context strip */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {[
            { label: "PRIMARY DEFENSIBILITY", value: "Customer Moat + Compliance" },
            { label: "BIGGEST VULNERABILITY", value: "Product lead narrows in 14mo" },
            { label: "TOP ACTION", value: "Beachhead regulated verticals" },
          ].map((item, i) => (
            <div key={i} style={{
              padding: "4px 12px", borderRadius: 20,
              background: `${C.gold}08`, border: `1px solid ${C.gold}25`,
              display: "flex", gap: 6, alignItems: "center",
            }}>
              <span style={{ fontSize: 8, color: C.gold, fontFamily: "monospace", letterSpacing: 1 }}>{item.label}:</span>
              <span style={{ fontSize: 10, color: C.subtle, fontFamily: "'Georgia', serif" }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, padding: "0 28px", background: C.surface }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: "11px 16px", background: "none", border: "none",
              borderBottom: activeTab === t.id ? `2px solid ${C.gold}` : "2px solid transparent",
              color: activeTab === t.id ? C.gold : C.muted,
              fontSize: 9, letterSpacing: 1.5, cursor: "pointer", fontFamily: "monospace",
              fontWeight: activeTab === t.id ? 700 : 400,
              transition: "all 0.2s",
            }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "22px 28px" }}>

        {/* MOAT ASSESSMENT TAB */}
        {activeTab === "assessment" && (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 8, color: C.muted, fontFamily: "monospace", letterSpacing: 1 }}>FILTER:</span>
              {[["all","ALL"],["active","ACTIVE (3+)"],["weak","WEAK (<3)"]].map(([v,l]) => (
                <button key={v} onClick={() => setFilterScore(v)} style={{
                  padding: "3px 10px", borderRadius: 20,
                  border: `1px solid ${filterScore===v ? C.gold : C.border}`,
                  background: filterScore===v ? `${C.gold}12` : "transparent",
                  color: filterScore===v ? C.gold : C.muted,
                  fontSize: 8, cursor: "pointer", fontFamily: "monospace",
                }}>{l}</button>
              ))}
              <span style={{ fontSize: 8, color: C.muted, fontFamily: "monospace", marginLeft: 8 }}>EROSION:</span>
              {[["all","ALL"],["High","HIGH"],["Medium","MEDIUM"],["Low","LOW"]].map(([v,l]) => (
                <button key={v} onClick={() => setFilterErosion(v)} style={{
                  padding: "3px 10px", borderRadius: 20,
                  border: `1px solid ${filterErosion===v ? C.cyan : C.border}`,
                  background: filterErosion===v ? `${C.cyan}12` : "transparent",
                  color: filterErosion===v ? C.cyan : C.muted,
                  fontSize: 8, cursor: "pointer", fontFamily: "monospace",
                }}>{l}</button>
              ))}
            </div>

            <div style={{ fontSize: 9, color: C.muted, fontFamily: "monospace", marginBottom: 14 }}>
              {filteredDims.length} dimensions · Click to expand · Active threshold: 3/5
            </div>

            {filteredDims.map(dim => (
              <DimensionCard
                key={dim.id} dim={dim}
                expanded={expandedDim === dim.id}
                onToggle={id => setExpandedDim(expandedDim === id ? null : id)}
              />
            ))}

            {/* Interaction map */}
            <div style={{ marginTop: 24, padding: "16px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8 }}>
              <div style={{ fontSize: 9, color: C.gold, fontFamily: "monospace", letterSpacing: 1.5, marginBottom: 14 }}>MOAT DIMENSION INTERACTIONS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 8, color: C.green, fontFamily: "monospace", marginBottom: 8 }}>✓ REINFORCING COMBINATIONS</div>
                  {[
                    "Customer Moat + Regulatory/Compliance → dual barrier in regulated verticals",
                    "Customer Moat + Brand/Trust → low CAC from referrals + retention",
                    "Data Moat + AI Moat → feedback loop IF data is validated as differentiator (currently unproven)",
                  ].map((item, i) => (
                    <div key={i} style={{ fontSize: 10, color: C.subtle, fontFamily: "'Georgia', serif", marginBottom: 7, lineHeight: 1.5 }}>→ {item}</div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 8, color: C.red, fontFamily: "monospace", marginBottom: 8 }}>✗ WEAK / CONFLICTING COMBINATIONS</div>
                  {[
                    "AI Moat + Product Moat → both face same 12-18mo commoditization risk",
                    "Cost Advantage alone → replicable at scale by any well-funded competitor",
                    "Network Effects claimed but not demonstrated → do not invest to compound this",
                  ].map((item, i) => (
                    <div key={i} style={{ fontSize: 10, color: C.muted, fontFamily: "'Georgia', serif", marginBottom: 7, lineHeight: 1.5 }}>✗ {item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMPETITIVE BASELINE TAB */}
        {activeTab === "competitive" && (
          <div>
            <div style={{ fontSize: 9, color: C.muted, fontFamily: "monospace", marginBottom: 18 }}>
              Moats are relative. Scores for Company vs. Competitor A vs. Competitor B on identical 0–5 scale.
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr>
                    {["Dimension", "You", "Competitor A", "Competitor B", "Relative Strength"].map((h, i) => (
                      <th key={h} style={{
                        padding: "9px 12px", textAlign: i === 0 ? "left" : "center",
                        fontSize: 8, letterSpacing: 1.2, color: C.muted, fontFamily: "monospace",
                        borderBottom: `1px solid ${C.border}`, background: C.surface,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOAT_DIMENSIONS.map((dim, i) => {
                    const scores = [dim.score, dim.compA, dim.compB];
                    const maxScore = Math.max(...scores);
                    const leader = scores.indexOf(maxScore);
                    const labels = ["You lead", "Competitor A leads", "Competitor B leads"];
                    const relativeStr = scores.filter(s => s === maxScore).length > 1 ? "Tied at top" : labels[leader];
                    const relCol = leader === 0 ? C.green : leader === 1 ? C.red : C.amber;

                    return (
                      <tr key={dim.id} style={{ background: i % 2 === 0 ? C.surface : C.bg }}>
                        <td style={{ padding: "11px 12px", borderBottom: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.text, fontFamily: "'Georgia', serif" }}>{dim.label}</span>
                          <div style={{ marginTop: 3 }}><EvidenceBadge level={dim.evidence} /></div>
                        </td>
                        {[dim.score, dim.compA, dim.compB].map((s, j) => {
                          const isMax = s === maxScore;
                          const cols = [C.gold, "#FF9F50", "#A888F7"];
                          return (
                            <td key={j} style={{ padding: "11px 12px", textAlign: "center", borderBottom: `1px solid ${C.border}`, background: isMax && j === 0 ? `${C.green}08` : "transparent" }}>
                              <PipScore score={s} color={isMax ? cols[j] : C.muted} />
                            </td>
                          );
                        })}
                        <td style={{ padding: "11px 12px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: relCol, fontFamily: "monospace" }}>{relativeStr}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 14, padding: "12px 14px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 8, color: C.muted, fontFamily: "monospace", letterSpacing: 1 }}>
                ⚠ Competitor scores are inferred from public sources and internal win/loss data. Not all scores have HIGH confidence. Treat Competitor A and B scores as Medium confidence unless primary source confirms.
              </div>
            </div>
          </div>
        )}

        {/* SWOT TAB */}
        {activeTab === "swot" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              {[["all","ALL"],["S","STRENGTHS"],["W","WEAKNESSES"],["O","OPPORTUNITIES"],["T","THREATS"]].map(([v,l]) => (
                <button key={v} onClick={() => setSwotFilter(v)} style={{
                  padding: "4px 12px", borderRadius: 20,
                  border: `1px solid ${swotFilter===v ? (v==="all"?C.gold:SWOT_COLORS[v]||C.gold) : C.border}`,
                  background: swotFilter===v ? `${(v==="all"?C.gold:SWOT_COLORS[v]||C.gold)}12` : "transparent",
                  color: swotFilter===v ? (v==="all"?C.gold:SWOT_COLORS[v]||C.gold) : C.muted,
                  fontSize: 8, cursor: "pointer", fontFamily: "monospace",
                }}>{l}</button>
              ))}
            </div>
            {filteredSwot.map((item, i) => (
              <div key={i} style={{
                padding: "13px 14px", marginBottom: 8,
                background: C.surface, border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${SWOT_COLORS[item.type]}`,
                borderRadius: 6,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{
                      fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 3,
                      background: `${SWOT_COLORS[item.type]}18`, color: SWOT_COLORS[item.type],
                      fontFamily: "monospace", letterSpacing: 1,
                    }}>{SWOT_LABELS[item.type]}</span>
                    <span style={{ fontSize: 11, color: C.text, fontFamily: "'Georgia', serif" }}>{item.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <EvidenceBadge level={item.evidence} />
                    <span style={{
                      fontSize: 8, padding: "2px 6px", borderRadius: 3,
                      background: item.validated ? `${C.green}12` : `${C.amber}12`,
                      border: `1px solid ${item.validated ? C.green : C.amber}40`,
                      color: item.validated ? C.green : C.amber, fontFamily: "monospace",
                    }}>{item.validated ? "VERIFIED" : "HYPOTHESIS"}</span>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: "'Georgia', serif" }}>
                  <span style={{ color: C.subtle }}>Strategic implication: </span>{item.implication}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STRATEGIC OPTIONS TAB */}
        {activeTab === "options" && (
          <div>
            <div style={{ fontSize: 9, color: C.muted, fontFamily: "monospace", marginBottom: 18 }}>
              {STRATEGIC_OPTIONS.length} strategic options identified · Ordered by recommended priority
            </div>
            {STRATEGIC_OPTIONS.map((opt, i) => (
              <div key={i} style={{
                padding: "16px", marginBottom: 12,
                background: C.surface, border: `1px solid ${C.border}`,
                borderTop: `2px solid ${i === 0 ? C.green : i === 1 ? C.gold : i === 2 ? C.cyan : C.muted}`,
                borderRadius: 6,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 8, color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>OPTION {i+1}</div>
                    <div style={{ fontSize: 14, fontWeight: 400, color: C.text, fontStyle: "italic" }}>{opt.name}</div>
                  </div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 8, padding: "2px 8px", borderRadius: 3, background: `${C.cyan}12`, border: `1px solid ${C.cyan}30`, color: C.cyan, fontFamily: "monospace" }}>{opt.horizon}</span>
                    <span style={{
                      fontSize: 8, padding: "2px 8px", borderRadius: 3, fontFamily: "monospace",
                      background: opt.confidence === "High" ? `${C.green}12` : opt.confidence === "Medium" ? `${C.amber}12` : `${C.red}12`,
                      border: `1px solid ${opt.confidence === "High" ? C.green : opt.confidence === "Medium" ? C.amber : C.red}40`,
                      color: opt.confidence === "High" ? C.green : opt.confidence === "Medium" ? C.amber : C.red,
                    }}>{opt.confidence.toUpperCase()} CONFIDENCE</span>
                    <span style={{ fontSize: 8, padding: "2px 8px", borderRadius: 3, background: `${C.gold}12`, border: `1px solid ${C.gold}30`, color: C.gold, fontFamily: "monospace" }}>→ {opt.nextMove.toUpperCase()}</span>
                  </div>
                </div>
                <p style={{ fontSize: 11, color: C.subtle, lineHeight: 1.65, marginBottom: 10, fontFamily: "'Georgia', serif" }}>{opt.logic}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ padding: "8px 10px", background: C.surfaceAlt, borderRadius: 5 }}>
                    <div style={{ fontSize: 8, color: C.gold, fontFamily: "monospace", marginBottom: 4 }}>PRIMARY MOAT STRENGTHENED</div>
                    <div style={{ fontSize: 10, color: C.text }}>{opt.primaryMoat}</div>
                  </div>
                  <div style={{ padding: "8px 10px", background: C.surfaceAlt, borderRadius: 5 }}>
                    <div style={{ fontSize: 8, color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>EVIDENCE BASE</div>
                    <div style={{ fontSize: 10, color: C.subtle, fontFamily: "'Georgia', serif", lineHeight: 1.5 }}>{opt.evidence}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EVIDENCE LEDGER TAB */}
        {activeTab === "evidence" && (
          <div style={{ overflowX: "auto" }}>
            <div style={{ fontSize: 9, color: C.muted, fontFamily: "monospace", marginBottom: 14 }}>
              {EVIDENCE_LEDGER.length} claims in ledger · Only HIGH and MEDIUM confidence claims appear in main analysis
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>
                  {["Claim", "Source", "Type", "Date", "What It Proves", "What It Doesn't", "Conf."].map(h => (
                    <th key={h} style={{
                      padding: "8px 11px", textAlign: "left", fontSize: 8, letterSpacing: 1.2,
                      color: C.muted, fontFamily: "monospace", borderBottom: `1px solid ${C.border}`,
                      background: C.surface, whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EVIDENCE_LEDGER.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.surface : C.bg }}>
                    <td style={{ padding: "10px 11px", borderBottom: `1px solid ${C.border}`, maxWidth: 160, verticalAlign: "top" }}>
                      <span style={{ fontSize: 10, color: C.text, fontFamily: "'Georgia', serif", lineHeight: 1.5 }}>{row.claim}</span>
                    </td>
                    <td style={{ padding: "10px 11px", borderBottom: `1px solid ${C.border}`, maxWidth: 140, verticalAlign: "top" }}>
                      <span style={{ fontSize: 9, color: C.subtle, fontFamily: "'Georgia', serif" }}>{row.source}</span>
                    </td>
                    <td style={{ padding: "10px 11px", borderBottom: `1px solid ${C.border}`, verticalAlign: "top" }}>
                      <span style={{
                        fontSize: 8, padding: "2px 6px", borderRadius: 3, fontFamily: "monospace",
                        background: row.type === "Primary" ? `${C.green}12` : `${C.amber}12`,
                        border: `1px solid ${row.type === "Primary" ? C.green : C.amber}35`,
                        color: row.type === "Primary" ? C.green : C.amber,
                      }}>{row.type.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: "10px 11px", borderBottom: `1px solid ${C.border}`, verticalAlign: "top", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 9, color: C.muted, fontFamily: "monospace" }}>{row.date}</span>
                    </td>
                    <td style={{ padding: "10px 11px", borderBottom: `1px solid ${C.border}`, maxWidth: 160, verticalAlign: "top" }}>
                      <span style={{ fontSize: 9, color: C.subtle, fontFamily: "'Georgia', serif", lineHeight: 1.5 }}>{row.proves}</span>
                    </td>
                    <td style={{ padding: "10px 11px", borderBottom: `1px solid ${C.border}`, maxWidth: 160, verticalAlign: "top" }}>
                      <span style={{ fontSize: 9, color: C.muted, fontFamily: "'Georgia', serif", lineHeight: 1.5 }}>{row.doesnt}</span>
                    </td>
                    <td style={{ padding: "10px 11px", borderBottom: `1px solid ${C.border}`, verticalAlign: "top" }}>
                      <EvidenceBadge level={row.confidence} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* QUARTERLY CHECKLIST TAB */}
        {activeTab === "checklist" && (
          <div>
            <div style={{ fontSize: 9, color: C.muted, fontFamily: "monospace", marginBottom: 18 }}>
              Use this checklist each quarter to assess whether the moat is strengthening or eroding.
            </div>
            {[
              { q: "Which claimed moats have strengthened? Which weakened?", note: "Compare score changes vs. prior quarter. Document the evidence for any change." },
              { q: "Has a new competitor emerged that attacks a specific moat dimension?", note: "Check funding announcements, new entrants, and product launches in the category." },
              { q: "Have customer retention / churn metrics changed directionally?", note: "A rising churn trend is the most important early warning signal for customer moat erosion." },
              { q: "Have win/loss reasons vs. competitors shifted?", note: "Are customers citing new alternatives? New feature gaps? Different price comparisons?" },
              { q: "Is the product roadmap reinforcing or eroding claimed moats?", note: "Review roadmap against the moat dimension investment priorities in Section 12." },
              { q: "Have regulatory or market conditions changed?", note: "Compliance moat is most vulnerable to regulatory change. Monitor policy developments quarterly." },
              { q: "Which unknowns from the validation plan have been resolved?", note: "Review the validation plan table. Update confidence levels for resolved unknowns." },
              { q: "What early warning indicators of erosion are flashing?", note: "Reference Section 16 for the specific early warning signals defined per active moat." },
              { q: "Should the moat rating be upgraded, downgraded, or held?", note: "Require evidence to change the rating. No directional changes without supporting data." },
              { q: "What is the most urgent moat-building action in the next quarter?", note: "Single most important action. Assign an owner before ending the review." },
            ].map((item, i) => {
              const [checked, setChecked] = useState(false);
              return (
                <div key={i} onClick={() => setChecked(!checked)} style={{
                  display: "flex", gap: 12, padding: "13px 14px", marginBottom: 7,
                  background: checked ? `${C.green}08` : C.surface,
                  border: `1px solid ${checked ? C.green + "40" : C.border}`,
                  borderRadius: 6, cursor: "pointer", transition: "all 0.2s",
                }}>
                  <div style={{
                    minWidth: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${checked ? C.green : C.muted}`,
                    background: checked ? `${C.green}30` : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: 1,
                  }}>
                    {checked && <span style={{ fontSize: 10, color: C.green }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: checked ? C.subtle : C.text, fontFamily: "'Georgia', serif", marginBottom: 4, textDecoration: checked ? "line-through" : "none" }}>
                      {item.q}
                    </div>
                    <div style={{ fontSize: 9, color: C.muted, fontFamily: "monospace", lineHeight: 1.5 }}>{item.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Score Legend */}
        <div style={{ marginTop: 28, padding: "12px 16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6 }}>
          <div style={{ fontSize: 8, color: C.muted, fontFamily: "monospace", letterSpacing: 1.5, marginBottom: 10 }}>SCORE LEGEND</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { score: "5", desc: "Durable, compounding, hard-to-copy advantage", col: C.green },
              { score: "4", desc: "Strong advantage with reinforcing mechanisms", col: C.gold },
              { score: "3", desc: "Moderate advantage with some defensibility (active threshold)", col: C.amber },
              { score: "2", desc: "Some differentiation but limited durability", col: C.muted },
              { score: "1", desc: "Weak or easily copied advantage", col: C.red },
              { score: "0", desc: "No evidence of advantage", col: "#3A3A3A" },
            ].map(item => (
              <div key={item.score} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: item.col }} />
                <span style={{ fontSize: 9, color: C.muted, fontFamily: "monospace" }}>{item.score} — {item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
