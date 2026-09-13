const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const engine = require("../api/blue-ridge-fall-color.js")._test;
const pagePath = path.join(__dirname, "..", "public/national-tools/fall-color/blue-ridge-parkway/index.html");

function station(id, milepost, median, mad = 8, elevation_ft = 4000) {
  return { id, name: id, state: "NC", corridor: "test", milepost, latitude: 35, longitude: -82, elevation_ft, elevation_note: "test", median, mad };
}

test("historical fit is strongest near a station's own transition midpoint", () => {
  const centered = engine.historicalFit(280, 280, 8);
  const early = engine.historicalFit(250, 280, 8);
  assert.equal(centered.stage, "inside the strongest historical transition window");
  assert.ok(centered.score > early.score);
  assert.equal(centered.days_from_midpoint, 0);
});

test("road closure ranges are parsed conservatively and can deprioritize an anchor", () => {
  const parsed = engine.parseRoadClosures("<table><tr><td>63.5 - 63.9</td><td>Closed for bridge work</td></tr></table>");
  assert.deepEqual(parsed.ranges.map(({ start, end }) => ({ start, end })), [{ start: 63.5, end: 63.9 }]);
  assert.equal(engine.candidateRoadStatus(63.7, parsed.ranges).possible_closure, true);
  assert.equal(engine.candidateRoadStatus(70, parsed.ranges).possible_closure, false);

  const ranked = engine.rankStations([
    station("closed-best", 63.7, 280),
    station("open-next", 80, 282),
  ], 280, parsed.ranges);
  assert.equal(ranked[0].id, "open-next");
});

test("NPS road-status timestamp wording is captured", () => {
  const parsed = engine.parseRoadClosures("Road status as of 7:06 A.M, Wednesday, September 9, 2026. MP 63.5 - 63.9 Closed for bridge rehabilitation.");
  assert.equal(parsed.updated, "September 9, 2026");
  assert.equal(parsed.ranges.length, 1);
});

test("next-week story can describe a downslope shift without inventing a percent peak", () => {
  const story = engine.elevationStory(
    { elevation_ft: 5500 },
    { elevation_ft: 3500 },
  );
  assert.match(story, /shifts downslope/i);
  assert.match(story, /5,500 ft/);
  assert.match(story, /3,500 ft/);
});

test("U.S. Drought Monitor categories are explicit stress labels", () => {
  assert.equal(engine.droughtLabel(0), "D0 Abnormally Dry");
  assert.equal(engine.droughtLabel(4), "D4 Exceptional Drought");
  assert.equal(engine.droughtLabel(9), null);
});

test("Blue Ridge page is a distinct indexable corridor decision surface", () => {
  const html = fs.readFileSync(pagePath, "utf8");
  assert.match(html, /<title>Blue Ridge Parkway Fall Colors 2026: Best Drive Now/);
  assert.ok(html.includes('<link rel="canonical" href="https://chrisizworski.com/national-tools/fall-color/blue-ridge-parkway/">'));
  assert.match(html, /Blue Ridge Parkway Fall Color Live/);
  assert.match(html, /trip-verdict/);
  assert.match(html, /Do not make a foliage-only trip yet/);
  assert.match(html, /Strong historical color window/);
  assert.match(html, /Do not confuse “best available” with peak/);
  assert.match(html, /What changes over the next 7 days\?/);
  assert.match(html, /The Parkway, north to south/);
  assert.match(html, /api\/blue-ridge-fall-color/);
  assert.match(html, /Check official Parkway road status/);
  assert.match(html, /NPS fall-color guidance/);
  assert.match(html, /not a measured percent-peak map|No\. It is a decision engine/i);
});

test("inline Blue Ridge application script parses as JavaScript", () => {
  const html = fs.readFileSync(pagePath, "utf8");
  const match = html.match(/<script>\s*(\(function\(\)\{[\s\S]*?\}\)\(\);)\s*<\/script>/);
  assert.ok(match, "application script not found");
  assert.doesNotThrow(() => new Function(match[1]));
});
