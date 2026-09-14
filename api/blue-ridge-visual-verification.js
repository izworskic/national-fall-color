const { CAMERAS, SOURCE_GUIDE, nearestCameras } = require("../lib/blue-ridge-camera-registry.js");

const PHENOCAM_SITE = "asuhighlands";
const PHENOCAM_PRIMARY_SUMMARY = "https://phenocam.nau.edu/data/archive/asuhighlands/ROI/asuhighlands_DB_1000_3day.csv";
const PHENOCAM_FALLBACK_SUMMARY = "https://phenocam.nau.edu/data/archive/asuhighlands/ROI/asuhighlands_DB_1000_1day.csv";
const PHENOCAM_ROI_NAME = "asuhighlands_DB_1000";
const COPERNICUS_STAC = "https://stac.dataspace.copernicus.eu/v1/search";
const UA = "ChrisIzworskiFallColorVisualVerification/1.0 (+https://chrisizworski.com/national-tools/fall-color/blue-ridge-parkway/)";

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: "text/plain,text/csv,application/json;q=0.9,*/*;q=0.2",
      "user-agent": UA,
      ...(options.headers || {}),
    },
    signal: options.signal || AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error(`${new URL(url).hostname} returned ${response.status}`);
  return response.text();
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: "application/json,application/geo+json;q=0.9,*/*;q=0.2",
      "user-agent": UA,
      ...(options.headers || {}),
    },
    signal: options.signal || AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error(`${new URL(url).hostname} returned ${response.status}`);
  return response.json();
}

function csvLine(line) {
  const out = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      out.push(value.trim());
      value = "";
    } else value += char;
  }
  out.push(value.trim());
  return out;
}

function parseCsv(text) {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const headerIndex = lines.findIndex((line) => !line.startsWith("#") && /date/i.test(line) && /gcc/i.test(line));
  if (headerIndex < 0) return [];
  const header = csvLine(lines[headerIndex]).map((value) => value.trim());
  return lines.slice(headerIndex + 1)
    .filter((line) => !line.startsWith("#"))
    .map((line) => {
      const values = csvLine(line);
      const row = {};
      header.forEach((key, index) => { row[key] = values[index] ?? ""; });
      return row;
    });
}

function normalizedKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function field(row, names) {
  if (!row || typeof row !== "object") return null;
  const wanted = new Set(names.map(normalizedKey));
  for (const [key, value] of Object.entries(row)) if (wanted.has(normalizedKey(key))) return value;
  return null;
}

function numeric(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > -9000 ? n : null;
}

