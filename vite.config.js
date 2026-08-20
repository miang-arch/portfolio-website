import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const positionsFile = path.join(root, "src", "preview-positions.json");
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const validPosition = /^(?:100|[1-9]?\d)% (?:100|[1-9]?\d)%$/;
const validSlug = /^[a-z0-9-]+$/;
const validScale = (value) => Number.isFinite(value) && value >= 1 && value <= 2.5;

function requestHostname(request) {
  try {
    return new URL(`http://${request.headers.host}`).hostname;
  } catch {
    return "";
  }
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 4096) reject(new Error("Request body is too large."));
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function previewPositionEditor() {
  return {
    name: "local-preview-position-editor",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__preview-position", async (request, response) => {
        response.setHeader("Content-Type", "application/json; charset=utf-8");

        if (request.method !== "POST") {
          response.statusCode = 404;
          response.end(JSON.stringify({ error: "Not found." }));
          return;
        }

        const hostname = requestHostname(request);
        const origin = request.headers.origin;
        const originHostname = origin ? new URL(origin).hostname : hostname;
        if (!localHosts.has(hostname) || !localHosts.has(originHostname) || request.headers["x-preview-editor"] !== "local-dev") {
          response.statusCode = 403;
          response.end(JSON.stringify({ error: "Local development access only." }));
          return;
        }

        try {
          const payload = JSON.parse(await readRequestBody(request));
          const { group, slug, position } = payload;
          const scale = Number(payload.scale);
          if (!["projects", "competitions"].includes(group) || !validSlug.test(slug) || !validPosition.test(position) || !validScale(scale)) {
            response.statusCode = 400;
            response.end(JSON.stringify({ error: "Invalid preview position payload." }));
            return;
          }

          const positions = JSON.parse(await fs.readFile(positionsFile, "utf8"));
          positions[group] ??= {};
          positions[group][slug] = { position, scale: Math.round(scale * 100) / 100 };
          const temporaryFile = `${positionsFile}.tmp`;
          await fs.writeFile(temporaryFile, `${JSON.stringify(positions, null, 2)}\n`, "utf8");
          await fs.rename(temporaryFile, positionsFile);

          response.statusCode = 200;
          response.end(JSON.stringify({ saved: true, group, slug, position, scale }));
        } catch (error) {
          response.statusCode = 500;
          response.end(JSON.stringify({ error: error.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [previewPositionEditor()],
});
