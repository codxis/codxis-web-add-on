import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXTENSION_DIR = join(__dirname, '..', '..');
const SERVER_PUBLIC_DIR = join(__dirname, '..', 'public');

function getCurrentVersion(): string {
  try {
    const manifestPath = join(EXTENSION_DIR, 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    return manifest.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

function generateKeyPair(): void {
  const pemPath = join(SERVER_PUBLIC_DIR, 'extension.pem');
  const pubPath = join(SERVER_PUBLIC_DIR, 'extension.pub');
  
  if (existsSync(pemPath)) {
    console.log('Chave privada já existe em:', pemPath);
    return;
  }
  
  console.log('Gerando par de chaves...');
  
  execSync(`openssl genrsa -out "${pemPath}" 2048 2>/dev/null`, { stdio: 'inherit' });
  execSync(`openssl rsa -in "${pemPath}" -pubout -out "${pubPath}" 2>/dev/null`, { stdio: 'inherit' });
  
  console.log('Chaves geradas com sucesso!');
  console.log('  Privada:', pemPath);
  console.log('  Pública:', pubPath);
}

function getExtensionId(): string {
  const pemPath = join(SERVER_PUBLIC_DIR, 'extension.pem');
  
  if (!existsSync(pemPath)) {
    console.log('⚠️  Gere as chaves primeiro: npm run generate-keys');
    return 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  }
  
  try {
    const result = execSync(`openssl rsa -in "${pemPath}" -RSAPublicKey_out -outform DER 2>/dev/null | openssl md5 -c`, { encoding: 'utf-8' });
    const hash = result.replace(/MD5\(stdin\)= /g, '').trim().replace(/:/g, '');
    const alphabet = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 32; i++) {
      const byteIndex = Math.floor(i / 2);
      const hexChar = hash.slice(byteIndex * 2, byteIndex * 2 + 2);
      const val = parseInt(hexChar, 16);
      id += alphabet[val % alphabet.length];
    }
    return id;
  } catch {
    return 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  }
}

function packageExtension(): void {
  const pemPath = join(SERVER_PUBLIC_DIR, 'extension.pem');
  const crxPath = join(SERVER_PUBLIC_DIR, 'indicador-pintores.crx');
  const version = getCurrentVersion();
  
  if (!existsSync(pemPath)) {
    console.log('⚠️  Gere as chaves primeiro: npm run generate-keys');
    return;
  }
  
  console.log(`Empacotando extensão versão ${version}...`);
  
  try {
    execSync(`chrome --pack-extension="${EXTENSION_DIR}" --pack-extension-key="${pemPath}" --pack-output="${crxPath.replace('.crx', '')}"`, { stdio: 'inherit' });
    
    if (existsSync(crxPath)) {
      console.log('✅ Extensão empacotada com sucesso!');
      console.log('   Arquivo:', crxPath);
      console.log('   Extension ID:', getExtensionId());
    }
  } catch (error) {
    console.log('⚠️  Chrome não encontrado no PATH');
    console.log('');
    console.log('Instale o Chrome ou use uma destas alternativas:');
    console.log('  1. No Linux: sudo apt install google-chrome-stable');
    console.log('  2. Ou empacote manualmente via chrome://extensions');
    console.log('');
    console.log('Após empacotar manualmente:');
    console.log(`  Copie o arquivo .crx para: ${crxPath}`);
    console.log(`  Copie o arquivo .pem para: ${pemPath}`);
  }
}

function showStatus(): void {
  const pemPath = join(SERVER_PUBLIC_DIR, 'extension.pem');
  const crxPath = join(SERVER_PUBLIC_DIR, 'indicador-pintores.crx');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('          Status do Servidor de Updates                ');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Versão atual: ${getCurrentVersion()}`);
  console.log(`Chave privada: ${existsSync(pemPath) ? '✅ OK' : '❌ Não encontrada'}`);
  console.log(`Arquivo CRX:  ${existsSync(crxPath) ? '✅ OK' : '❌ Não encontrado'}`);
  console.log(`Extension ID: ${getExtensionId()}`);
  console.log('═══════════════════════════════════════════════════════');
}

const args = process.argv.slice(2);
const command = args[0] || 'status';

switch (command) {
  case 'generate-keys':
  case 'keys':
    generateKeyPair();
    break;
  case 'package':
    packageExtension();
    break;
  case 'status':
  default:
    showStatus();
    break;
}