function dateKey(value) {
  const text = String(value || "").trim();
  const match = text.match(/(20\d{2})[-/]?(\d{2})[-/]?(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function daysBetween(a, b) {
  const aa = Date.parse(`${a}T12:00:00Z`);
  const bb = Date.parse(`${b}T12:00:00Z`);
  if (!Number.isFinite(aa) || !Number.isFinite(bb)) return null;
  return Math.round((aa - bb) / 86400000);
}

function median(values) {
  const sorted = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function normalizeGccRows(rows) {
  return rows.map((row) => {
    const date = dateKey(field(row, ["date", "local_date", "midday_date"]));
    const gcc = numeric(field(row, ["gcc_90", "gcc90", "gcc_mean", "gccmean"]));
    if (!date || gcc == null) return null;
    return { date, gcc };
  }).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
}

function summerRows(rows, targetYear) {
  return rows.filter((row) => {
    const year = Number(row.date.slice(0, 4));
    const md = row.date.slice(5);
    return year === targetYear && md >= "06-15" && md <= "08-15";
  });
}

function nearestPrior(rows, latestDate, targetDays = 7) {
  const candidates = rows
    .map((row) => ({ ...row, age: daysBetween(latestDate, row.date) }))
    .filter((row) => row.age != null && row.age >= Math.max(3, targetDays - 4) && row.age <= targetDays + 5)
    .sort((a, b) => Math.abs(a.age - targetDays) - Math.abs(b.age - targetDays));
  return candidates[0] || null;
}

function stageFromGreennessLoss(lossPct, trend7dPct) {
  if (!Number.isFinite(lossPct)) return { stage: "unclassified", direction: "unknown" };
  let stage = "summer-like canopy";
  if (lossPct >= 20) stage = "late transition / leaf-off candidate";
  else if (lossPct >= 12) stage = "advanced transition";
  else if (lossPct >= 6) stage = "transition underway";
  else if (lossPct >= 2.5) stage = "early transition";
  let direction = "roughly steady";
  if (Number.isFinite(trend7dPct) && trend7dPct <= -1.5) direction = "greenness falling";
  else if (Number.isFinite(trend7dPct) && trend7dPct >= 1.5) direction = "greenness rising or unstable";
  return { stage, direction };
}

function deriveGccSignal(rows, now = new Date()) {
  const normalized = normalizeGccRows(rows);
  if (!normalized.length) return { available: false, reason: "No usable GCC rows" };
  const latest = normalized[normalized.length - 1];
  const latestYear = Number(latest.date.slice(0, 4));
  let baselineRows = summerRows(normalized, latestYear);
  if (baselineRows.length < 6) {
    baselineRows = normalized.filter((row) => row.date.slice(5) >= "06-15" && row.date.slice(5) <= "08-15").slice(-120);
  }
  const baseline = median(baselineRows.map((row) => row.gcc));
  const prior = nearestPrior(normalized, latest.date, 7);
  const lossPct = baseline && baseline > 0 ? ((baseline - latest.gcc) / baseline) * 100 : null;
  const trend7dPct = prior?.gcc > 0 ? ((latest.gcc - prior.gcc) / prior.gcc) * 100 : null;
  const ageDays = Math.max(0, Math.floor((now.getTime() - Date.parse(`${latest.date}T23:59:59Z`)) / 86400000));
  const stage = stageFromGreennessLoss(lossPct, trend7dPct);
  return {
    available: baseline != null,
    latest_date: latest.date,
    age_days: ageDays,
    fresh: ageDays <= 5,
    gcc_current: Math.round(latest.gcc * 10000) / 10000,
    gcc_summer_baseline: baseline == null ? null : Math.round(baseline * 10000) / 10000,
    green_loss_percent: lossPct == null ? null : Math.round(lossPct * 10) / 10,
    trend_7d_percent: trend7dPct == null ? null : Math.round(trend7dPct * 10) / 10,
    baseline_samples: baselineRows.length,
    stage: stage.stage,
    direction: stage.direction,
    interpretation: "GCC measures canopy greenness within a fixed PhenoCam region of interest. Greenness loss can indicate autumn transition, but it is not a measured percent of peak color and does not directly measure scenic vividness.",
  };
}

function absoluteUrl(value, base = "https://phenocam.nau.edu/") {
  if (!value) return null;
  try { return new URL(String(value), base).toString(); } catch { return null; }
}

function chooseRoi(payload, site = PHENOCAM_SITE) {
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [];
  const matches = rows.filter((row) => String(row.site || "").toLowerCase() === site.toLowerCase());
  const deciduous = matches.filter((row) => String(row.roitype || "").toUpperCase() === "DB");
  const candidates = deciduous.length ? deciduous : matches;
  return candidates
    .filter((row) => row.three_day_summary || row.one_day_summary || row.roi_stats_file)
    .sort((a, b) => Number(Boolean(b.active)) - Number(Boolean(a.active)))[0] || null;
}

async function phenocamEvidence(now = new Date()) {
  const camera = CAMERAS.find((entry) => entry.phenocam_site === PHENOCAM_SITE);
  const summaries = [PHENOCAM_PRIMARY_SUMMARY, PHENOCAM_FALLBACK_SUMMARY];
  let lastError = null;
  for (const summaryUrl of summaries) {
    try {
      const csv = await fetchText(summaryUrl, { signal: AbortSignal.timeout(5000) });
      const signal = deriveGccSignal(parseCsv(csv), now);
      if (!signal.available) throw new Error(signal.reason || "PhenoCam summary had no usable GCC data");
      return {
        available: true,
        camera: {
          id: camera.id,
          name: camera.name,
          milepost: camera.milepost,
          state: camera.state,
          source: camera.source,
          source_url: camera.url,
          site: PHENOCAM_SITE,
          roi: PHENOCAM_ROI_NAME,
          vegetation_type: "DB",
        },
        signal,
        data_url: summaryUrl,
        source_strategy: "direct-known-roi-summary",
        rights: "Derived PhenoCam GCC data only. This endpoint does not republish camera imagery.",
      };
    } catch (error) {
      lastError = error;
    }
  }
  return {
    available: false,
    camera: camera ? {
      id: camera.id,
      name: camera.name,
      milepost: camera.milepost,
      state: camera.state,
      source: camera.source,
      source_url: camera.url,
      site: PHENOCAM_SITE,
      roi: PHENOCAM_ROI_NAME,
    } : null,
    error: String(lastError?.message || lastError || "PhenoCam summary unavailable"),
    source_strategy: "direct-known-roi-summary",
    rights: "No third-party camera imagery is republished.",
  };
}

async function satelliteCatalogContext(lat, lon, now = new Date()) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { available: false, reason: "No target coordinate" };
  const start = new Date(now.getTime() - 14 * 86400000).toISOString();
  const end = now.toISOString();
  try {
    const data = await fetchJson(COPERNICUS_STAC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        collections: ["sentinel-2-l2a"],
        bbox: [lon - 0.08, lat - 0.08, lon + 0.08, lat + 0.08],
        datetime: `${start}/${end}`,
        limit: 20,
        query: { "eo:cloud_cover": { lt: 55 } },
        sortby: [{ field: "properties.datetime", direction: "desc" }],
        fields: { include: ["id", "collection", "properties.datetime", "properties.eo:cloud_cover"] },
      }),
    });
    const features = Array.isArray(data?.features) ? data.features : [];
    const latest = features[0];
    if (!latest) return { available: true, scene_found: false, interpretation: "No recent low-to-moderate-cloud Sentinel-2 L2A scene was returned for this sample area." };
    return {
      available: true,
      scene_found: true,
      scene_id: latest.id || null,
      acquired_at: latest.properties?.datetime || null,
      cloud_cover_percent: numeric(latest.properties?.["eo:cloud_cover"]),
      analysis_status: "catalog-only",
      interpretation: "A recent Sentinel-2 L2A acquisition exists near the modeled corridor. This release reports acquisition freshness only; it does not infer leaf color from satellite pixels yet.",
    };
  } catch (error) {
    return { available: false, error: String(error?.message || error), analysis_status: "catalog-unavailable" };
  }
}

