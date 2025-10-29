import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const platform = process.platform;

let cepPath;

if (platform === 'win32') {
  cepPath = path.join(
    'C:',
    'Program Files',
    'Common Files',
    'Adobe',
    'CEP',
    'extensions',
    'aemcp'
  );
} else if (platform === 'darwin') {
  cepPath = path.join(
    process.env.HOME || '',
    'Library',
    'Application Support',
    'Adobe',
    'CEP',
    'extensions',
    'aemcp'
  );
} else {
  console.error('Unsupported platform:', platform);
  process.exit(1);
}

const sourcePath = path.join(__dirname, 'extension');

console.log('====================================');
console.log('AEMCP Installation & Build');
console.log('====================================');
console.log();

// Step 1: Build the server
console.log('Step 1: Building MCP server...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  console.log('✓ Server built successfully');
  console.log();
} catch (err) {
  console.error('Failed to build server');
  process.exit(1);
}

// Step 2: Install CEP extension
console.log('Step 2: Installing CEP extension...');
console.log(`Source: ${sourcePath}`);
console.log(`Target: ${cepPath}`);

// Create CEP extensions directory if it doesn't exist
const extensionsDir = path.dirname(cepPath);
if (!fs.existsSync(extensionsDir)) {
  fs.mkdirSync(extensionsDir, { recursive: true });
}

// Remove existing installation
if (fs.existsSync(cepPath)) {
  console.log('Found existing installation. Removing...');
  try {
    fs.rmSync(cepPath, { recursive: true, force: true });
    console.log('✓ Previous installation removed');
  } catch (err) {
    console.error('Failed to remove existing installation:', err.message);
    process.exit(1);
  }
}

// Copy extension
console.log('Copying extension files...');
try {
  fs.cpSync(sourcePath, cepPath, { recursive: true });
  
  // Copy .debug file
  const debugSource = path.join(sourcePath, '.debug');
  const debugTarget = path.join(cepPath, '.debug');
  if (fs.existsSync(debugSource)) {
    fs.copyFileSync(debugSource, debugTarget);
  }
  
  console.log('✓ Extension files copied successfully');
} catch (err) {
  console.error('Failed to copy files:', err.message);
  process.exit(1);
}

console.log('\n========================================');
console.log('✓ BUILD & INSTALLATION COMPLETE!');
console.log('========================================');
console.log(`\nServer built at:`);
console.log(`  ${path.join(__dirname, 'server', 'build', 'index.js')}`);
console.log(`\nExtension installed to:`);
console.log(`  ${cepPath}`);
console.log('\nNext steps:');
console.log('  1. Reload the CEP panel in After Effects');
console.log('     (Window > Extensions > AEMCP)');
console.log('  2. Restart Claude Desktop to use the updated server');
console.log('========================================');