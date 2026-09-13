const {
  finite,
  localDateKey,
  sourceMeta,
} = require("@izworskic/national-outdoor-core");

const GEOSERVER = "https://geoserver.usanpn.org/geoserver/ows";
const NPN_OBSERVATIONS = "https://services.usanpn.org/npn_portal/observations/getObservations.json";
const USDM_LAYER = "https://services5.arcgis.com/0OTVzJS4K09zlixn/arcgis/rest/services/USDM_current/FeatureServer/0/query";
const NPS_ROAD_STATUS = "https://www.nps.gov/blri/planyourvisit/roadclosures.htm";
const PHENOPHASE_ID = 498;
const LOOKBACK_DAYS = 21;
const RADIUS_MILES = 75;
const TIME_ZONE = "America/New_York";
const UA = "ChrisIzworskiBlueRidgeFallColor/1.0 (+https://chrisizworski.com/national-tools/fall-color/blue-ridge-parkway/)";

const STATIONS = [
  { id: "humpback-rocks", name: "Humpback Rocks", state: "VA", milepost: 5.8, latitude: 37.972724, longitude: -78.899464, elevation_ft: 3000, elevation_note: "approximate ridge elevation", corridor: "Northern Virginia" },
  { id: "peaks-of-otter", name: "Peaks of Otter", state: "VA", milepost: 86.0, latitude: 37.443650, longitude: -79.599822, elevation_ft: 2500, elevation_note: "approximate developed-area elevation", corridor: "Central Virginia" },
  { id: "mabry-mill", name: "Mabry Mill", state: "VA", milepost: 176.2, latitude: 36.751712, longitude: -80.405357, elevation_ft: 2855, elevation_note: "approximate developed-area elevation", corridor: "Virginia Highlands" },
  { id: "doughton-park", name: "Doughton Park", state: "NC", milepost: 241.1, latitude: 36.418721, longitude: -81.146435, elevation_ft: 3500, elevation_note: "approximate high-plateau elevation", corridor: "Northern North Carolina" },
  { id: "linville-falls", name: "Linville Falls", state: "NC", milepost: 316.4, latitude: 35.968060, longitude: -81.932220, elevation_ft: 3250, elevation_note: "approximate developed-area elevation", corridor: "North Carolina High Country" },
  { id: "craggy-gardens", name: "Craggy Gardens", state: "NC", milepost: 364.6, latitude: 35.700290, longitude: -82.379650, elevation_ft: 5500, elevation_note: "high-elevation ridge, approximate", corridor: "Asheville High Country" },
  { id: "mount-pisgah", name: "Mount Pisgah", state: "NC", milepost: 408.6, latitude: 35.402868, longitude: -82.756920, elevation_ft: 4980, elevation_note: "campground elevation", corridor: "Pisgah Highlands" },
  { id: "waterrock-knob", name: "Waterrock Knob", state: "NC", milepost: 451.2, latitude: 35.460186, longitude: -83.141024, elevation_ft: 5820, elevation_note: "visitor-center elevation", corridor: "Southern Blue Ridge" },
];

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: "application/json, application/geo+json;q=0.9, */*;q=0.1",
      "user-agent": UA,
      ...(options.headers || {}),
    },
    signal: options.signal || AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`${new URL(url).hostname} returned ${response.status}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { accept: "text/html, text/plain;q=0.9", "user-agent": UA },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`${new URL(url).hostname} returned ${response.status}`);
  return response.text();
}

async function sample(layer, station) {
  const d = 0.03;
  const url = new URL(GEOSERVER);
  url.searchParams.set("service", "WMS");
  url.searchParams.set("version", "1.1.1");
  url.searchParams.set("request", "GetFeatureInfo");
  url.searchParams.set("layers", layer);
  url.searchParams.set("query_layers", layer);
  url.searchParams.set("styles", "");
  url.searchParams.set("srs", "EPSG:4326");
  url.searchParams.set("bbox", `${station.longitude - d},${station.latitude - d},${station.longitude + d},${station.latitude + d}`);
  url.searchParams.set("width", "101");
  url.searchParams.set("height", "101");
  url.searchParams.set("x", "50");
  url.searchParams.set("y", "50");
  url.searchParams.set("info_format", "application/json");
  url.searchParams.set("feature_count", "1");
  const data = await fetchJson(url);
  const props = data?.features?.[0]?.properties || {};
  const values = Object.values(props).map(Number).filter(Number.isFinite);
  return values.length ? values[0] : null;
}

function doyFromKey(key) {
  const [year, month, day] = String(key || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  const start = Date.UTC(year, 0, 0);
  return Math.floor((Date.UTC(year, month - 1, day) - start) / 86400000);
}

function doyDate(doy, year) {
  const value = finite(doy, 1, 366);
  if (value == null) return null;
  const date = new Date(Date.UTC(year, 0, 1));
  date.setUTCDate(date.getUTCDate() + Math.round(value) - 1);
  return date.toISOString().slice(0, 10);
}

function historicalFit(targetDoy, median, mad) {
  const center = finite(median, 1, 366);
  const rawSpread = finite(mad, 0, 60);
  if (center == null) return null;
  const spread = rawSpread == null ? 12 : Math.max(6, Math.min(21, rawSpread));
  const diff = Math.round(targetDoy - center);
  const abs = Math.abs(diff);
  let stage;
  if (diff < -21) stage = "well before typical transition";
  else if (diff < -8) stage = "approaching typical transition";
  else if (diff <= 7) stage = "inside the strongest historical transition window";
  else if (diff <= 18) stage = "late in the typical transition window";
  else stage = "typically beyond the main transition";
  let score = Math.max(0, 100 - abs * 4);
  if (abs <= spread) score = Math.min(100, score + 8);
  return {
    stage,
    days_from_midpoint: diff,
    mad_days: rawSpread,
    modeled_spread_days: spread,
    score,
  };
}

function rankStations(stations, targetDoy, roadRanges = []) {
  return stations
    .map((station) => {
      const timing = historicalFit(targetDoy, station.median, station.mad);
      const road = candidateRoadStatus(station.milepost, roadRanges);
      return { ...station, timing, road };
    })
    .filter((station) => station.timing)
    .sort((a, b) => {
      if (a.road.possible_closure !== b.road.possible_closure) return a.road.possible_closure ? 1 : -1;
      return b.timing.score - a.timing.score;
    });
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&ndash;|&mdash;/gi, "-")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRoadClosures(html) {
  const text = stripHtml(html);
  const ranges = [];
  const closureMatches = [...text.matchAll(/closed/gi)];
  for (const match of closureMatches) {
    const start = Math.max(0, match.index - 260);
    const end = Math.min(text.length, match.index + 140);
    const chunk = text.slice(start, end);
    for (const found of chunk.matchAll(/(\d{1,3}(?:\.\d+)?)\s*(?:-|to)\s*(\d{1,3}(?:\.\d+)?)/gi)) {
      const a = Number(found[1]);
      const b = Number(found[2]);
      if (Number.isFinite(a) && Number.isFinite(b) && a <= 470 && b <= 470 && Math.abs(a - b) <= 100) {
        ranges.push({ start: Math.min(a, b), end: Math.max(a, b), evidence: chunk.slice(0, 220) });
      }
    }
    if (!ranges.length) {
      for (const found of chunk.matchAll(/(?:MP|Milepost)\s*(\d{1,3}(?:\.\d+)?)/gi)) {
        const mp = Number(found[1]);
        if (Number.isFinite(mp) && mp <= 470) ranges.push({ start: mp, end: mp, evidence: chunk.slice(0, 220) });
      }
    }
  }
  const deduped = [];
  const seen = new Set();
  for (const range of ranges) {
    const key = `${range.start}-${range.end}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(range);
    }
  }
  const updated = text.match(/(?:updated|current as of)\s*:?[ ]*([A-Z][a-z]+\s+\d{1,2},\s+20\d{2})/i)?.[1] || null;
  return { ranges: deduped, updated };
}

