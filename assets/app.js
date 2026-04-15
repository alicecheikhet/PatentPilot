
const STORAGE_KEY = "patentpilot_matter_v2";
const DB_KEY = "patentpilot_db_v2";

const DEFAULT_DB = [
  {
    id: "PP-001",
    title: "Microfluidic reagent cartridge",
    domain: "Biochemistry",
    problem: "Contamination during small-volume reagent mixing.",
    features: ["sealed cartridge", "two-stage mixing path", "calibration channel", "disposable insert"],
    notes: "Useful comparator for lab automation and sample prep.",
    patentNumber: "US11033905B2",
    patentUrl: "https://patents.google.com/patent/US11033905B2/en"
  },
  {
    id: "PP-002",
    title: "Wearable hydration biosensor patch",
    domain: "Biotech",
    problem: "Noninvasive electrolyte and hydration tracking.",
    features: ["skin patch", "electrochemical sensor", "wireless output", "adaptive calibration"],
    notes: "Useful for biosensing and wearable health inventions.",
    patentNumber: "WO2021216614A1",
    patentUrl: "https://patents.google.com/patent/WO2021216614A1/en"
  },
  {
    id: "PP-003",
    title: "Enzyme-stabilizing storage matrix",
    domain: "Chemistry",
    problem: "Activity loss during room-temperature storage.",
    features: ["polymer matrix", "lyophilized enzyme", "buffer reservoir", "humidity barrier"],
    notes: "Good comparator for formulation and storage inventions.",
    patentNumber: "US20240167014A1",
    patentUrl: "https://patents.google.com/patent/US20240167014A1/en"
  }
];

const SAMPLE_MATTER = {
  matterName: "Adaptive Enzyme Preservation System",
  domain: "Biochemistry",
  summary: "A storage vessel preserves enzyme activity using layered polymer compartments, humidity sensing, and automatically released stabilizer solution when drift exceeds a threshold.",
  problem: "Enzymes lose activity during storage and transport because temperature and humidity changes destabilize the formulation before use.",
  noveltyFocus: "layered storage, threshold-triggered stabilizer release, embedded humidity sensing",
  claimText: "1. A biochemical storage system comprising: a vessel including a first compartment containing an enzyme formulation; a second compartment containing a stabilizer solution; a humidity sensor positioned within the vessel; and a trigger mechanism configured to release the stabilizer solution into the first compartment when measured humidity exceeds a threshold. 2. The system of claim 1, wherein the trigger mechanism comprises a rupturable membrane. 3. The system of claim 1, wherein the vessel further includes a thermal buffer sleeve.",
  referencesText: "Reference A: enzyme storage matrix with polymer barrier and lyophilized reagent. Features: polymer matrix, enzyme preservation, humidity barrier.\nReference B: smart cartridge with sensor-triggered release. Features: humidity sensor, trigger mechanism, sealed compartment, automatic release.\nReference C: thermal sleeve for reagent shipping container. Features: thermal buffer sleeve, insulated vessel, transport stability.",
  inventorGoals: "Preserve enzyme activity, differentiate from standard storage kits, prepare for provisional filing with clean independent claim strategy."
};

function getDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB, null, 2));
    return structuredClone(DEFAULT_DB);
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch(e){}
  localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB, null, 2));
  return structuredClone(DEFAULT_DB);
}

function setDB(db) {
  const fallback = {
    "PP-001": { patentNumber: "US11033905B2", patentUrl: "https://patents.google.com/patent/US11033905B2/en" },
    "PP-002": { patentNumber: "WO2021216614A1", patentUrl: "https://patents.google.com/patent/WO2021216614A1/en" },
    "PP-003": { patentNumber: "US20240167014A1", patentUrl: "https://patents.google.com/patent/US20240167014A1/en" }
  };
  const normalized = (db || []).map(entry => fallback[entry.id] ? { ...entry, patentNumber: entry.patentNumber || fallback[entry.id].patentNumber, patentUrl: entry.patentUrl || fallback[entry.id].patentUrl } : entry);
  localStorage.setItem(DB_KEY, JSON.stringify(normalized, null, 2));
}

