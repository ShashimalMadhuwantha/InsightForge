const fs = require('fs');
const path = require('path');
const defaultSeed = require('./seeds/01_system_defaults');

describe('Database Seeds Mechanism', () => {
  const seedsDir = path.resolve(__dirname, 'seeds');

  it('seeds directory exists and contains runnable seed files', () => {
    expect(fs.existsSync(seedsDir)).toBe(true);
    const files = fs.readdirSync(seedsDir);
    expect(files.length).toBeGreaterThanOrEqual(1);
    expect(files.some(f => f.endsWith('.js'))).toBe(true);
  });

  it('default seed exports an async seed function', () => {
    expect(typeof defaultSeed.seed).toBe('function');
  });
});