function candidateRoadStatus(milepost, ranges) {
  const mp = finite(milepost, 0, 470);
  if (mp == null) return { possible_closure: false, matched_range: null };
  const match = (ranges || []).find((range) => mp >= range.start && mp <= range.end);
  return {
    possible_closure: Boolean(match),
    matched_range: match ? { start: match.start, end: match.end } : null,
  };
}

async function roadContext() {
  try {
    const html = await fetchText(NPS_ROAD_STATUS);
    const parsed = parseRoadClosures(html);
    return {
      available: true,
      updated: parsed.updated,
      possible_closure_ranges: parsed.ranges,
      interpretation: "Only clearly parsed NPS closure ranges are used to avoid recommending a known closed anchor. Absence of a parsed closure is not an 'open' guarantee; verify NPS road status before departure.",
    };
  } catch (error) {
    return {
      available: false,
      updated: null,
      possible_closure_ranges: [],
      interpretation: "Automatic road-status context is unavailable. Verify the official NPS Blue Ridge Parkway road-status page before departure.",
      error: String(error?.message || error),
    };
  }
}

async function historicalStation(station) {
  const [medResult, madResult] = await Promise.allSettled([
    sample("inca:midgdown_median_nad83_02deg", station),
    sample("inca:midgdown_mad_nad83_02deg", station),
  ]);
  return {
    ...station,
    median: medResult.status === "fulfilled" ? finite(medResult.value, 1, 366) : null,
    mad: madResult.status === "fulfilled" ? finite(madResult.value, 0, 60) : null,
  };
}