function getMatter() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch(e) { return null; }
}

function setMatter(m) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
}

function clearMatter() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY + "_results");
}

function getResults() {
  const raw = localStorage.getItem(STORAGE_KEY + "_results");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch(e){ return null; }
}

function setResults(r) {
  localStorage.setItem(STORAGE_KEY + "_results", JSON.stringify(r));
}

function byId(id){ return document.getElementById(id); }

function fillMatterForm(m) {
  const fields = ["matterName","domain","summary","problem","noveltyFocus","claimText","referencesText","inventorGoals"];
  fields.forEach(k => { const el = byId(k); if (el) el.value = m?.[k] || ""; });
}

function collectMatterFromForm() {
  return {
    matterName: byId("matterName")?.value.trim() || "",
    domain: byId("domain")?.value.trim() || "",
    summary: byId("summary")?.value.trim() || "",
    problem: byId("problem")?.value.trim() || "",
    noveltyFocus: byId("noveltyFocus")?.value.trim() || "",
    claimText: byId("claimText")?.value.trim() || "",
    referencesText: byId("referencesText")?.value.trim() || "",
    inventorGoals: byId("inventorGoals")?.value.trim() || ""
  };
}

function parseClaims(text) {
  if (!text) return [];
  const claims = [];
  const regex = /(\d+)\.\s*([\s\S]*?)(?=(?:\n?\s*\d+\.)|$)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const num = match[1];
    const body = match[2].replace(/\s+/g, ' ').trim();
    const cleaned = body.replace(/^A\s+|^An\s+|^The\s+/i, '');
    const chunks = cleaned.split(/\bcomprising:|\bcomprising\b|;|, and\b| and\b/i).map(s => s.trim()).filter(Boolean);
    const limitations = chunks.map((c, i) => ({
      text: c.replace(/\.$/, ""),
      key: limitationKeyword(c),
      idx: i + 1
    }));
    claims.push({ number: num, text: body, limitations });
  }
  if (!claims.length && text.trim()) {
    const body = text.trim();
    const chunks = body.split(/\bcomprising:|\bcomprising\b|;|, and\b| and\b/i).map(s=>s.trim()).filter(Boolean);
    claims.push({
      number: "1",
      text: body,
      limitations: chunks.map((c,i)=>({ text:c.replace(/\.$/, ""), key: limitationKeyword(c), idx: i+1 }))
    });
  }
  return claims;
}

function limitationKeyword(text) {
  const lower = text.toLowerCase();
  const candidates = ["sensor","trigger","release","compartment","vessel","sleeve","matrix","wireless","polymer","enzyme","buffer","patch","calibration","thermal","barrier","membrane"];
  for (const c of candidates) if (lower.includes(c)) return c;
  const words = lower.replace(/[^a-z0-9\s-]/g,'').split(/\s+/).filter(w => w.length > 4);
  return words[0] || "feature";
}


function computeSimilarity(m, refs, chart) {
  const domain = (m.domain || "").toLowerCase();
  const noveltyTerms = (m.noveltyFocus || "").toLowerCase().split(/,|;|\n/).map(s=>s.trim()).filter(Boolean);
  const claimWords = Array.from(new Set((m.claimText || "").toLowerCase().replace(/[^a-z0-9\s-]/g," ").split(/\s+/).filter(w => w.length > 4)));
  const candidates = refs.filter(r => r.source === "database");
  if (!candidates.length) return [];

  const ranked = candidates.map(ref => {
    const features = ref.features || [];
    const featureMatches = features.filter(f => claimWords.some(w => f.includes(w) || w.includes(f)) || noveltyTerms.some(t => f.includes(t) || t.includes(f)));
    const mappedMentions = chart.filter(row => (row.mappedTo || []).includes(ref.title)).length;
    const domainBoost = domain && ref.domain && ref.domain.toLowerCase() === domain ? 10 : 0;
    const raw = 35 + featureMatches.length * 12 + mappedMentions * 10 + domainBoost;
    const similarity = Math.max(12, Math.min(96, raw));
    return {
      title: ref.title,
      similarity,
      patentNumber: ref.patentNumber || "",
      patentUrl: ref.patentUrl || "",
      domain: ref.domain || "",
      matchedFeatures: featureMatches.slice(0,4)
    };
  }).sort((a,b) => b.similarity - a.similarity);

  return ranked.slice(0,3);
}

