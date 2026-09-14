const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const visual = require("../api/blue-ridge-visual-verification.js")._test;
const { CAMERAS, nearestCameras } = require("../lib/blue-ridge-camera-registry.js");

const pagePath = path.join(__dirname, "..", "public/national-tools/fall-color/blue-ridge-parkway/index.html");

test("camera registry keeps external webcams link-only by default", () => {
  assert.ok(CAMERAS.length >= 12);
  const automated = CAMERAS.filter((camera) => camera.machine_analysis !== "disabled");
  assert.equal(automated.length, 1);
  assert.equal(automated[0].phenocam_site, "asuhighlands");
  assert.equal(automated[0].display_policy, "derived-data-only");
  assert.ok(CAMERAS.filter((camera) => camera.machine_analysis === "disabled").every((camera) => camera.display_policy === "link-only"));
});

test("nearest camera links follow the modeled milepost", () => {
  const nearest = nearestCameras(300, 3);
  assert.equal(nearest.length, 3);
  assert.ok(nearest[0].distance_mileposts <= nearest[1].distance_mileposts);
  assert.ok(nearest[1].distance_mileposts <= nearest[2].distance_mileposts);
  assert.ok(nearest.some((camera) => camera.id === "asuhighlands"));
});

test("PhenoCam ROI selection prefers deciduous broadleaf summary data", () => {
  const roi = visual.chooseRoi({ results: [
    { site: "asuhighlands", roitype: "EN", active: true, three_day_summary: "/en.csv", roi_name: "EN_1000" },
    { site: "asuhighlands", roitype: "DB", active: true, three_day_summary: "/db.csv", roi_name: "DB_1000" },
  ] });
  assert.equal(roi.roi_name, "DB_1000");
});

test("GCC signal reports summer green loss and seven-day direction without inventing peak percent", () => {
  const csv = [
    "date,gcc_90",
    "2026-06-20,0.440",
    "2026-06-23,0.442",
    "2026-06-26,0.438",
    "2026-07-02,0.441",
    "2026-07-10,0.439",
    "2026-08-01,0.440",
    "2026-09-03,0.420",
    "2026-09-10,0.390",
  ].join("\n");
  const signal = visual.deriveGccSignal(visual.parseCsv(csv), new Date("2026-09-13T16:00:00Z"));
  assert.equal(signal.available, true);
  assert.equal(signal.latest_date, "2026-09-10");
  assert.ok(signal.green_loss_percent > 10);
  assert.ok(signal.trend_7d_percent < 0);
  assert.match(signal.stage, /transition/i);
  assert.doesNotMatch(signal.interpretation, /percent[- ]peak/i);
});

test("camera greenness stages distinguish summer-like, active and late transition", () => {
  assert.equal(visual.stageFromGreennessLoss(1, 0).stage, "summer-like canopy");
  assert.equal(visual.stageFromGreennessLoss(8, -3).stage, "transition underway");
  assert.equal(visual.stageFromGreennessLoss(22, -2).stage, "late transition / leaf-off candidate");
});

test("Blue Ridge page contains visual verification, rights boundary and satellite truth boundary", () => {
  const html = fs.readFileSync(pagePath, "utf8");
  assert.match(html, /data-visual-verification="true"/);
  assert.match(html, /See what the leaves look like before you drive/);
  assert.match(html, /research camera tracks canopy greenness/i);
  assert.match(html, /link to the source rather than republishing third-party feeds/i);
  assert.match(html, /What is this camera signal\?/);
  assert.match(html, /Technical: satellite coverage/);
  assert.match(html, /Satellite cross-check/);
  assert.match(html, /does not change the foliage recommendation until spectral processing|do not change the foliage recommendation|spectral foliage analysis is not enabled yet/i);
  assert.match(html, /api\/blue-ridge-visual-verification/);
  assert.match(html, /current camera checks/);
});

test("visual verification client script parses as JavaScript", () => {
  const html = fs.readFileSync(pagePath, "utf8");
  const match = html.match(/<script data-blue-ridge-visual-script>([\s\S]*?)<\/script>/);
  assert.ok(match, "visual verification client script not found");
  assert.doesNotThrow(() => new Function(match[1]));
});
