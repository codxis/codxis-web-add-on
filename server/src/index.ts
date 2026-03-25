import Fastify from "fastify";
import cors from "@fastify/cors";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

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

interface UpdateManifest {
  version: string;
  extensionId: string;
}

function getCurrentVersion(): string {
  try {
    const manifestPath = join(EXTENSION_DIR, "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    return manifest.version || "1.0.0";
  } catch {
    return "1.0.0";
  }
}

function getExtensionId(): string {
  try {
    const pemPath = join(PUBLIC_DIR, "extension.pem");
    if (existsSync(pemPath)) {
      const result = execSync(
        `openssl rsa -in "${pemPath}" -RSAPublicKey_out -outform DER 2>/dev/null | openssl md5 -c`,
        { encoding: "utf-8" },
      );
      const hash = result
        .replace(/MD5\(stdin\)= /g, "")
        .trim()
        .replace(/:/g, "");
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
    console.log(
      "Para obter o Extension ID, empacote a extensão usando Chrome primeiro",
    );
  }
  return "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
}

function generateUpdateXml(version: string, extensionId: string): string {
  const baseUrl = process.env.BASE_URL || "http://localhost:3333";

  return `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${extensionId}'>
    <updatecheck
      codebase='${baseUrl}/${CRX_FILE}'
      version='${version}'
    />
  </app>
</gupdate>`;
}

fastify.get("/updates.xml", async (request, reply) => {
  const version = getCurrentVersion();
  // const extensionId = getExtensionId();
  const extensionId = "fpdagocpdimcamolfcicljajmhcbfmjd";
  const xml = generateUpdateXml(version, extensionId);

  reply.header("Content-Type", "application/xml");
  return xml;
});

fastify.get("/updates.xml/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  const version = getCurrentVersion();

  const xml = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${id}'>
    <updatecheck
      codebase='${process.env.BASE_URL || "http://localhost:3333"}/${CRX_FILE}'
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

fastify.get("/version", async (request, reply) => {
  return {
    version: getCurrentVersion(),
    extensionId: getExtensionId(),
    crxUrl: `/${CRX_FILE}`,
    updateXmlUrl: "/update.xml",
  };
});

fastify.post("/package", async (request, reply) => {
  try {
    const manifestPath = join(EXTENSION_DIR, "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    const version = manifest.version || "1.0.0";
    const crxFileName = `indicador-pintores-v${version}.crx`;

    const pemPath = join(PUBLIC_DIR, "extension.pem");
    if (!existsSync(pemPath)) {
      reply.code(400);
      return {
        error:
          "extension.pem not found. Pack extension manually first using Chrome.",
      };
    }

    const command = `cd "${EXTENSION_DIR}" && chrome --pack-extension="${EXTENSION_DIR}" --pack-extension-key="${pemPath}" --pack-output="${join(PUBLIC_DIR, "indicador-pintores.crx")}" 2>/dev/null || echo "Chrome not found"`;

    execSync(command, { stdio: "pipe" });

    const latestCrx = join(PUBLIC_DIR, "indicador-pintores.crx");
    if (!existsSync(latestCrx)) {
      return {
        message:
          'Run: chrome --pack-extension="/path/to/extension" --pack-extension-key="/path/to/server/public/extension.pem"',
        version,
        instruction: "After generating CRX, place it in server/public/ folder",
      };
    }

    return {
      success: true,
      version,
      crxPath: latestCrx,
      downloadUrl: `/${CRX_FILE}`,
    };
  } catch (error) {
    reply.code(500);
    return { error: String(error) };
  }
});

fastify.get("/", async (request, reply) => {
  return {
    name: "Indicador de Pintores - Update Server",
    endpoints: {
      updateXml: "/update.xml",
      crxDownload: `/${CRX_FILE}`,
      version: "/version",
      package: "POST /package",
    },
    currentVersion: getCurrentVersion(),
    extensionId: getExtensionId(),
  };
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3333");
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
