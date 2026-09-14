const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pagePath = path.join(__dirname, '..', 'public/national-tools/fall-color/blue-ridge-parkway/index.html');

test('Parkway comparison uses a real geographic map with dynamic foliage pins', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /leaflet@1\.9\.4\/dist\/leaflet\.css/);
  assert.match(html, /leaflet@1\.9\.4\/dist\/leaflet\.js/);
  assert.match(html, /id="parkway-map"/);
  assert.match(html, /tile\.openstreetmap\.org/);
  assert.match(html, /OpenStreetMap/);
  assert.match(html, /function foliageStage/);
  assert.match(html, /function renderMap/);
  assert.match(html, /Mostly green/);
  assert.match(html, /Starting to turn/);
  assert.match(html, /Good color likely/);
  assert.match(html, /Best color window/);
  assert.match(html, /Late color/);
  assert.match(html, /Past prime/);
  assert.match(html, /Pin colors are the timing outlook/);
});

test('map follows the same area and date choices as the trip planner', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /window\.__renderBlueRidgeMap/);
  assert.match(html, /window\.__renderBlueRidgeCorridor/);
  assert.match(html, /horizon,ids/);
  assert.match(html, /map-scope-label/);
  assert.match(html, /7 days from now/);
});

test('visible comparison language is for foliage visitors, not scientists', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /Where the color is along the Parkway/);
  assert.match(html, /What people are seeing/);
  assert.match(html, /Weather that could knock leaves down/);
  assert.match(html, /Dryness that can dull color/);
  assert.match(html, /How we make the call/);
  assert.match(html, /Are the map pin colors live camera readings\?/);
});
