import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { createWriteStream } from "fs";
// import archiver from "archiver";
import { Readable } from "stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: true,
  methods: ["GET", "POST"],
});

const CRX_FILE = "extension.crx";
const EXTENSION_DIR = join(__dirname, "..", "..");
const PUBLIC_DIR = join(__dirname, "..", "public");

// Lê a versão atual do manifest
function getCurrentVersion(): string {
  try {
    const manifestPath = join(EXTENSION_DIR, "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    return manifest.version || "1.0.0";
  } catch {
    return "1.0.0";
  }
}

// API Key simples — em produção use variável de ambiente
const API_KEY = process.env.EXTENSION_API_KEY || "codxistop123";

function validateApiKey(request: any, reply: any): boolean {
  const key = request.headers["x-api-key"];
  if (key !== API_KEY) {
    reply.code(401).send({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// ─── Endpoint: versão atual ──────────────────────────────────────────────────
fastify.get("/version", async (request, reply) => {
  if (!validateApiKey(request, reply)) return;

  const version = getCurrentVersion();
  const baseUrl = process.env.BASE_URL || "http://localhost:3333";

  return {
    version,
    download_url: `${baseUrl}/download-zip`,
    updated_at: new Date().toISOString(),
  };
});

// ─── Endpoint: download ZIP dos arquivos da extensão ────────────────────────
// Gera um ZIP em memória com todos os arquivos JS/CSS que podem ser atualizados
fastify.get("/download-zip", async (request, reply) => {
  if (!validateApiKey(request, reply)) return;

  // Pastas e arquivos a incluir no ZIP
  const includePaths = ["src/shared", "src/contents", "src/css"];

  const files: Record<string, string> = {};

  for (const dir of includePaths) {
    const fullDir = join(EXTENSION_DIR, dir);
    if (!existsSync(fullDir)) continue;

    const entries = readdirSync(fullDir, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.isFile() &&
        (entry.name.endsWith(".js") || entry.name.endsWith(".css"))
      ) {
        const fullPath = join(fullDir, entry.name);
        const relPath = relative(EXTENSION_DIR, fullPath);
        files[relPath] = readFileSync(fullPath, "utf-8");
      }
    }
  }

  // Importa JSZip dinamicamente (instalar: npm install jszip)
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }

  // Adiciona manifest.json para o cliente saber a versão
  const manifestPath = join(EXTENSION_DIR, "manifest.json");
  if (existsSync(manifestPath)) {
    zip.file("manifest.json", readFileSync(manifestPath, "utf-8"));
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  reply.header("Content-Type", "application/zip");
  reply.header(
    "Content-Disposition",
    "attachment; filename=extension-update.zip",
  );
  reply.header("X-Extension-Version", getCurrentVersion());
  return reply.send(zipBuffer);
});

// ─── Endpoints existentes (CRX / updates.xml) ───────────────────────────────
fastify.get("/updates.xml", async (request, reply) => {
  const version = getCurrentVersion();
  const extensionId = "fpdagocpdimcamolfcicljajmhcbfmjd";
  const baseUrl = process.env.BASE_URL || "http://localhost:3333";

  const xml = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${extensionId}'>
    <updatecheck
      codebase='${baseUrl}/${CRX_FILE}'
      version='${version}'
    />
  </app>
</gupdate>`;

  reply.header("Content-Type", "application/xml");
  return xml;
});

fastify.get(`/${CRX_FILE}`, async (request, reply) => {
  const crxPath = join(PUBLIC_DIR, CRX_FILE);

  if (!existsSync(crxPath)) {
    reply.code(404);
    return { error: "CRX file not found. Run npm run package first." };
  }

  const crxBuffer = readFileSync(crxPath);
  reply.header("Content-Type", "application/x-chrome-extension");
  reply.header("Content-Disposition", `attachment; filename="${CRX_FILE}"`);
  return crxBuffer;
});

// ─── Health check ────────────────────────────────────────────────────────────
fastify.get("/", async () => {
  return {
    name: "Indicador de Pintores — Update Server",
    version: getCurrentVersion(),
    endpoints: {
      version: "GET /version (requer x-api-key)",
      downloadZip: "GET /download-zip (requer x-api-key)",
      updateXml: "GET /updates.xml",
      crx: `GET /${CRX_FILE}`,
    },
  };
});

// ─── Start ────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3333");
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`Servidor rodando em http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
