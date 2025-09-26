#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ContentHarvest AI...\n');

// Check if dependencies are installed
const fs = require('fs');
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  const install = spawn('npm', ['run', 'install-all'], { stdio: 'inherit' });
  
  install.on('close', (code) => {
    if (code === 0) {
      startApplication();
    } else {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  startApplication();
}

function startApplication() {
  console.log('🔧 Starting backend and frontend...\n');
  
  const dev = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
  
  dev.on('close', (code) => {
    console.log(`\n✅ Application stopped with code ${code}`);
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    dev.kill('SIGINT');
    process.exit(0);
  });
}