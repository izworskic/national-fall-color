const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pagePath = path.join(__dirname, '..', 'public/national-tools/fall-color/blue-ridge-parkway/index.html');

test('Blue Ridge first-screen planner is organized around visitor decisions', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /fall color trip planner/);
  assert.match(html, /Make this useful for your trip/);
  assert.match(html, /Where will you be driving\?/);
  assert.match(html, /Anywhere \/ I’m flexible/);
  assert.match(html, /Boone \/ Blowing Rock/);
  assert.match(html, /Asheville/);
  assert.match(html, /Waynesville \/ Cherokee/);
  assert.match(html, /Today/);
  assert.match(html, /7 days from now/);
  assert.match(html, /what this call uses/);
  assert.match(html, /Live camera views always show current conditions/);
  assert.match(html, /Best drive near/);
  assert.match(html, /Start around /);
});

test('Blue Ridge visual evidence is phrased for visitors before technical detail', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /current camera checks/);
  assert.match(html, /See what the leaves look like before you drive/);
  assert.match(html, /See live cameras/);
  assert.match(html, /change from summer/);
  assert.match(html, /change this week/);
  assert.match(html, /What is this camera signal\?/);
  assert.match(html, /Technical: satellite coverage/);
  assert.match(html, /id="live-cameras"/);
  assert.match(html, /research camera broadly agrees|live-view links/i);
});

test('Blue Ridge persona selection refreshes map and visual verification', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.doesNotMatch(html, /blue-ridge-decision-ready",event=>load\(event\.detail\),\{once:true\}/);
  assert.match(html, /__personaDerived/);
  assert.match(html, /visualRequest/);
  assert.match(html, /__renderBlueRidgeMap/);
  assert.match(html, /__renderBlueRidgeCorridor/);
  assert.match(html, /new CustomEvent\("blue-ridge-decision-ready"/);
});

test('Blue Ridge persona application script parses as JavaScript', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  const match = html.match(/<script data-blue-ridge-persona-script>\s*([\s\S]*?)\s*<\/script>/);
  assert.ok(match, 'persona application script not found');
  assert.doesNotThrow(() => new Function(match[1]));
});

test('technical evidence remains available without leading the experience', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /What could change the color/);
  assert.match(html, /How we make the call/);
  assert.match(html, /GCC/);
  assert.match(html, /Sentinel-2/);
  assert.match(html, /U\.S\. Drought Monitor|Drought Monitor/);
});