function boundsFor(station, radiusMiles = RADIUS_MILES) {
  const latDelta = radiusMiles / 69;
  const cos = Math.max(0.2, Math.cos(station.latitude * Math.PI / 180));
  const lonDelta = radiusMiles / (69 * cos);
  return {
    south: station.latitude - latDelta,
    west: station.longitude - lonDelta,
    north: station.latitude + latDelta,
    east: station.longitude + lonDelta,
  };
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const values = [lat1, lon1, lat2, lon2].map(Number);
  if (!values.every(Number.isFinite)) return null;
  const rad = Math.PI / 180;
  const dLat = (values[2] - values[0]) * rad;
  const dLon = (values[3] - values[1]) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(values[0] * rad) * Math.cos(values[2] * rad) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizedKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function field(row, ...names) {
  if (!row || typeof row !== "object") return null;
  for (const name of names) if (row[name] != null) return row[name];
  const wanted = new Set(names.map(normalizedKey));
  for (const [key, value] of Object.entries(row)) if (wanted.has(normalizedKey(key)) && value != null) return value;
  return null;
}

function conflictFlag(row) {
  const value = field(row, "Observed_Status_Conflict_Flag", "observed_status_conflict_flag", "observer_status_conflict_flag");
  if (value == null || value === "" || value === -9999 || value === "-9999") return false;
  return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
}

async function observationContext(station, now = new Date()) {
  const end = localDateKey(now, TIME_ZONE);
  const [year, month, day] = end.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day - (LOOKBACK_DAYS - 1), 12)).toISOString().slice(0, 10);
  const bounds = boundsFor(station);
  const body = new URLSearchParams({
    request_src: "Chris Izworski Blue Ridge Fall Color",
    climate_data: "0",
    start_date: start,
    end_date: end,
    bottom_left_x1: bounds.south.toFixed(5),
    bottom_left_y1: bounds.west.toFixed(5),
    upper_right_x2: bounds.north.toFixed(5),
    upper_right_y2: bounds.east.toFixed(5),
    "phenophase_id[1]": String(PHENOPHASE_ID),
    "additional_field[1]": "Site_Name",
    "additional_field[2]": "Common_Name",
    "additional_field[3]": "Observed_Status_Conflict_Flag",
  });
  const rows = await fetchJson(NPN_OBSERVATIONS, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  if (!Array.isArray(rows)) throw new Error("USA-NPN returned an unexpected observation shape");
  const parsed = rows.map((row) => {
    if (conflictFlag(row)) return null;
    const latitude = finite(field(row, "latitude", "Latitude"), -90, 90);
    const longitude = finite(field(row, "longitude", "Longitude"), -180, 180);
    const status = finite(field(row, "phenophase_status", "Phenophase_Status"), -1, 1);
    const date = String(field(row, "observation_date", "Observation_Date") || "").slice(0, 10);
    if (latitude == null || longitude == null || status == null || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const distance = haversineMiles(station.latitude, station.longitude, latitude, longitude);
    if (distance == null || distance > RADIUS_MILES) return null;
    return {
      status,
      date,
      distance_miles: Math.round(distance * 10) / 10,
      site: String(field(row, "site_id", "Site_ID", "site_name", "Site_Name") || `${latitude.toFixed(3)},${longitude.toFixed(3)}`),
      common_name: String(field(row, "common_name", "Common_Name") || "").trim() || null,
      intensity: String(field(row, "intensity_value", "Intensity_Value") || "").trim().replace(/^-9999$/, "") || null,
    };
  }).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date));
  const yes = parsed.filter((row) => row.status === 1);
  const no = parsed.filter((row) => row.status === 0);
  const sites = new Set(parsed.map((row) => row.site));
  const yesSites = new Set(yes.map((row) => row.site));
  return {
    available: true,
    radius_miles: RADIUS_MILES,
    lookback_days: LOOKBACK_DAYS,
    records: parsed.length,
    yes_records: yes.length,
    no_records: no.length,
    sites_reporting: sites.size,
    yes_sites: yesSites.size,
    latest_observation_date: parsed[0]?.date || null,
    latest_yes: yes[0] || null,
    coverage: yesSites.size >= 2 && yes.length >= 3 ? "some current local coverage" : parsed.length ? "sparse current local coverage" : "no recent local coverage",
    interpretation: yes.length
      ? "Nearby monitored plants have recent colored-leaf yes records."
      : parsed.length
        ? "Nearby monitored plants have recent records, but no colored-leaf yes record was found in this query."
        : "No recent USA-NPN colored-leaf records were found nearby.",
  };
}

