import { useState, useMemo } from "react";

const TIER_CONFIG = {
  1: { label: "NOW", color: "#E8FF47", bg: "rgba(232,255,71,0.12)", border: "#E8FF47" },
  2: { label: "NEXT", color: "#47C8FF", bg: "rgba(71,200,255,0.10)", border: "#47C8FF" },
  3: { label: "LATER", color: "#A78BFA", bg: "rgba(167,139,250,0.10)", border: "#A78BFA" },
  4: { label: "PARK", color: "#6B7280", bg: "rgba(107,114,128,0.08)", border: "#374151" },
  5: { label: "KILL", color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "#EF4444" },
};

const WEIGHTS = {
  strategic: 0.25,
  customer: 0.20,
  revenue: 0.20,
  effort: 0.15,
  confidence: 0.10,
  urgency: 0.05,
  risk: 0.05,
};

const DIM_LABELS = {
  strategic: "Strategic Alignment",
  customer: "Customer Impact",
  revenue: "Revenue Impact",
  effort: "Effort (Inv.)",
  confidence: "Confidence",
  urgency: "Time Sensitivity",
  risk: "Strategic Risk",
};

const DIM_COLORS = {
  strategic: "#E8FF47",
  customer: "#47C8FF",
  revenue: "#A78BFA",
  effort: "#34D399",
  confidence: "#F59E0B",
  urgency: "#FB923C",
  risk: "#F87171",
};

const SAMPLE_ITEMS = [
  {
    id: 1,
    name: "AI-Powered Onboarding Flow",
    bucket: "Activation",
    description: "Personalized onboarding that adapts to user role and use case",
    source: "Customer interviews (n=18), NPS driver analysis",
    scores: { strategic: 5, customer: 5, revenue: 4, effort: 3, confidence: 5, urgency: 4, risk: 5 },
    assumption: "Personalized onboarding reduces time-to-value by ≥40%",
    effort_label: "M",
    evidence: "High",
  },
  {
    id: 2,
    name: "Enterprise SSO + SCIM",
    bucket: "Enterprise",
    description: "Single sign-on and user provisioning for enterprise accounts",
    source: "Sales win/loss data: 8 enterprise deals blocked in Q2",
    scores: { strategic: 5, customer: 4, revenue: 5, effort: 2, confidence: 4, urgency: 5, risk: 5 },
    assumption: "SSO is the primary blocker for enterprise deals (not security audit)",
    effort_label: "M",
    evidence: "High",
  },
  {
    id: 3,
    name: "Bulk Data Import / CSV Upload",
    bucket: "Core Product",
    description: "Allow users to import historical data via CSV or API",
    source: "Support tickets (47 in 90 days), 3 churned customers cited this",
    scores: { strategic: 4, customer: 4, revenue: 4, effort: 4, confidence: 4, urgency: 3, risk: 3 },
    assumption: "Removing import friction materially increases activation rate",
    effort_label: "S",
    evidence: "High",
  },
  {
    id: 4,
    name: "Slack Integration",
    bucket: "Integrations",
    description: "Receive alerts and summaries in Slack channels",
    source: "Feature request votes (2nd most upvoted), competitive: Competitor A has this",
    scores: { strategic: 3, customer: 4, revenue: 3, effort: 4, confidence: 3, urgency: 2, risk: 2 },
    assumption: "Slack integration increases DAU by reducing need to return to app",
    effort_label: "S",
    evidence: "Medium",
  },
  {
    id: 5,
    name: "Custom Report Builder",
    bucket: "Analytics",
    description: "Drag-and-drop interface for building custom dashboards",
    source: "4 enterprise requests, 1 large account threatening churn",
    scores: { strategic: 3, customer: 3, revenue: 3, effort: 2, confidence: 2, urgency: 3, risk: 3 },
    assumption: "Custom reports are valued by >20% of customer base, not just 4 accounts",
    effort_label: "L",
    evidence: "Low",
  },
  {
    id: 6,
    name: "Mobile App — iOS",
    bucket: "Platform",
    description: "Native iOS mobile application for core workflows",
    source: "Customer survey: 31% say they want mobile access",
    scores: { strategic: 2, customer: 3, revenue: 2, effort: 1, confidence: 2, urgency: 2, risk: 2 },
    assumption: "Mobile access drives retention / engagement (unvalidated)",
    effort_label: "XL",
    evidence: "Low",
  },
  {
    id: 7,
    name: "API Rate Limit Increase",
    bucket: "Infrastructure",
    description: "Increase API throughput limits for high-volume customers",
    source: "2 enterprise accounts hitting limits, 1 at risk of churn",
    scores: { strategic: 3, customer: 4, revenue: 4, effort: 5, confidence: 5, urgency: 4, risk: 4 },
    assumption: "Rate limit increase retains these 2 accounts without adding significant infra cost",
    effort_label: "S",
    evidence: "High",
  },
  {
    id: 8,
    name: "White-Label / Reseller Mode",
    bucket: "Platform",
    description: "Allow partners to resell the product under their own brand",
    source: "1 inbound partner request, unvalidated market demand",
    scores: { strategic: 2, customer: 2, revenue: 3, effort: 1, confidence: 1, urgency: 1, risk: 1 },
    assumption: "There is sufficient partner demand to justify platform investment",
    effort_label: "XL",
    evidence: "Low",
  },
  {
    id: 9,
    name: "Audit Log & Compliance Export",
    bucket: "Enterprise",
    description: "Full activity log for security / compliance audits (SOC2 related)",
    source: "Required for 3 enterprise prospects in financial services vertical",
    scores: { strategic: 4, customer: 3, revenue: 4, effort: 3, confidence: 4, urgency: 4, risk: 4 },
    assumption: "Financial services is a target vertical in the current plan",
    effort_label: "M",
    evidence: "Medium",
  },
  {
    id: 10,
    name: "In-App NPS + Feedback Widget",
    bucket: "Growth",
    description: "Automated NPS collection and qualitative feedback inside the product",
    source: "PM team initiative — currently no systematic feedback loop in-product",
    scores: { strategic: 3, customer: 2, revenue: 2, effort: 5, confidence: 3, urgency: 2, risk: 2 },
    assumption: "In-app feedback generates actionable signal vs. existing survey methods",
    effort_label: "S",
    evidence: "Medium",
  },
];

