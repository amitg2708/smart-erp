#!/usr/bin/env node
/**
 * Database Restore Script — Smart College ERP
 * Uses mongorestore to restore a backup.
 * Usage: node backend/restore.js [backup-name]
 *   e.g. node backend/restore.js backup-2024-01-15T10-30-00-000Z
 *        node backend/restore.js latest
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/college_erp';

let backupName = process.argv[2];

if (!backupName || backupName === 'latest') {
  // Find the most recent backup
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error('❌ No backups directory found. Run backup.js first.');
    process.exit(1);
  }
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime);

  if (!backups.length) {
    console.error('❌ No backups found.');
    process.exit(1);
  }
  backupName = backups[0].name;
  console.log(`Using latest backup: ${backupName}`);
}

const backupPath = path.join(BACKUP_DIR, backupName);
if (!fs.existsSync(backupPath)) {
  console.error(`❌ Backup not found: ${backupPath}`);
  process.exit(1);
}

try {
  console.log(`\n♻️  Restoring database from: ${backupPath}`);
  console.log('⚠️  WARNING: This will overwrite existing data!');
  execSync(`mongorestore --uri="${mongoUri}" --drop "${backupPath}"`, { stdio: 'inherit' });
  console.log(`\n✅ Database restored successfully from ${backupName}`);
} catch (err) {
  console.error(`\n❌ Restore failed: ${err.message}`);
  console.error('Make sure mongorestore is installed (part of MongoDB Tools).');
  process.exit(1);
}
