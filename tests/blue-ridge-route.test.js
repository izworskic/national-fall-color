const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Blue Ridge directory URLs resolve explicitly to committed index.html', () => {
  const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8'));
  const rewrites = Array.isArray(config.rewrites) ? config.rewrites : [];
  const wanted = new Map(rewrites.map((r) => [r.source, r.destination]));
  const target = '/national-tools/fall-color/blue-ridge-parkway/index.html';
  assert.equal(wanted.get('/national-tools/fall-color/blue-ridge-parkway'), target);
  assert.equal(wanted.get('/national-tools/fall-color/blue-ridge-parkway/'), target);
  assert.ok(fs.existsSync(path.join(process.cwd(), 'public/national-tools/fall-color/blue-ridge-parkway/index.html')));
});
