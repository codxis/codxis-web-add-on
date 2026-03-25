import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CRX_FILE = "extension.crx";
const EXTENSION_DIR = join(__dirname, "..");
const PUBLIC_DIR = join(__dirname, "..", "public");

function getCurrentVersion() {
  try {
    const manifestPath = join(EXTENSION_DIR, "extension", "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    return manifest.version || "1.0.1";
  } catch {
    return "1.0.1";
  }
}

function getExtensionId() {
  try {
    const pemPath = join(PUBLIC_DIR, "extension.pem");
    if (existsSync(pemPath)) {
      const result = execSync(
        `openssl rsa -in "${pemPath}" -RSAPublicKey_out -outform DER 2>/dev/null | openssl md5 -c`,
        { encoding: "utf-8" }
      );
      const hash = result.replace(/MD5\(stdin\)= /g, "").trim().replace(/:/g, "");
      const alphabet =
        "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz0123456789";
      let id = "";
      for (let i = 0; i < 32; i++) {
        const byteIndex = Math.floor(i / 2);
        const hexChar = hash.slice(byteIndex * 2, byteIndex * 2 + 2);
        const val = parseInt(hexChar, 16);
        id += alphabet[val % alphabet.length];
      }
      return id;
    }
  } catch {
    console.log("Para obter o Extension ID, empacote a extensão usando Chrome primeiro");
  }
  return "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
}

function generateUpdateXml(version: string, extensionId: string): string {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `https://${process.env.DEPLOY_URL || "localhost"}`;

  return `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${extensionId}'>
    <updatecheck 
      codebase='${baseUrl}/download/${CRX_FILE}' 
      version='${version}' 
    />
  </app>
</gupdate>`;
}

export default function handler(req, res) {
  const { url } = req;

  if (url === "/" || url === "") {
    res.json({
      name: "Indicador de Pintores - Update Server",
      version: getCurrentVersion(),
      extensionId: getExtensionId(),
    });
    return;
  }

  if (url === "/version") {
    res.json({
      version: getCurrentVersion(),
      extensionId: getExtensionId(),
    });
    return;
  }

  if (url === "/update.xml") {
    const version = getCurrentVersion();
    const extensionId = getExtensionId();
    const xml = generateUpdateXml(version, extensionId);
    res.setHeader("Content-Type", "application/xml");
    res.send(xml);
    return;
  }

  if (url === `/download/${CRX_FILE}`) {
    const crxPath = join(PUBLIC_DIR, CRX_FILE);
    if (!existsSync(crxPath)) {
      res.status(404).json({ error: "CRX file not found" });
      return;
    }
    const crxBuffer = readFileSync(crxPath);
    res.setHeader("Content-Type", "application/x-chrome-extension");
    res.setHeader("Content-Disposition", `attachment; filename="${CRX_FILE}"`);
    res.send(crxBuffer);
    return;
  }

  res.status(404).json({ error: "Not found" });
}