function parseReferences(text, db = getDB()) {
  const refs = [];
  const lines = text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  lines.forEach((line, idx) => {
    const parts = line.split("Features:");
    const head = parts[0] || line;
    const featureText = parts[1] || "";
    const title = head.replace(/^Reference\s*[A-Z0-9-]*:\s*/i, "").trim() || `Reference ${idx+1}`;
    const features = featureText ? featureText.split(/,|;/).map(s=>s.trim().toLowerCase()).filter(Boolean) : [];
    refs.push({title, features, source:"matter"});
  });
  db.forEach(entry => refs.push({
    title: entry.title,
    features: (entry.features || []).map(f => String(f).toLowerCase()),
    source: "database",
    domain: entry.domain,
    patentNumber: entry.patentNumber || "",
    patentUrl: entry.patentUrl || ""
  }));
  return refs;
}

function scoreMatter(m) {
  const claims = parseClaims(m.claimText);
  const refs = parseReferences(m.referencesText);
  const allText = `${m.summary} ${m.problem} ${m.noveltyFocus} ${m.inventorGoals}`.toLowerCase();
  const focusTerms = (m.noveltyFocus || "").toLowerCase().split(/,|;|\n/).map(s=>s.trim()).filter(Boolean);
  let mapped = 0;
  let total = 0;
  const chart = [];

  claims.forEach(claim => {
    claim.limitations.forEach(lim => {
      total += 1;
      const hits = refs.filter(r => r.features.some(f => lim.text.toLowerCase().includes(f) || f.includes(lim.key) || lim.key.includes(f)));
      if (hits.length) mapped += 1;
      chart.push({
        claim: claim.number,
        limitation: lim.text,
        mappedTo: hits.slice(0,3).map(h => h.title),
        status: hits.length ? (hits.length > 1 ? "Partial overlap" : "Single overlap") : "Unmapped"
      });
    });
  });

  const overlapRatio = total ? mapped / total : 0;
  const depth = Math.min(1, claims.length / 4);
  const focusStrength = Math.min(1, focusTerms.length / 3);
  const technicality = Math.min(1, (allText.match(/\b(sensor|polymer|enzyme|algorithm|matrix|stabilizer|calibration|membrane|electrochemical|microfluidic|thermal)\b/g) || []).length / 8);

  let novelty = Math.round(88 - overlapRatio * 42 + focusStrength * 10 + technicality * 5);
  novelty = Math.max(25, Math.min(96, novelty));
  let clarity = Math.round(50 + depth * 18 + technicality * 18 + (m.claimText.length > 220 ? 7 : 0));
  clarity = Math.max(20, Math.min(95, clarity));
  let strategy = Math.round(48 + focusStrength * 20 + (m.inventorGoals ? 12 : 0) + (m.referencesText ? 10 : 0));
  strategy = Math.max(25, Math.min(95, strategy));

  const readiness = Math.round((novelty + clarity + strategy) / 3);

  const strongest = chart.filter(r => r.status !== "Unmapped").slice(0,4);
  const unmapped = chart.filter(r => r.status === "Unmapped").slice(0,4);

  const recommendations = [];
  if (overlapRatio > 0.55) recommendations.push("Narrow the independent claim around the least-shared mechanism or sequence to reduce overlap with known structures.");
  else recommendations.push("Preserve the independent claim breadth, but lock in the strongest differentiator with one or two explicit functional relationships.");
  if (unmapped.length) recommendations.push("Convert unmapped elements into centerpiece limitations for drafting and figure support because they appear less represented across the comparison set.");
  if ((m.referencesText || "").split("\n").length < 2) recommendations.push("Add more comparison references before drafting to stress-test novelty and avoid overestimating distinctiveness.");
  recommendations.push("Draft a layered filing set: one broad independent claim, two medium-scope fallbacks, and several implementation-dependent dependent claims.");
  recommendations.push("Translate the best differentiators into a one-page inventor narrative so prosecution strategy stays consistent across drafts.");

  const filingPath = readiness >= 78
    ? "Provisional now, then develop a utility application with layered fallback claims after another reference sweep."
    : readiness >= 62
      ? "Refine the feature stack first, expand the patent sheet database, then prepare a narrower provisional draft."
      : "Do another concept iteration before filing. Strengthen the differentiator and reduce overlap with common reference features.";

  const similarities = computeSimilarity(m, refs, chart);

  return { novelty, clarity, strategy, readiness, chart, recommendations, filingPath, strongest, unmapped, claims, refs, similarities };
}