function parseWindMph(value) {
  const numbers = String(value || "").match(/\d+(?:\.\d+)?/g)?.map(Number).filter(Number.isFinite) || [];
  return numbers.length ? Math.max(...numbers) : null;
}

async function weatherContext(station) {
  const points = await fetchJson(`https://api.weather.gov/points/${station.latitude.toFixed(4)},${station.longitude.toFixed(4)}`);
  const url = points?.properties?.forecastHourly;
  if (!url) throw new Error("NWS point has no hourly forecast");
  const hourly = await fetchJson(url);
  const periods = (hourly?.properties?.periods || []).slice(0, 168).map((period) => {
    const temperature = finite(period.temperature);
    const tempF = temperature == null ? null : period.temperatureUnit === "C" ? temperature * 9 / 5 + 32 : temperature;
    const precip = finite(period.probabilityOfPrecipitation?.value, 0, 100);
    return {
      time: period.startTime,
      temp_f: tempF,
      precip_probability: precip,
      wind_mph: parseWindMph(period.windSpeed),
    };
  }).filter((period) => period.temp_f != null && Date.parse(period.time || ""));
  const temps = periods.map((period) => period.temp_f);
  const winds = periods.map((period) => period.wind_mph).filter(Number.isFinite);
  const precip = periods.map((period) => period.precip_probability).filter(Number.isFinite);
  const hardFreezeHours = periods.filter((period) => period.temp_f <= 28).length;
  const windyHours = periods.filter((period) => period.wind_mph != null && period.wind_mph >= 20).length;
  let qualityNote = "No major hard-freeze or persistent high-wind signal appears in the available NWS hourly window.";
  if (hardFreezeHours >= 3 && windyHours >= 6) qualityNote = "Hard-freeze and wind risk could shorten or strip the display; verify local conditions before a long drive.";
  else if (hardFreezeHours >= 3) qualityNote = "Hard-freeze risk could accelerate leaf drop or shorten the display.";
  else if (windyHours >= 6) qualityNote = "Persistent wind may strip leaves even where timing is otherwise favorable.";
  return {
    available: true,
    updated_at: hourly?.properties?.updateTime || null,
    min_7d_f: temps.length ? Math.round(Math.min(...temps)) : null,
    max_7d_f: temps.length ? Math.round(Math.max(...temps)) : null,
    freeze_hours: periods.filter((period) => period.temp_f <= 32).length,
    hard_freeze_hours: hardFreezeHours,
    max_precip_probability: precip.length ? Math.round(Math.max(...precip)) : null,
    max_wind_mph: winds.length ? Math.round(Math.max(...winds)) : null,
    windy_hours_20_plus: windyHours,
    quality_note: qualityNote,
  };
}

function droughtLabel(dm) {
  const value = Number(dm);
  return ({ 0: "D0 Abnormally Dry", 1: "D1 Moderate Drought", 2: "D2 Severe Drought", 3: "D3 Extreme Drought", 4: "D4 Exceptional Drought" })[value] || null;
}