function publicCamera(camera) {
  return {
    id: camera.id,
    name: camera.name,
    milepost: camera.milepost,
    state: camera.state,
    source: camera.source,
    url: camera.url,
    update_note: camera.update_note,
    machine_analysis: camera.machine_analysis,
    display_policy: camera.display_policy,
    distance_mileposts: camera.distance_mileposts,
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const lat = numeric(req.query?.lat);
  const lon = numeric(req.query?.lon);
  const milepost = numeric(req.query?.milepost);
  const now = new Date();
  const [phenocam, satellite] = await Promise.all([
    phenocamEvidence(now),
    satelliteCatalogContext(lat, lon, now),
  ]);

  const nearby = nearestCameras(milepost, 6).map(publicCamera);
  return res.status(200).json({
    retrieved_at: now.toISOString(),
    mode: "blue-ridge-visual-verification-v1",
    target: { latitude: lat, longitude: lon, milepost },
    automated_camera: phenocam,
    nearby_cameras: nearby,
    satellite,
    camera_registry: {
      total: CAMERAS.length,
      machine_analyzable: CAMERAS.filter((camera) => camera.machine_analysis !== "disabled").length,
      policy: "Third-party commercial/local webcams are link-only unless their data-use terms explicitly permit machine analysis or image republication. PhenoCam-derived GCC is analyzed as scientific data; raw camera imagery is not republished.",
      source_guide: SOURCE_GUIDE,
    },
    method: {
      camera: "PhenoCam three-day GCC summaries are compared with a June 15-August 15 summer greenness baseline for the same fixed region of interest. Seven-day GCC direction is reported separately.",
      satellite: "Copernicus STAC is queried only for recent Sentinel-2 L2A acquisition metadata in this release. Satellite imagery does not yet change the fall-color decision.",
      reconciliation: "Automated camera evidence is supporting evidence. It should only challenge a corridor recommendation when it is geographically close enough to represent that part of the Parkway.",
    },
    disclaimer: "Visual verification is an experimental evidence layer, not a measured percent-peak product. Camera greenness can be affected by lighting, haze, camera settings and view composition. Satellite catalog availability is not a foliage measurement.",
  });
};

module.exports._test = {
  chooseRoi,
  csvLine,
  deriveGccSignal,
  nearestPrior,
  normalizeGccRows,
  parseCsv,
  stageFromGreennessLoss,
};