function generateClaimScaffold(m, results) {
  const claims = parseClaims(m.claimText);
  const keyTerms = (m.noveltyFocus || "").split(/,|;|\n/).map(s=>s.trim()).filter(Boolean);
  if (!claims.length) return "Add at least one draft claim in the workspace first.";
  const c1 = claims[0];
  const basis = keyTerms[0] || results.unmapped[0]?.limitation || "core control feature";
  return [
    `1. A system for ${m.problem ? m.problem.toLowerCase().replace(/\.$/,'') : "improving a technical process"}, comprising:`,
    ...c1.limitations.slice(0, Math.min(4, c1.limitations.length)).map((l, idx) => `   ${String.fromCharCode(97+idx)}) ${l.text};`),
    `   wherein the system is configured so that ${basis} changes system behavior under a defined operating condition.`,
    "",
    `2. The system of claim 1, wherein ${results.unmapped[0]?.limitation || "the differentiating feature"} is triggered only after a sensed threshold is exceeded.`,
    `3. The system of claim 1, wherein the system includes a fallback implementation that preserves performance during transport, storage, or intermittent use.`,
    `4. The system of claim 1, wherein a calibration or stabilization routine is executed before output, release, or activation.`
  ].join("\n");
}

function generateStrategyMemo(m, results) {
  return [
    `Matter: ${m.matterName || "Untitled matter"}`,
    `Domain: ${m.domain || "Unspecified"}`,
    ``,
    `Commercial framing`,
    `This concept appears strongest when presented as a technical reliability improvement rather than a broad idea statement. Lead with the operational problem: ${m.problem || "a repeatable technical bottleneck"}.`,
    ``,
    `Filing direction`,
    results.filingPath,
    ``,
    `Drafting priorities`,
    `1. Preserve these strengths: ${results.strongest.map(x => x.limitation).slice(0,2).join("; ") || "clear operating relationships and concrete structure"}.`,
    `2. Emphasize these less-shared elements: ${results.unmapped.map(x => x.limitation).slice(0,2).join("; ") || "a threshold-controlled feature set"}.`,
    `3. Put terminology definitions in the specification for the broadest functional terms.`,
    `4. Add one figure showing component interaction and one workflow figure showing trigger sequence or decision logic.`,
    ``,
    `Risk check`,
    `High overlap areas should be pushed into dependent claims or reframed with more exact control relationships. Avoid generic verbs unless the specification anchors how they are executed.`,
    ``,
    `Next step`,
    `Use Claim Architect to refine the independent claim, update the Patent Sheet database with another 3–5 comparators, then rerun Novelty Radar before drafting the provisional packet.`
  ].join("\n");
}