async function droughtContext(station) {
  const url = new URL(USDM_LAYER);
  url.searchParams.set("geometry", `${station.longitude},${station.latitude}`);
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("outFields", "DM,ReleaseDate,MapDate");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("f", "json");
  const data = await fetchJson(url);
  if (data?.error) throw new Error(data.error.message || "U.S. Drought Monitor query failed");
  const attributes = data?.features?.[0]?.attributes || null;
  if (!attributes) {
    return {
      available: true,
      category: "No D0-D4 drought polygon at this point",
      dm: null,
      map_date: null,
      interpretation: "This point is not inside a current U.S. Drought Monitor D0-D4 polygon. This does not guarantee ideal foliage quality.",
    };
  }
  const dm = finite(attributes.DM, 0, 4);
  return {
    available: true,
    category: droughtLabel(dm) || "Drought category unavailable",
    dm,
    map_date: attributes.MapDate || attributes.ReleaseDate || null,
    interpretation: dm >= 2
      ? "Meaningful drought stress is present. Stress color or early leaf drop can make observed color differ from historical timing."
      : "Dryness is present and is shown as a quality/stress signal, not as a timing adjustment.",
  };
}

function confidenceFor(station, context) {
  let points = 0;
  const mad = finite(station.mad, 0, 60);
  if (mad != null && mad <= 8) points += 2;
  else if (mad != null && mad <= 14) points += 1;
  const obs = context?.observations;
  if (obs?.yes_sites >= 2 && obs?.yes_records >= 3) points += 2;
  else if (obs?.records) points += 1;
  if (context?.weather?.available) points += 1;
  if (context?.drought?.available) points += 1;
  if (station.road?.possible_closure) points -= 2;
  if (points >= 5) return "medium-high";
  if (points >= 3) return "medium";
  return "low";
}

function publicStation(station, year) {
  const spread = station.timing?.modeled_spread_days ?? 12;
  return {
    id: station.id,
    name: station.name,
    state: station.state,
    corridor: station.corridor,
    milepost: station.milepost,
    latitude: station.latitude,
    longitude: station.longitude,
    elevation_ft: station.elevation_ft,
    elevation_note: station.elevation_note,
    historical_mid_transition: station.median == null ? null : doyDate(station.median, year),
    historical_window: station.median == null ? null : {
      start: doyDate(Math.max(1, station.median - spread), year),
      end: doyDate(Math.min(366, station.median + spread), year),
    },
    timing: station.timing ? {
      stage: station.timing.stage,
      days_from_midpoint: station.timing.days_from_midpoint,
      variability_mad_days: station.timing.mad_days,
    } : null,
    road: station.road,
  };
}

