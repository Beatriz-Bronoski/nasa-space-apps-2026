import http from "node:http";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { sharedApi } from "./shared.mjs";

const port = Number(process.env.PORT || 3000);
const hostname = process.env.STILL_HERE_HOST || "127.0.0.1";
const dev = process.argv.includes("--dev");
const file = resolve(process.env.STILL_HERE_DB || ".data/still-here.sqlite");
mkdirSync(dirname(file), { recursive: true });
const api = sharedApi(file, {
  secureCookie: process.env.STILL_HERE_HTTPS === "1",
});
let nextApp;
let servePage;
const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  if (url.pathname.startsWith("/api/shared/"))
    return void api.handle(req, res, url);
  return void servePage(req, res);
});
if (dev) {
  const { default: next } = await import("next");
  nextApp = next({ dev: true, hostname, port, httpServer: server });
  await nextApp.prepare();
  servePage = nextApp.getRequestHandler();
  server.on("upgrade", nextApp.getUpgradeHandler());
} else {
  const { existsSync } = await import("node:fs");
  if (!existsSync("out/index.html"))
    throw new Error("Execute npm run build antes de iniciar a prévia.");
  const { default: serve } = await import("serve-handler");
  servePage = (req, res) =>
    serve(req, res, {
      public: "out",
      directoryListing: false,
      cleanUrls: true,
    });
}
server.listen(port, hostname, () =>
  console.log("Still Here • http://" + hostname + ":" + port),
);
