#!/usr/bin/env node
/**
 * Database Backup Script — Smart College ERP
 * Uses mongodump to backup MongoDB to a timestamped directory.
 * Usage: node backend/backup.js
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/college_erp';

try {
  console.log(`\n📦 Starting database backup...`);
  console.log(`   Backup path: ${backupPath}`);
  execSync(`mongodump --uri="${mongoUri}" --out="${backupPath}"`, { stdio: 'inherit' });
  console.log(`\n✅ Backup completed: ${backupPath}`);

  // Clean up old backups (keep last 7)
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-'))
    .map(f => ({ name: f, path: path.join(BACKUP_DIR, f), mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime);

  if (backups.length > 7) {
    const toDelete = backups.slice(7);
    toDelete.forEach(b => {
      fs.rmSync(b.path, { recursive: true, force: true });
      console.log(`🗑️  Removed old backup: ${b.name}`);
    });
  }
} catch (err) {
  console.error(`\n❌ Backup failed: ${err.message}`);
  console.error('Make sure mongodump is installed (part of MongoDB Tools).');
  process.exit(1);
}
