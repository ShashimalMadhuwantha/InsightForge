const fs = require('fs');
const path = require('path');
const initialMigration = require('./migrations/20260906000001_initial_schema');

describe('Database Migrations Pipeline', () => {
  const migrationsDir = path.resolve(__dirname, 'migrations');

  it('migrations directory exists and contains timestamped migration files', () => {
    expect(fs.existsSync(migrationsDir)).toBe(true);
    const files = fs.readdirSync(migrationsDir);
    expect(files.length).toBeGreaterThanOrEqual(1);
    expect(files.some(f => f.endsWith('.js'))).toBe(true);
  });

  it('initial migration exports both up and down async functions', () => {
    expect(typeof initialMigration.up).toBe('function');
    expect(typeof initialMigration.down).toBe('function');
  });

  it('migration filenames strictly follow timestamp prefix convention', () => {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js'));
    const timestampRegex = /^\d{14}_[a-zA-Z0-9_-]+\.js$/;
    files.forEach(file => {
      expect(file).toMatch(timestampRegex);
    });
  });
});