function calcWPS(scores) {
  return Object.keys(WEIGHTS).reduce((sum, k) => sum + (scores[k] || 0) * WEIGHTS[k], 0);
}

function getTier(wps, confidence) {
  if (confidence === "Low" && wps > 3.5) return 3;
  if (wps >= 4.5) return 1;
  if (wps >= 3.5) return 2;
  if (wps >= 2.5) return 3;
  if (wps >= 1.5) return 4;
  return 5;
}

function ScoreBar({ score, dim }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "mono" }}>{DIM_LABELS[dim]}</span>
        <span style={{ fontSize: 10, color: DIM_COLORS[dim], fontFamily: "mono", fontWeight: 700 }}>{score}/5</span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(score / 5) * 100}%`, background: DIM_COLORS[dim], borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function ItemCard({ item, expanded, onToggle, onCompare, inCompare }) {
  const wps = calcWPS(item.scores);
  const tier = getTier(wps, item.evidence);
  const tc = TIER_CONFIG[tier];

  return (
    <div
      onClick={() => onToggle(item.id)}
      style={{
        border: `1px solid ${expanded ? tc.border : "rgba(255,255,255,0.07)"}`,
        borderRadius: 8,
        background: expanded ? tc.bg : "rgba(255,255,255,0.02)",
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        marginBottom: 8,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          minWidth: 48, height: 22, borderRadius: 4,
          background: tc.bg, border: `1px solid ${tc.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: tc.color, letterSpacing: 1.2, fontFamily: "mono" }}>{tc.label}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#F9FAFB", flex: 1, fontFamily: "'DM Sans', sans-serif" }}>{item.name}</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{
            fontSize: 9, padding: "2px 7px", borderRadius: 20,
            background: "rgba(255,255,255,0.06)", color: "#9CA3AF",
            fontFamily: "mono", letterSpacing: 0.5,
          }}>{item.bucket}</span>
          <div style={{
            width: 38, height: 22, borderRadius: 4,
            background: "rgba(0,0,0,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: tc.color, fontFamily: "mono" }}>{wps.toFixed(1)}</span>
          </div>
          <span style={{
            fontSize: 9, padding: "2px 7px", borderRadius: 4,
            background: item.evidence === "High" ? "rgba(52,211,153,0.12)" : item.evidence === "Medium" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
            color: item.evidence === "High" ? "#34D399" : item.evidence === "Medium" ? "#F59E0B" : "#F87171",
            fontFamily: "mono", fontWeight: 600,
          }}>{item.evidence}</span>
          <button
            onClick={e => { e.stopPropagation(); onCompare(item.id); }}
            style={{
              padding: "2px 8px", borderRadius: 4, border: `1px solid ${inCompare ? "#E8FF47" : "rgba(255,255,255,0.12)"}`,
              background: inCompare ? "rgba(232,255,71,0.12)" : "transparent",
              color: inCompare ? "#E8FF47" : "#6B7280", fontSize: 9, cursor: "pointer", fontFamily: "mono",
            }}
          >CMP</button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 10, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>{item.description}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 }}>
            <div>
              {["strategic", "customer", "revenue", "effort"].map(d => <ScoreBar key={d} score={item.scores[d]} dim={d} />)}
            </div>
            <div>
              {["confidence", "urgency", "risk"].map(d => <ScoreBar key={d} score={item.scores[d]} dim={d} />)}
              <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 9, color: "#6B7280", marginBottom: 4, fontFamily: "mono", letterSpacing: 0.5 }}>KEY ASSUMPTION</div>
                <div style={{ fontSize: 11, color: "#D1D5DB", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{item.assumption}</div>
              </div>
            </div>
          </div>
          <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: 9, color: "#6B7280", fontFamily: "mono" }}>SOURCE: </span>
            <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "'DM Sans', sans-serif" }}>{item.source}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ComparePanel({ ids, items, onClose }) {
  if (ids.length < 2) return (
    <div style={{ padding: "20px 16px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 8, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "#4B5563", fontFamily: "'DM Sans', sans-serif" }}>Select 2 items using the CMP button to compare them head-to-head</div>
    </div>
  );
  const a = items.find(i => i.id === ids[0]);
  const b = items.find(i => i.id === ids[1]);
  if (!a || !b) return null;
  const wpsA = calcWPS(a.scores);
  const wpsB = calcWPS(b.scores);

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: "#E8FF47", fontFamily: "mono", letterSpacing: 1 }}>TRADE-OFF COMPARISON</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 16 }}>×</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "start" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#F9FAFB", marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>{a.name}</div>
          {Object.keys(WEIGHTS).map(d => (
            <div key={d} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, padding: "4px 0" }}>
              <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "mono" }}>{DIM_LABELS[d]}</span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(a.scores[d] / 5) * 100}%`, background: a.scores[d] >= b.scores[d] ? "#E8FF47" : "#374151", transition: "width 0.5s" }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: a.scores[d] >= b.scores[d] ? "#E8FF47" : "#4B5563", fontFamily: "mono", width: 16, textAlign: "right" }}>{a.scores[d]}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10, padding: "6px 8px", background: "rgba(232,255,71,0.08)", border: "1px solid rgba(232,255,71,0.2)", borderRadius: 6 }}>
            <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "mono" }}>WPS: </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#E8FF47", fontFamily: "mono" }}>{wpsA.toFixed(2)}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 28 }}>
          <span style={{ fontSize: 18, color: "rgba(255,255,255,0.1)", fontFamily: "mono" }}>vs</span>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#F9FAFB", marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>{b.name}</div>
          {Object.keys(WEIGHTS).map(d => (
            <div key={d} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, padding: "4px 0" }}>
              <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "mono" }}>{DIM_LABELS[d]}</span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(b.scores[d] / 5) * 100}%`, background: b.scores[d] >= a.scores[d] ? "#47C8FF" : "#374151", transition: "width 0.5s" }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: b.scores[d] >= a.scores[d] ? "#47C8FF" : "#4B5563", fontFamily: "mono", width: 16, textAlign: "right" }}>{b.scores[d]}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10, padding: "6px 8px", background: "rgba(71,200,255,0.08)", border: "1px solid rgba(71,200,255,0.2)", borderRadius: 6 }}>
            <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "mono" }}>WPS: </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#47C8FF", fontFamily: "mono" }}>{wpsB.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoadmapDashboard() {
  const [activeTab, setActiveTab] = useState("matrix");
  const [expanded, setExpanded] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [filterTier, setFilterTier] = useState("all");
  const [filterBucket, setFilterBucket] = useState("all");
  const [filterEvidence, setFilterEvidence] = useState("all");
  const [sortBy, setSortBy] = useState("wps");

  const itemsWithScores = useMemo(() => SAMPLE_ITEMS.map(item => ({
    ...item,
    wps: calcWPS(item.scores),
    tier: getTier(calcWPS(item.scores), item.evidence),
  })), []);

  const buckets = useMemo(() => ["all", ...new Set(SAMPLE_ITEMS.map(i => i.bucket))], []);

  const filtered = useMemo(() => itemsWithScores
    .filter(i => filterTier === "all" || i.tier === parseInt(filterTier))
    .filter(i => filterBucket === "all" || i.bucket === filterBucket)
    .filter(i => filterEvidence === "all" || i.evidence === filterEvidence)
    .sort((a, b) => sortBy === "wps" ? b.wps - a.wps : a.name.localeCompare(b.name)),
    [itemsWithScores, filterTier, filterBucket, filterEvidence, sortBy]
  );

  const tiers = [1, 2, 3, 4, 5];

  const handleCompare = (id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const tierCounts = useMemo(() => tiers.reduce((acc, t) => ({
    ...acc, [t]: itemsWithScores.filter(i => i.tier === t).length
  }), {}), [itemsWithScores]);

  const tabs = [
    { id: "matrix", label: "PRIORITY MATRIX" },
    { id: "board", label: "NOW / NEXT / LATER" },
    { id: "compare", label: "TRADE-OFF" },
    { id: "evidence", label: "EVIDENCE LEDGER" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0C10",
      color: "#F9FAFB",
      fontFamily: "'DM Sans', sans-serif",
      padding: "0 0 60px",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "22px 28px 18px",
        background: "rgba(0,0,0,0.4)",
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(16px)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2.5, color: "#4B5563", fontFamily: "monospace", marginBottom: 5 }}>
              ROADMAP PRIORITIZATION AGENT
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#F9FAFB", letterSpacing: -0.5 }}>
              Q3 2025 — Acme SaaS
            </div>
            <div style={{ fontSize: 11, color: "#4B5563", marginTop: 3, fontFamily: "monospace" }}>
              10 items scored · Planning cycle: Jul–Sep 2025 · Generated May 29, 2026
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "NOW", count: tierCounts[1] || 0, color: "#E8FF47" },
              { label: "NEXT", count: tierCounts[2] || 0, color: "#47C8FF" },
              { label: "LATER", count: tierCounts[3] || 0, color: "#A78BFA" },
              { label: "PARK/KILL", count: (tierCounts[4] || 0) + (tierCounts[5] || 0), color: "#6B7280" },
            ].map(t => (
              <div key={t.label} style={{
                textAlign: "center", padding: "8px 14px",
                background: "rgba(255,255,255,0.03)",
                border: `1px solid rgba(255,255,255,0.07)`,
                borderRadius: 8,
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: t.color, fontFamily: "monospace" }}>{t.count}</div>
                <div style={{ fontSize: 8, color: "#4B5563", letterSpacing: 1.2, fontFamily: "monospace" }}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Objectives */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {[
            { obj: "↑ Activation Rate to 65%", w: "25% Strategic" },
            { obj: "↑ Enterprise ARR +$2M", w: "20% Revenue" },
            { obj: "Reduce churn to <4% MoM", w: "20% Customer" },
          ].map((o, i) => (
            <div key={i} style={{
              padding: "5px 12px", borderRadius: 20,
              background: "rgba(232,255,71,0.06)",
              border: "1px solid rgba(232,255,71,0.15)",
              fontSize: 10, color: "#D1D5DB", fontFamily: "monospace",
            }}>
              <span style={{ color: "#E8FF47" }}>{o.obj}</span>
              <span style={{ color: "#4B5563" }}> · {o.w}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 28px" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: "12px 18px", background: "none", border: "none",
              borderBottom: activeTab === t.id ? "2px solid #E8FF47" : "2px solid transparent",
              color: activeTab === t.id ? "#E8FF47" : "#4B5563",
              fontSize: 10, letterSpacing: 1.5, cursor: "pointer", fontFamily: "monospace",
              fontWeight: activeTab === t.id ? 700 : 400,
              transition: "all 0.2s",
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "20px 28px" }}>

        {/* MATRIX TAB */}
        {activeTab === "matrix" && (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 9, color: "#4B5563", fontFamily: "monospace", letterSpacing: 1 }}>FILTER:</span>
              {["all", "1", "2", "3", "4", "5"].map(t => (
                <button key={t} onClick={() => setFilterTier(t)}
                  style={{
                    padding: "4px 12px", borderRadius: 20,
                    border: `1px solid ${filterTier === t ? "#E8FF47" : "rgba(255,255,255,0.08)"}`,
                    background: filterTier === t ? "rgba(232,255,71,0.1)" : "transparent",
                    color: filterTier === t ? "#E8FF47" : "#6B7280",
                    fontSize: 9, cursor: "pointer", fontFamily: "monospace",
                  }}>
                  {t === "all" ? "ALL" : TIER_CONFIG[parseInt(t)].label}
                </button>
              ))}
              <span style={{ fontSize: 9, color: "#4B5563", fontFamily: "monospace", letterSpacing: 1, marginLeft: 8 }}>BUCKET:</span>
              {buckets.map(b => (
                <button key={b} onClick={() => setFilterBucket(b)}
                  style={{
                    padding: "4px 12px", borderRadius: 20,
                    border: `1px solid ${filterBucket === b ? "#47C8FF" : "rgba(255,255,255,0.08)"}`,
                    background: filterBucket === b ? "rgba(71,200,255,0.08)" : "transparent",
                    color: filterBucket === b ? "#47C8FF" : "#6B7280",
                    fontSize: 9, cursor: "pointer", fontFamily: "monospace",
                  }}>
                  {b === "all" ? "ALL" : b.toUpperCase()}
                </button>
              ))}
              <span style={{ fontSize: 9, color: "#4B5563", fontFamily: "monospace", letterSpacing: 1, marginLeft: 8 }}>EVIDENCE:</span>
              {["all", "High", "Medium", "Low"].map(e => (
                <button key={e} onClick={() => setFilterEvidence(e)}
                  style={{
                    padding: "4px 12px", borderRadius: 20,
                    border: `1px solid ${filterEvidence === e ? "#A78BFA" : "rgba(255,255,255,0.08)"}`,
                    background: filterEvidence === e ? "rgba(167,139,250,0.08)" : "transparent",
                    color: filterEvidence === e ? "#A78BFA" : "#6B7280",
                    fontSize: 9, cursor: "pointer", fontFamily: "monospace",
                  }}>
                  {e.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 10, color: "#4B5563", marginBottom: 12, fontFamily: "monospace" }}>
              {filtered.length} items · Click any item to expand · CMP to compare
            </div>

            {filtered.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                expanded={expanded === item.id}
                onToggle={id => setExpanded(expanded === id ? null : id)}
                onCompare={handleCompare}
                inCompare={compareIds.includes(item.id)}
              />
            ))}
          </div>
        )}

        {/* BOARD TAB */}
        {activeTab === "board" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { tier: 1, title: "NOW", subtitle: "Ship this cycle" },
              { tier: 2, title: "NEXT", subtitle: "Plan next cycle" },
              { tier: 3, title: "LATER", subtitle: "Backlog / revisit" },
            ].map(col => {
              const tc = TIER_CONFIG[col.tier];
              const colItems = itemsWithScores.filter(i => i.tier === col.tier).sort((a, b) => b.wps - a.wps);
              return (
                <div key={col.tier}>
                  <div style={{
                    padding: "10px 14px", marginBottom: 12,
                    background: tc.bg,
                    border: `1px solid ${tc.border}`,
                    borderRadius: 8,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: tc.color, fontFamily: "monospace", letterSpacing: 1 }}>{col.title}</div>
                    <div style={{ fontSize: 10, color: "#6B7280", fontFamily: "monospace" }}>{col.subtitle} · {colItems.length} items</div>
                  </div>
                  {colItems.map(item => (
                    <div key={item.id} style={{
                      padding: "12px 14px", marginBottom: 8,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 8,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#F9FAFB" }}>{item.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: tc.color, fontFamily: "monospace" }}>{item.wps.toFixed(1)}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, background: "rgba(255,255,255,0.05)", color: "#6B7280", fontFamily: "monospace" }}>{item.bucket}</span>
                        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3,
                          background: item.evidence === "High" ? "rgba(52,211,153,0.1)" : item.evidence === "Medium" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                          color: item.evidence === "High" ? "#34D399" : item.evidence === "Medium" ? "#F59E0B" : "#F87171",
                          fontFamily: "monospace",
                        }}>{item.evidence} evidence</span>
                        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, background: "rgba(255,255,255,0.05)", color: "#6B7280", fontFamily: "monospace" }}>{item.effort_label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* COMPARE TAB */}
        {activeTab === "compare" && (
          <div>
            <div style={{ fontSize: 10, color: "#4B5563", marginBottom: 16, fontFamily: "monospace" }}>
              Select items using CMP buttons in the Priority Matrix, then compare them here.
            </div>
            <ComparePanel ids={compareIds} items={itemsWithScores} onClose={() => setCompareIds([])} />
            {compareIds.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 9, color: "#4B5563", letterSpacing: 1.5, fontFamily: "monospace", marginBottom: 12 }}>ALL ITEMS — SELECT FOR COMPARISON</div>
                {itemsWithScores.map(item => {
                  const tc = TIER_CONFIG[item.tier];
                  return (
                    <div key={item.id} onClick={() => handleCompare(item.id)} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                      marginBottom: 6, borderRadius: 8, cursor: "pointer",
                      background: compareIds.includes(item.id) ? "rgba(232,255,71,0.05)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${compareIds.includes(item.id) ? "#E8FF47" : "rgba(255,255,255,0.06)"}`,
                    }}>
                      <div style={{ minWidth: 42, height: 20, borderRadius: 3, background: tc.bg, border: `1px solid ${tc.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 8, fontWeight: 800, color: tc.color, letterSpacing: 1, fontFamily: "monospace" }}>{tc.label}</span>
                      </div>
                      <span style={{ fontSize: 12, color: "#D1D5DB", flex: 1 }}>{item.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: tc.color, fontFamily: "monospace" }}>{item.wps.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* EVIDENCE LEDGER TAB */}
        {activeTab === "evidence" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>
                  {["Item", "Claim", "Source", "What It Proves", "Limitations", "Confidence"].map(h => (
                    <th key={h} style={{
                      padding: "8px 12px", textAlign: "left",
                      fontSize: 9, letterSpacing: 1.2, color: "#4B5563",
                      fontFamily: "monospace", borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itemsWithScores.map((item, i) => (
                  <tr key={item.id} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                    <td style={{ padding: "10px 12px", color: "#F9FAFB", fontWeight: 600, verticalAlign: "top", maxWidth: 140, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{item.name}</td>
                    <td style={{ padding: "10px 12px", color: "#9CA3AF", verticalAlign: "top", maxWidth: 180, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{item.assumption}</td>
                    <td style={{ padding: "10px 12px", color: "#6B7280", verticalAlign: "top", maxWidth: 180, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{item.source}</td>
                    <td style={{ padding: "10px 12px", color: "#9CA3AF", verticalAlign: "top", maxWidth: 180, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      {item.evidence === "High" ? "Strong signal — customer research or revenue data supports this directly" : item.evidence === "Medium" ? "Indirect signal — qualitative or partial data" : "Weak signal — single source or unvalidated"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#6B7280", verticalAlign: "top", maxWidth: 160, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      {item.evidence === "Low" ? "Requires validation before committing capacity" : item.evidence === "Medium" ? "May not represent full ICP" : "Evidence is current; may age"}
                    </td>
                    <td style={{ padding: "10px 12px", verticalAlign: "top", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{
                        fontSize: 9, padding: "3px 8px", borderRadius: 4, fontFamily: "monospace", fontWeight: 700,
                        background: item.evidence === "High" ? "rgba(52,211,153,0.12)" : item.evidence === "Medium" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                        color: item.evidence === "High" ? "#34D399" : item.evidence === "Medium" ? "#F59E0B" : "#F87171",
                      }}>{item.evidence.toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Weight Legend */}
        <div style={{ marginTop: 28, padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
          <div style={{ fontSize: 9, color: "#4B5563", letterSpacing: 1.5, fontFamily: "monospace", marginBottom: 10 }}>SCORING MODEL — CALIBRATED WEIGHTS</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {Object.entries(WEIGHTS).map(([k, w]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: DIM_COLORS[k] }} />
                <span style={{ fontSize: 10, color: "#6B7280", fontFamily: "monospace" }}>{DIM_LABELS[k]}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: DIM_COLORS[k], fontFamily: "monospace" }}>{Math.round(w * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