function renderDashboard() {
  const results = getResults();
  const matter = getMatter();
  const empty = !results || !matter;
  const emptyState = byId("emptyState");
  const resultState = byId("resultState");
  if (emptyState) emptyState.classList.toggle("hidden", !empty);
  if (resultState) resultState.classList.toggle("hidden", empty);
  if (empty) return;

  const setText = (id, val) => { const el = byId(id); if (el) el.textContent = val; };
  setText("ringScore", results.readiness);
  setText("matterTitle", matter.matterName || "Untitled matter");
  setText("domainValue", matter.domain || "Unspecified");
  setText("claimsValue", results.claims.length);
  setText("refsValue", results.refs.length);
  setText("noveltyValue", results.novelty);
  setText("clarityValue", results.clarity);
  setText("strategyValue", results.strategy);

  const ring = byId("scoreRing");
  if (ring) {
    const deg = Math.max(8, Math.min(352, Math.round(results.readiness / 100 * 360)));
    ring.style.background = `conic-gradient(var(--accent) 0deg, var(--accent-2) ${deg}deg, rgba(255,255,255,.12) ${deg}deg 360deg)`;
  }

  [
    ["barNovelty", results.novelty, ""],
    ["barClarity", results.clarity, results.clarity < 60 ? "warn" : ""],
    ["barStrategy", results.strategy, results.strategy < 60 ? "warn" : ""]
  ].forEach(([id, value, cls], i) => {
    const el = byId(id);
    if (!el) return;
    el.className = `fill ${cls}`.trim();
    el.style.width = "0%";
    setTimeout(() => { el.style.width = `${value}%`; }, 150 + i * 150);
  });

  const recs = byId("recommendationsList");
  if (recs) {
    recs.innerHTML = results.recommendations.map(r => `<li>${escapeHTML(r)}</li>`).join("");
  }

  const strongest = byId("strongestList");
  if (strongest) {
    strongest.innerHTML = results.strongest.length
      ? results.strongest.map(x => `<li>${escapeHTML(x.limitation)}</li>`).join("")
      : "<li>No matched strengths yet. Add more references and rerun.</li>";
  }

  const simCard = byId("similarityCard");
  const simList = byId("similarityList");
  if (simCard && simList && results.similarities && results.similarities.length) {
    simCard.classList.remove("hidden");
    simList.innerHTML = results.similarities.map((s, idx) => `
      <tr>
        <td>#${idx + 1}</td>
        <td>${escapeHTML(s.title || "Closest match")}<div class="small">${escapeHTML(s.patentNumber || "Database comparator")}</div></td>
        <td>${escapeHTML(String(s.similarity))}%</td>
        <td>${(s.patentUrl || "").trim() ? `<a href="${escapeHTML(s.patentUrl)}" target="_blank" rel="noopener noreferrer">Open patent</a>` : "—"}</td>
      </tr>
    `).join("");
  } else if (simCard) {
    simCard.classList.add("hidden");
  }
}

function renderClaimArchitect() {
  const results = getResults();
  const matter = getMatter();
  const empty = !results || !matter;
  byId("architectEmpty")?.classList.toggle("hidden", !empty);
  byId("architectContent")?.classList.toggle("hidden", empty);
  if (empty) return;
  const table = byId("claimChartBody");
  if (table) {
    table.innerHTML = results.chart.map(row => `
      <tr>
        <td>Claim ${escapeHTML(row.claim)}</td>
        <td>${escapeHTML(row.limitation)}</td>
        <td>${row.mappedTo.length ? escapeHTML(row.mappedTo.join("; ")) : "—"}</td>
        <td>${statusPill(row.status)}</td>
      </tr>
    `).join("");
  }
  const scaffold = byId("claimScaffold");
  if (scaffold) scaffold.textContent = generateClaimScaffold(matter, results);
}