function elevationStory(nowStation, nextStation) {
  if (!nowStation || !nextStation) return "Not enough corridor timing data to compare elevation bands.";
  const delta = nextStation.elevation_ft - nowStation.elevation_ft;
  if (delta <= -500) return `The modeled opportunity shifts downslope over the next week, from about ${nowStation.elevation_ft.toLocaleString()} ft toward roughly ${nextStation.elevation_ft.toLocaleString()} ft.`;
  if (delta >= 500) return `The strongest modeled match changes corridor more than it changes downslope; the next-week candidate is around ${nextStation.elevation_ft.toLocaleString()} ft.`;
  return `The strongest modeled corridor remains in a similar elevation band, around ${nextStation.elevation_ft.toLocaleString()} ft.`;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=43200");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const now = new Date();
  const localKey = localDateKey(now, TIME_ZONE);
  const year = Number(localKey.slice(0, 4));
  const todayDoy = doyFromKey(localKey);
  if (todayDoy == null) return res.status(500).json({ error: "Could not resolve Blue Ridge local date" });

  const [historicalResults, road] = await Promise.all([
    Promise.all(STATIONS.map((station) => historicalStation(station))),
    roadContext(),
  ]);
  const usable = historicalResults.filter((station) => station.median != null);
  if (!usable.length) return res.status(502).json({ error: "Blue Ridge historical phenology is temporarily unavailable" });

  const roadRanges = road.possible_closure_ranges || [];
  const nowRanked = rankStations(usable, todayDoy, roadRanges);
  const nextRanked = rankStations(usable, Math.min(366, todayDoy + 7), roadRanges);
  const bestNow = nowRanked[0] || null;
  const bestNext = nextRanked[0] || bestNow;
  const contextStations = [...new Map([bestNow, bestNext].filter(Boolean).map((station) => [station.id, station])).values()];
  const contexts = {};

  await Promise.all(contextStations.map(async (station) => {
    const [weatherResult, droughtResult, observationResult] = await Promise.allSettled([
      weatherContext(station),
      droughtContext(station),
      observationContext(station, now),
    ]);
    contexts[station.id] = {
      weather: weatherResult.status === "fulfilled" ? weatherResult.value : { available: false, error: String(weatherResult.reason?.message || weatherResult.reason || "unavailable") },
      drought: droughtResult.status === "fulfilled" ? droughtResult.value : { available: false, error: String(droughtResult.reason?.message || droughtResult.reason || "unavailable") },
      observations: observationResult.status === "fulfilled" ? observationResult.value : { available: false, error: String(observationResult.reason?.message || observationResult.reason || "unavailable") },
    };
  }));

  const bestNowPublic = bestNow ? publicStation(bestNow, year) : null;
  const bestNextPublic = bestNext ? publicStation(bestNext, year) : null;
  if (bestNowPublic) bestNowPublic.confidence = confidenceFor(bestNow, contexts[bestNow.id]);
  if (bestNextPublic) bestNextPublic.confidence = confidenceFor(bestNext, contexts[bestNext.id]);

  return res.status(200).json({
    retrieved_at: now.toISOString(),
    local_date: localKey,
    mode: "blue-ridge-corridor-decision-beta",
    decision: {
      best_now: bestNowPublic,
      best_next_7d: bestNextPublic,
      elevation_story: elevationStory(bestNow, bestNext),
      road_status_available: road.available,
      road_status_updated: road.updated,
      road_note: road.interpretation,
    },
    selected_context: contexts,
    corridor: nowRanked.sort((a, b) => a.milepost - b.milepost).map((station) => publicStation(station, year)),
    method: {
      historical_timing: "USA-NPN MODIS Mid Green-down Median and median absolute deviation (2001–2017) sampled at representative Blue Ridge Parkway anchors.",
      ranking: "Best-now and next-7-day anchors are ranked by proximity to each anchor's own historical mid-greendown transition. Clearly parsed NPS closure ranges are deprioritized. No leaf-color percentage is invented.",
      current_observations: "Recent USA-NPN Nature's Notebook Colored leaves observations are fetched only around the selected anchors and are kept separate from historical timing.",
      weather: "NWS seven-day temperature, precipitation-probability and wind context is fetched for selected anchors and used as a quality/stress explanation, not a hidden timing adjustment.",
      drought: "Current U.S. Drought Monitor category is shown as a tree-stress/quality signal and does not mathematically shift the historical timing date.",
      road_status: road.interpretation,
    },
    disclaimer: "This is a trip-planning model, not a measured percent-peak map. Blue Ridge fall color varies by species, slope, elevation, drought, wind and local weather. Verify NPS road status and local observations before a long drive.",
    sources: [
      sourceMeta({
        name: "National Park Service — Blue Ridge Parkway Fall Colors",
        url: "https://www.nps.gov/blri/learn/nature/fall-colors.htm",
        available: true,
        status: "official elevation and seasonal context",
      }),
      sourceMeta({
        name: "National Park Service — Blue Ridge Parkway Road Status",
        url: NPS_ROAD_STATUS,
        updatedAt: road.updated || null,
        staleAfterMinutes: 1440,
        available: road.available,
        status: road.available ? "daily road-status context" : "automatic road-status fetch unavailable",
      }),
      sourceMeta({
        name: "USA National Phenology Network — Mid Green-down Median and MAD",
        url: "https://www.usanpn.org/data/maps/land_surface_phenology",
        available: true,
        status: "historical satellite phenology, MODIS 2001–2017",
      }),
      sourceMeta({
        name: "USA National Phenology Network — Nature's Notebook observations",
        url: "https://www.usanpn.org/data/observational",
        available: true,
        status: "current plant-level Colored leaves observations where available",
      }),
      sourceMeta({
        name: "National Weather Service API",
        url: "https://www.weather.gov/documentation/services-web-api",
        available: true,
        status: "current seven-day weather context for selected anchors",
      }),
      sourceMeta({
        name: "U.S. Drought Monitor",
        url: "https://droughtmonitor.unl.edu/",
        available: true,
        status: "current weekly drought category for selected anchors",
      }),
    ],
  });
};

module.exports._test = {
  candidateRoadStatus,
  doyDate,
  doyFromKey,
  droughtLabel,
  elevationStory,
  historicalFit,
  parseRoadClosures,
  rankStations,
};
