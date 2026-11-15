import { DatabaseSync } from "node:sqlite";
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { isKeepsake } from "../src/lib/keepsake.ts";

const hashPassword = promisify(scrypt);
const digest = (value) => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(24).toString("base64url");
const week = 7 * 86400_000;
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function requireValue(condition, message, status = 400) {
  if (!condition) throw new HttpError(status, message);
}
function textField(value, max, required = true) {
  requireValue(
    typeof value === "string" &&
      value.length <= max &&
      (!required || value.trim()),
    "Confira o conteúdo dos campos.",
  );
  return value.trim();
}
async function readBody(req) {
  requireValue(
    req.headers["content-type"]?.split(";")[0] === "application/json",
    "Envie dados JSON.",
    415,
  );
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    requireValue(length <= 600_000, "A foto ultrapassa o limite.", 413);
    chunks.push(chunk);
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (data && typeof data === "object" && !Array.isArray(data)) return data;
  } catch {}
  throw new HttpError(400, "Dados inválidos.");
}
export function sharedApi(filename, { secureCookie = false } = {}) {
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA foreign_keys=ON;
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY, handle TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, verifier BLOB NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(key TEXT PRIMARY KEY, account TEXT NOT NULL REFERENCES accounts, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS albums(id TEXT PRIMARY KEY, title TEXT NOT NULL, owner TEXT NOT NULL REFERENCES accounts);
    CREATE TABLE IF NOT EXISTS members(album TEXT NOT NULL REFERENCES albums, account TEXT NOT NULL REFERENCES accounts, PRIMARY KEY(album,account));
    CREATE TABLE IF NOT EXISTS invites(key TEXT PRIMARY KEY, album TEXT NOT NULL REFERENCES albums, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS pages(seq INTEGER PRIMARY KEY, album TEXT NOT NULL REFERENCES albums, author TEXT NOT NULL REFERENCES accounts, request TEXT NOT NULL,
      title TEXT NOT NULL, body TEXT NOT NULL, photo TEXT, model TEXT, created TEXT NOT NULL, UNIQUE(album,author,request));
    CREATE INDEX IF NOT EXISTS album_pages ON pages(album,seq);
    CREATE TABLE IF NOT EXISTS page_versions(page INTEGER PRIMARY KEY REFERENCES pages(seq), revision INTEGER NOT NULL UNIQUE);
    INSERT OR IGNORE INTO page_versions(page,revision) SELECT seq,seq FROM pages;
    CREATE TRIGGER IF NOT EXISTS page_added AFTER INSERT ON pages BEGIN
      INSERT INTO page_versions SELECT NEW.seq,coalesce(max(revision),0)+1 FROM page_versions;
    END;
    CREATE TRIGGER IF NOT EXISTS model_changed AFTER UPDATE OF model ON pages WHEN NEW.model IS NOT OLD.model BEGIN
      UPDATE page_versions SET revision=(SELECT max(revision)+1 FROM page_versions) WHERE page=NEW.seq;
    END;
  `);
  const query = (sql) => db.prepare(sql);
  const attempts = new Map();
  const clearExpired = setInterval(() => {
    db.prepare("DELETE FROM sessions WHERE expires<=?").run(Date.now());
    db.prepare("DELETE FROM invites WHERE expires<=?").run(Date.now());
    for (const [key, entry] of attempts)
      if (entry.until < Date.now()) attempts.delete(key);
  }, 60000);
  clearExpired.unref();
  const loginCookie = (value, seconds) =>
    "stillhere_sid=" +
    value +
    "; HttpOnly; SameSite=Lax; Path=/; Max-Age=" +
    seconds +
    (secureCookie ? "; Secure" : "");
  const createInvite = (album) => {
    const code = token();
    query("DELETE FROM invites WHERE album=?").run(album);
    query("INSERT INTO invites VALUES (?,?,?)").run(
      digest(code),
      album,
      Date.now() + week,
    );
    return code;
  };
  async function handle(req, res, url) {
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const json = (status, payload) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify(payload));
    };
    try {
      const path = url.pathname.slice("/api/shared".length);
      const method = req.method;
      const cookie = /(?:^|;\s*)stillhere_sid=([a-zA-Z0-9_-]+)/.exec(
        req.headers.cookie ?? "",
      )?.[1];
      const sessionKey = cookie ? digest(cookie) : "";
      const account = query(
        "SELECT a.id,a.handle FROM sessions s JOIN accounts a ON a.id=s.account WHERE s.key=? AND s.expires>?",
      ).get(sessionKey, Date.now());
      let body = {};
      if (method === "POST") {
        if (req.headers.origin)
          requireValue(
            new URL(req.headers.origin).host === req.headers.host,
            "Origem inválida.",
            403,
          );
        body = await readBody(req);
      }
      if (method === "GET" && path === "/session")
        return json(200, { account: account ?? null });
      if (method === "POST" && ["/register", "/login"].includes(path)) {
        const handle = textField(body.handle, 40).toLowerCase();
        requireValue(
          /^[a-z0-9][a-z0-9_.-]{2,39}$/.test(handle),
          "Use de 3 a 40 letras, números, pontos, hífens ou sublinhados.",
        );
        const password = body.password;
        requireValue(
          typeof password === "string" &&
            password.length >= 10 &&
            password.length <= 128,
          "Use uma senha de 10 a 128 caracteres.",
        );
        const addr = req.socket.remoteAddress ?? "";
        let entry = attempts.get(addr);
        if (!entry || entry.until < Date.now()) {
          entry = { n: 0, until: Date.now() + 60000 };
          attempts.set(addr, entry);
        }
        requireValue(++entry.n <= 20, "Tente novamente em um minuto.", 429);
        const existing = query("SELECT * FROM accounts WHERE handle=?").get(
          handle,
        );
        let id;
        if (path === "/register") {
          const salt = randomBytes(16).toString("hex");
          const verifier = await hashPassword(password, salt, 64);
          id = randomUUID();
          const added = query(
            "INSERT OR IGNORE INTO accounts VALUES (?,?,?,?)",
          ).run(id, handle, salt, verifier);
          requireValue(
            added.changes === 1,
            "Esse nome de usuário já está em uso.",
            409,
          );
        } else {
          const verifier = await hashPassword(
            password,
            existing?.salt ?? "unregistered-account",
            64,
          );
          requireValue(
            existing && timingSafeEqual(verifier, existing.verifier),
            "Usuário ou senha incorretos.",
            401,
          );
          id = existing.id;
        }
        const secret = token();
        query("DELETE FROM sessions WHERE key=?").run(sessionKey);
        query("INSERT INTO sessions VALUES (?,?,?)").run(
          digest(secret),
          id,
          Date.now() + week,
        );
        res.setHeader("Set-Cookie", loginCookie(secret, week / 1000));
        return json(200, { account: { id, handle } });
      }
      requireValue(account, "Entre na sua conta.", 401);
      if (method === "POST" && path === "/logout") {
        query("DELETE FROM sessions WHERE key=?").run(sessionKey);
        res.setHeader("Set-Cookie", loginCookie("", 0));
        return json(200, { ok: true });
      }
      if (method === "GET" && path === "/albums")
        return json(200, {
          albums: query(
            "SELECT a.id,a.title,a.owner FROM albums a JOIN members m ON m.album=a.id WHERE m.account=? ORDER BY a.rowid",
          ).all(account.id),
        });
      if (method === "POST" && path === "/albums") {
        const title = textField(body.title, 90);
        const id = randomUUID();
        db.exec("BEGIN");
        try {
          query("INSERT INTO albums VALUES(?,?,?)").run(id, title, account.id);
          query("INSERT INTO members VALUES(?,?)").run(id, account.id);
          const invite = createInvite(id);
          db.exec("COMMIT");
          return json(201, { album: { id, title, owner: account.id }, invite });
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      }
      if (method === "POST" && path === "/join") {
        const key = digest(textField(body.code, 100));
        const invite = query(
          "SELECT album FROM invites WHERE key=? AND expires>?",
        ).get(key, Date.now());
        requireValue(invite, "Convite inválido, usado ou expirado.", 404);
        db.exec("BEGIN");
        try {
          query("INSERT OR IGNORE INTO members VALUES(?,?)").run(
            invite.album,
            account.id,
          );
          query("DELETE FROM invites WHERE key=?").run(key);
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
        return json(200, { id: invite.album });
      }
      const match =
        /^\/albums\/([\w-]+)\/(invite|pages|photos)(?:\/(\d+))?$/.exec(path);
      requireValue(match, "Recurso não encontrado.", 404);
      const [, album, action, item] = match;
      requireValue(
        query("SELECT 1 FROM members WHERE album=? AND account=?").get(
          album,
          account.id,
        ),
        "Álbum indisponível.",
        404,
      );
      if (method === "POST" && action === "invite" && !item) {
        requireValue(
          query("SELECT 1 FROM albums WHERE id=? AND owner=?").get(
            album,
            account.id,
          ),
          "Apenas o criador pode convidar.",
          403,
        );
        return json(200, { invite: createInvite(album) });
      }
      if (method === "GET" && action === "photos" && item) {
        const row = query(
          "SELECT photo FROM pages WHERE album=? AND seq=?",
        ).get(album, item);
        requireValue(row?.photo, "Foto indisponível.", 404);
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        return res.end(Buffer.from(row.photo.split(",")[1], "base64"));
      }
      if (method === "GET" && action === "pages" && !item) {
        const after = Number(url.searchParams.get("after") ?? "0");
        requireValue(
          Number.isSafeInteger(after) && after >= 0,
          "Página inválida.",
        );
        const rows = query(
          "SELECT p.seq,v.revision,p.title,p.body,p.photo IS NOT NULL AS hasPhoto,p.model,p.created,a.handle AS author FROM pages p JOIN page_versions v ON v.page=p.seq JOIN accounts a ON a.id=p.author WHERE p.album=? AND v.revision>? ORDER BY v.revision LIMIT 32",
        ).all(album, after);
        return json(200, {
          pages: rows.map(({ model, hasPhoto, ...row }) => ({
            ...row,
            model: model ? JSON.parse(model) : null,
            photo: hasPhoto
              ? "/api/shared/albums/" + album + "/photos/" + row.seq
              : null,
          })),
        });
      }
      if (method === "POST" && action === "pages" && item) {
        requireValue(
          body.model === null ||
            (isKeepsake(body.model) && body.model.style === "faceted"),
          "Objeto facetado inválido.",
        );
        requireValue(
          Number.isSafeInteger(body.expected),
          "Versão da página inválida.",
        );
        const version = query(
          "SELECT v.revision,p.model FROM pages p JOIN page_versions v ON v.page=p.seq WHERE p.seq=? AND p.album=? AND p.photo IS NOT NULL",
        ).get(item, album);
        requireValue(version, "A foto não está disponível.", 404);
        const model = body.model === null ? null : JSON.stringify(body.model);
        if (version.model !== model) {
          const saved = query(
            "UPDATE pages SET model=? WHERE seq=? AND album=? AND EXISTS(SELECT 1 FROM page_versions WHERE page=? AND revision=?)",
          ).run(model, item, album, item, body.expected);
          requireValue(
            saved.changes === 1,
            "Outra pessoa alterou o objeto. Confira a versão atual e tente novamente.",
            409,
          );
        }
        return json(
          200,
          query("SELECT revision FROM page_versions WHERE page=?").get(item),
        );
      }
      if (method === "POST" && action === "pages" && !item) {
        const request = textField(body.request, 64);
        const title = textField(body.title, 120, false) || "Uma lembrança";
        const words = textField(body.text, 10000, false);
        const photo = body.photo ?? null;
        requireValue(
          photo === null ||
            (typeof photo === "string" &&
              photo.length < 500000 &&
              /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/.test(photo)),
          "Foto JPEG inválida.",
        );
        requireValue(words || photo, "Adicione um texto ou uma foto.");
        requireValue(
          body.model == null ||
            (photo && isKeepsake(body.model) && body.model.style === "faceted"),
          "Objeto 3D inválido.",
        );
        const model = body.model == null ? null : JSON.stringify(body.model);
        query(
          "INSERT OR IGNORE INTO pages(album,author,request,title,body,photo,model,created) VALUES(?,?,?,?,?,?,?,?)",
        ).run(
          album,
          account.id,
          request,
          title,
          words,
          photo,
          model,
          new Date().toISOString(),
        );
        return json(200, {
          seq: query(
            "SELECT seq FROM pages WHERE album=? AND author=? AND request=?",
          ).get(album, account.id, request).seq,
        });
      }
      throw new HttpError(404, "Recurso não encontrado.");
    } catch (error) {
      return json(error instanceof HttpError ? error.status : 500, {
        error:
          error instanceof HttpError
            ? error.message
            : "Falha ao acessar o álbum.",
      });
    }
  }
  return {
    handle,
    close() {
      clearInterval(clearExpired);
      db.close();
    },
  };
}