function renderNoveltyRadar() {
  const results = getResults();
  const matter = getMatter();
  const empty = !results || !matter;
  byId("radarEmpty")?.classList.toggle("hidden", !empty);
  byId("radarContent")?.classList.toggle("hidden", empty);
  if (empty) return;
  const set = (id, v) => { const el=byId(id); if(el) el.textContent=v; };
  set("radarMatter", matter.matterName || "Untitled matter");
  set("radarReadiness", `${results.readiness}/100`);
  set("radarNovelty", results.novelty);
  set("radarClarity", results.clarity);
  set("radarStrategy", results.strategy);
  const overlap = Math.max(0, Math.min(100, 100 - results.novelty + 10));
  set("overlapScore", `${overlap}%`);
  set("lessSharedCount", results.unmapped.length);

  [
    ["radBarNovelty", results.novelty, ""],
    ["radBarClarity", results.clarity, ""],
    ["radBarStrategy", results.strategy, ""],
    ["radBarOverlap", overlap, overlap > 55 ? "bad" : "warn"]
  ].forEach(([id, value, cls], i) => {
    const el = byId(id); if (!el) return;
    el.className = `fill ${cls}`.trim();
    el.style.width = "0%";
    setTimeout(()=>{el.style.width=`${value}%`;}, 120 + i * 140);
  });

  const lessShared = byId("lessSharedList");
  if (lessShared) {
    lessShared.innerHTML = results.unmapped.length
      ? results.unmapped.map(x => `<li>${escapeHTML(x.limitation)}</li>`).join("")
      : "<li>All parsed limitations currently overlap with the loaded comparison set.</li>";
  }

  const simWrap = byId("radarSimilarityWrap");
  const simBody = byId("radarSimilarityBody");
  if (simWrap && simBody && results.similarities && results.similarities.length) {
    simWrap.classList.remove("hidden");
    simBody.innerHTML = results.similarities.map((s, idx) => `
      <tr>
        <td>#${idx + 1}</td>
        <td>${escapeHTML(s.title || "Closest match")}<div class="small">${escapeHTML(s.patentNumber || "Database comparator")}</div></td>
        <td>${escapeHTML(String(s.similarity))}%</td>
        <td>${(s.patentUrl || "").trim() ? `<a href="${escapeHTML(s.patentUrl)}" target="_blank" rel="noopener noreferrer">Open patent</a>` : "—"}</td>
      </tr>
    `).join("");
  } else if (simWrap) {
    simWrap.classList.add("hidden");
  }
}

function renderStrategyPage() {
  const results = getResults();
  const matter = getMatter();
  const empty = !results || !matter;
  byId("strategyEmpty")?.classList.toggle("hidden", !empty);
  byId("strategyContent")?.classList.toggle("hidden", empty);
  if (empty) return;
  byId("strategyMemo").textContent = generateStrategyMemo(matter, results);
}

function renderDatabasePage() {
  const db = getDB();
  const editor = byId("dbEditor");
  if (editor) editor.value = JSON.stringify(db, null, 2);
  const count = byId("dbCount");
  if (count) count.textContent = db.length;
  const table = byId("dbBody");
  if (table) {
    table.innerHTML = db.map(item => `
      <tr>
        <td>${escapeHTML(item.id || "")}</td>
        <td>${escapeHTML(item.title || "")}</td>
        <td>${escapeHTML(item.domain || "")}</td>
        <td>${escapeHTML((item.features || []).join(", "))}</td>
      </tr>
    `).join("");
  }
}

function statusPill(status) {
  const cls = status === "Unmapped" ? "good" : status === "Partial overlap" ? "warn" : "bad";
  return `<span class="pill ${cls}">${escapeHTML(status)}</span>`;
}

function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function loadSampleMatter() {
  setMatter(SAMPLE_MATTER);
  fillMatterForm(SAMPLE_MATTER);
  toast("Sample matter loaded.");
}

