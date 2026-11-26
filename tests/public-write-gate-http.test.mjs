import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const express = require('express');
const ts = require('typescript');
const routePath = resolve(import.meta.dirname, '../server/routes.ts');
const source = readFileSync(routePath, 'utf8');

function registerActualRoutes(app, storage, publicWrites) {
  const begin = source.indexOf('  const DEFAULT_USER_ID = 1;');
  const end = source.indexOf('  const httpServer = createServer(app);');
  assert.ok(begin >= 0 && end > begin, 'Expected real route registration boundaries');
  const tsSource = source.slice(begin, end);
  const compiled = ts.transpileModule(tsSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
    reportDiagnostics: true,
  });
  assert.equal(compiled.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
  const fakeSchema = { parse(value) { return value; }, partial() { return this; } };
  const context = {
    app,
    storage,
    z: { ZodError: class extends Error {} },
    insertUsageEntrySchema: fakeSchema,
    insertSettingsSchema: fakeSchema,
    getMondayOfWeek: () => '2026-01-05',
    process: { env: publicWrites ? { ALLOW_PUBLIC_DEMO_WRITES: 'true' } : {} },
    console: { log() {}, error() {} },
  };
  vm.runInNewContext(compiled.outputText, context, { timeout: 3000, filename: 'server/routes.ts' });
}

async function makeServer(publicWrites = false) {
  const writes = [];
  const storage = {
    async getUsageEntries() { return [{ id: 1, userId: 1, weekStartDate: '2026-01-05' }]; },
    async getUsageEntryByWeek() { return undefined; },
    async getRecentUsage() { return []; },
    async createUsageEntry(data) { writes.push('POST usage'); return { id: 2, ...data }; },
    async updateUsageEntry(id, data) { writes.push('PUT usage'); return { id, ...data }; },
    async getAllTips() { return []; },
    async getTipsByCategory() { return []; },
    async getRandomTip() { return null; },
    async getAllBadges() { return []; },
    async getUserBadges() { return []; },
    async checkBadgeEligibility() { return []; },
    async awardBadge() { throw new Error('No badge was eligible in this fixture'); },
    async getSettings() { return { id: 1, userId: 1 }; },
    async updateSettings(_userId, value) { writes.push('settings write'); return value; },
  };
  const app = express();
  app.use(express.json());
  registerActualRoutes(app, storage, publicWrites);
  const server = await new Promise((resolveListen, reject) => {
    const listener = app.listen(0, '127.0.0.1', () => resolveListen(listener));
    listener.on('error', reject);
  });
  return {
    writes,
    async request(method, endpoint, body) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}${endpoint}`, {
        method,
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: response.status, json: await response.json() };
    },
    async close() {
      await new Promise((resolveClose, reject) => server.close(err => err ? reject(err) : resolveClose()));
    },
  };
}

test('anonymous usage and settings writes are fail-closed by default', async () => {
  const fixture = await makeServer(false);
  try {
    const cases = [
      ['POST', '/api/usage', { weekStartDate: '2026-01-12', electricityUsage: '2' }],
      ['PUT', '/api/usage/1', { waterUsage: '3' }],
      ['PUT', '/api/settings', { weeklyAlerts: false }],
      ['PATCH', '/api/settings', { thresholdAlerts: false }],
    ];
    for (const [method, url, body] of cases) {
      const response = await fixture.request(method, url, body);
      assert.equal(response.status, 403, `${method} ${url}`);
    }
    assert.deepEqual(fixture.writes, []);
  } finally {
    await fixture.close();
  }
});

test('the explicitly insecure public-demo opt-in preserves existing write behavior', async () => {
  const fixture = await makeServer(true);
  try {
    const cases = [
      ['POST', '/api/usage', { weekStartDate: '2026-01-12', electricityUsage: '2' }],
      ['PUT', '/api/usage/1', { waterUsage: '3' }],
      ['PUT', '/api/settings', { weeklyAlerts: false }],
      ['PATCH', '/api/settings', { thresholdAlerts: false }],
    ];
    for (const [method, url, body] of cases) {
      const response = await fixture.request(method, url, body);
      assert.equal(response.status, 200, `${method} ${url}`);
    }
    assert.equal(fixture.writes.length, 4);
  } finally {
    await fixture.close();
  }
});

test('read-only demo usage and settings views remain available without the opt-in', async () => {
  const fixture = await makeServer(false);
  try {
    const usage = await fixture.request('GET', '/api/usage');
    const settings = await fixture.request('GET', '/api/settings');
    assert.equal(usage.status, 200);
    assert.equal(settings.status, 200);
    assert.equal(fixture.writes.length, 0);
  } finally {
    await fixture.close();
  }
});