function saveCurrentMatter() {
  const m = collectMatterFromForm();
  setMatter(m);
  toast("Matter saved locally.");
}

function runAnalysis() {
  const m = collectMatterFromForm();
  if (!m.matterName && !m.summary && !m.claimText) {
    toast("Add your matter details first, or click Load Sample Matter.");
    return;
  }
  setMatter(m);
  const results = scoreMatter(m);
  setResults(results);
  toast("Analysis complete.");
  renderDashboard();
  renderClaimArchitect();
  renderNoveltyRadar();
  renderStrategyPage();
}

function resetWorkspace() {
  clearMatter();
  fillMatterForm({});
  renderDashboard();
  renderClaimArchitect();
  renderNoveltyRadar();
  renderStrategyPage();
  toast("Workspace cleared.");
}

function exportMatterJSON() {
  const matter = getMatter();
  const results = getResults();
  if (!matter || !results) { toast("Run analysis first."); return; }
  const blob = new Blob([JSON.stringify({matter, results}, null, 2)], {type:"application/json"});
  downloadBlob(blob, `${slugify(matter.matterName || "patentpilot-matter")}.json`);
}

function exportStrategyTXT() {
  const matter = getMatter();
  const results = getResults();
  if (!matter || !results) { toast("Run analysis first."); return; }
  const text = generateStrategyMemo(matter, results);
  const blob = new Blob([text], {type:"text/plain"});
  downloadBlob(blob, `${slugify(matter.matterName || "strategy-memo")}.txt`);
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 400);
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function saveDatabaseFromEditor() {
  const editor = byId("dbEditor");
  if (!editor) return;
  try {
    const parsed = JSON.parse(editor.value);
    if (!Array.isArray(parsed)) throw new Error("Database must be an array.");
    setDB(parsed);
    renderDatabasePage();
    toast("Patent sheet database saved.");
  } catch (e) {
    toast("Database JSON is not valid.");
  }
}

function resetDatabase() {
  setDB(structuredClone(DEFAULT_DB));
  renderDatabasePage();
  toast("Database reset.");
}

function downloadDatabase() {
  const blob = new Blob([JSON.stringify(getDB(), null, 2)], {type:"application/json"});
  downloadBlob(blob, "patent-sheet-database.json");
}

function importDatabaseFile(input) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      if (!Array.isArray(parsed)) throw new Error();
      setDB(parsed);
      renderDatabasePage();
      toast("Database imported.");
    } catch(e) {
      toast("Imported file is not valid JSON.");
    }
  };
  reader.readAsText(file);
}

function toast(message) {
  let el = byId("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.style.position = "fixed";
    el.style.right = "18px";
    el.style.bottom = "18px";
    el.style.padding = "12px 14px";
    el.style.borderRadius = "14px";
    el.style.background = "rgba(16,18,40,.92)";
    el.style.border = "1px solid rgba(255,255,255,.12)";
    el.style.color = "white";
    el.style.boxShadow = "0 14px 30px rgba(0,0,0,.28)";
    el.style.zIndex = "999";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.opacity = "1";
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => { el.style.opacity = ".0"; }, 2200);
}

function bootPage(page) {
  const matter = getMatter();
  if (["dashboard"].includes(page)) renderDashboard();
  if (["workspace","dashboard"].includes(page)) fillMatterForm(matter || {});
  if (page === "claims") renderClaimArchitect();
  if (page === "novelty") renderNoveltyRadar();
  if (page === "strategy") renderStrategyPage();
  if (page === "database") renderDatabasePage();
}

window.PP = {
  loadSampleMatter, saveCurrentMatter, runAnalysis, resetWorkspace,
  exportMatterJSON, exportStrategyTXT, saveDatabaseFromEditor, resetDatabase,
  downloadDatabase, importDatabaseFile
};
