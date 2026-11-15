"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { BookOpen, Plus, Box, ImagePlus } from "lucide-react";
import { compressPhoto } from "@/lib/storage";
import type { Keepsake } from "@/lib/keepsake";
import { PhotoObject } from "@/components/PhotoObject";

type Account = { id: string; handle: string };
type Album = { id: string; title: string; owner: string };
type Page = {
  seq: number;
  revision: number;
  title: string;
  body: string;
  photo: string | null;
  model: Keepsake | null;
  created: string;
  author: string;
};
async function api<T>(path: string, data?: unknown): Promise<T> {
  const res = await fetch("/api/shared" + path, {
    method: data === undefined ? "GET" : "POST",
    cache: "no-store",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  if (!res.headers.get("content-type")?.includes("application/json"))
    throw new Error(
      "O servidor de álbuns está indisponível. Abra a versão que usa o servidor da equipe.",
    );
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "A solicitação falhou.");
  return body as T;
}
const message = (error: unknown) =>
  error instanceof Error ? error.message : "Tente novamente.";
function Auth({ onLogin }: { onLogin: (account: Account) => void }) {
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = await api<{ account: Account }>(
        register ? "/register" : "/login",
        { handle: form.get("handle"), password: form.get("password") },
      );
      onLogin(result.account);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="shared-card auth-card">
      <BookOpen size={26} />
      <h2>{register ? "Crie sua conta" : "Entre na sua conta"}</h2>
      <p>Compartilhe páginas com as pessoas que você convidar.</p>
      <form onSubmit={submit}>
        <label>
          Nome de usuário
          <input
            name="handle"
            autoComplete="username"
            required
            minLength={3}
            maxLength={40}
            pattern="[a-zA-Z0-9][a-zA-Z0-9_.\-]{2,39}"
          />
        </label>
        <label>
          Senha
          <input
            name="password"
            type="password"
            required
            minLength={10}
            maxLength={128}
            autoComplete={register ? "new-password" : "current-password"}
          />
        </label>
        {register && <small>Use pelo menos 10 caracteres.</small>}
        {error && <p role="alert">{error}</p>}
        <button className="primary-button" disabled={busy}>
          {register ? "Criar conta" : "Entrar"}
        </button>
      </form>
      <button
        type="button"
        className="plain-object"
        onClick={() => {
          setRegister(!register);
          setError("");
        }}
      >
        {register ? "Já tenho conta" : "Criar uma conta"}
      </button>
    </section>
  );
}
function SharedComposer({
  album,
  onSaved,
}: {
  album: string;
  onSaved: () => void;
}) {
  const [photo, setPhoto] = useState<string>();
  const [model, setModel] = useState<Keepsake>();
  const [title, setTitle] = useState("");
  const [words, setWords] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const request = useRef("");
  const changed = () => {
    request.current = "";
  };
  async function publish(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    request.current ||= Array.from(
      crypto.getRandomValues(new Uint32Array(4)),
      (n) => n.toString(16).padStart(8, "0"),
    ).join("");
    try {
      await api("/albums/" + album + "/pages", {
        request: request.current,
        title,
        text: words,
        photo,
        model,
      });
      setPhoto(undefined);
      setModel(undefined);
      setTitle("");
      setWords("");
      changed();
      onSaved();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="shared-card">
      <h2>Adicionar uma página</h2>
      <form onSubmit={publish}>
        <fieldset disabled={busy} className="shared-fields">
          <label>
            Título
            <input
              value={title}
              maxLength={120}
              onChange={(e) => {
                setTitle(e.target.value);
                changed();
              }}
            />
          </label>
          <label>
            Sua história
            <textarea
              value={words}
              maxLength={10000}
              rows={3}
              onChange={(e) => {
                setWords(e.target.value);
                changed();
              }}
            />
          </label>
          {photo ? (
            <>
              <div>
                <button
                  type="button"
                  className="plain-object"
                  onClick={() => {
                    setModel(undefined);
                    setPhoto(undefined);
                    changed();
                  }}
                >
                  Remover foto
                </button>
              </div>
              <PhotoObject
                key={photo}
                photo={photo}
                model={model}
                onChange={(m) => {
                  setModel(m);
                  changed();
                }}
              />
            </>
          ) : (
            <>
              <button
                type="button"
                className="object-link"
                onClick={() => file.current?.click()}
              >
                <ImagePlus size={17} /> Adicionar foto
              </button>
              <input
                className="sr-only"
                aria-label="Escolher foto"
                type="file"
                ref={file}
                accept="image/jpeg,image/png,image/webp"
                onChange={async (e) => {
                  const picked = e.target.files?.[0];
                  e.currentTarget.value = "";
                  if (!picked) return;
                  setBusy(true);
                  setError("");
                  try {
                    setPhoto(await compressPhoto(picked));
                    changed();
                  } catch (e) {
                    setError(message(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </>
          )}
          <p>A publicação compartilha esta página com os membros do álbum.</p>
          <button className="primary-button" disabled={!words.trim() && !photo}>
            {busy ? "Aguarde…" : "Publicar página"}
          </button>
        </fieldset>
        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  );
}
function AlbumView({
  album,
  account,
  initialInvite,
  onBack,
}: {
  album: Album;
  account: Account;
  initialInvite: string;
  onBack: () => void;
}) {
  const [pages, setPages] = useState<Page[]>([]);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [invite, setInvite] = useState(initialInvite);
  const [compose, setCompose] = useState(false);
  const [ready, setReady] = useState(false);
  const [stamp, setStamp] = useState(0);
  const cursor = useRef(0);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let fetching = false;
    const load = async () => {
      if (!active || fetching) return;
      fetching = true;
      clearTimeout(timer);
      try {
        let batch: Page[];
        do {
          const response = await api<{ pages: Page[] }>(
            "/albums/" + album.id + "/pages?after=" + cursor.current,
          );
          if (!active) return;
          batch = response.pages;
          if (batch.length) {
            cursor.current = batch[batch.length - 1].revision;
            const append = batch;
            setPages((prev) => {
              const byId = new Map(prev.map((p) => [p.seq, p]));
              for (const p of append)
                if ((byId.get(p.seq)?.revision ?? 0) < p.revision)
                  byId.set(p.seq, p);
              return [...byId.values()].sort((a, b) => a.seq - b.seq);
            });
          }
        } while (batch.length === 32);
        setReady(true);
        setError("");
      } catch (e) {
        if (active) setError(message(e));
      } finally {
        fetching = false;
        if (active) timer = setTimeout(load, document.hidden ? 15000 : 2500);
      }
    };
    void load();
    window.addEventListener("focus", load);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener("focus", load);
    };
  }, [album.id, stamp]);
  return (
    <>
      <button className="plain-object" onClick={onBack}>
        ← Meus álbuns
      </button>
      <div className="shared-title">
        <div>
          <h1>{album.title}</h1>
          <p>Páginas em ordem de publicação · atualizadas automaticamente</p>
        </div>
        <button className="primary-button" onClick={() => setCompose(!compose)}>
          {compose ? (
            "Fechar editor"
          ) : (
            <>
              <Plus size={16} /> Adicionar uma página
            </>
          )}
        </button>
      </div>
      {album.owner === account.id && (
        <details className="shared-invite" open={invite ? true : undefined}>
          <summary>Convidar uma pessoa</summary>
          {invite && (
            <label>
              Código de uso único
              <input
                readOnly
                value={invite}
                onFocus={(e) => e.target.select()}
              />
              <small>
                Compartilhe este código com a pessoa convidada. Ele expira em 7
                dias.
              </small>
            </label>
          )}
          <button
            className="object-link"
            onClick={async () => {
              try {
                const r = await api<{ invite: string }>(
                  "/albums/" + album.id + "/invite",
                  {},
                );
                setInvite(r.invite);
                setActionError("");
              } catch (e) {
                setActionError(message(e));
              }
            }}
          >
            Gerar novo convite
          </button>
        </details>
      )}
      {actionError && <p role="alert">{actionError}</p>}
      {error && <p role="alert">{error}</p>}
      {compose && (
        <SharedComposer
          album={album.id}
          onSaved={() => {
            setCompose(false);
            setStamp((n) => n + 1);
          }}
        />
      )}
      {ready && !pages.length && (
        <p className="shared-empty">
          Este álbum ainda está em branco. Adicione a primeira página.
        </p>
      )}
      <div className="shared-pages">
        {pages.map((p) => (
          <article className="shared-card shared-page" key={p.seq}>
            <p className="byline">
              {p.author} ·{" "}
              <time dateTime={p.created}>
                {new Date(p.created).toLocaleDateString("pt-BR", {
                  dateStyle: "long",
                })}
              </time>
            </p>
            <h2>{p.title}</h2>
            {p.photo && (
              <PhotoObject
                photo={p.photo}
                alt={"Foto de " + p.author + " em " + p.title}
                model={p.model ?? undefined}
                onChange={async (model) => {
                  const r = await api<{ revision: number }>(
                    "/albums/" + album.id + "/pages/" + p.seq,
                    { expected: p.revision, model: model ?? null },
                  );
                  setPages((prev) =>
                    prev.map((row) =>
                      row.seq === p.seq && row.revision <= r.revision
                        ? { ...row, model: model ?? null, revision: r.revision }
                        : row,
                    ),
                  );
                }}
              />
            )}
            {p.body && <p className="shared-words">{p.body}</p>}
          </article>
        ))}
      </div>
    </>
  );
}
export default function Shared() {
  const [account, setAccount] = useState<Account | null>();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [active, setActive] = useState<Album>();
  const [invite, setInvite] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    let live = true;
    api<{ account: Account | null }>("/session")
      .then((r) => {
        if (live) setAccount(r.account);
      })
      .catch((e) => {
        if (live) setError(message(e));
      });
    return () => {
      live = false;
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let live = true;
    if (account)
      api<{ albums: Album[] }>("/albums")
        .then((r) => {
          if (live) setAlbums(r.albums);
        })
        .catch((e) => {
          if (live) setError(message(e));
        });
    return () => {
      live = false;
    };
  }, [account]);
  const select = (album: Album, code = "") => {
    setInvite(code);
    setActive(album);
    setError("");
  };
  async function createOrJoin(e: FormEvent<HTMLFormElement>, join: boolean) {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("value");
    setBusy(true);
    setError("");
    try {
      if (join) {
        const r = await api<{ id: string }>("/join", { code: value });
        const list = await api<{ albums: Album[] }>("/albums");
        setAlbums(list.albums);
        select(list.albums.find((a) => a.id === r.id)!);
      } else {
        const r = await api<{ album: Album; invite: string }>("/albums", {
          title: value,
        });
        setAlbums((a) => [...a, r.album]);
        select(r.album, r.invite);
      }
    } catch (e) {
      setError(message(e));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <main className="shared-shell" lang="pt-BR">
      <header className="shared-nav">
        <Link href="/">← Demo Still Here</Link>
        {account && (
          <div>
            {account.handle}{" "}
            <button
              className="plain-object"
              onClick={async () => {
                try {
                  await api("/logout", {});
                  setAccount(null);
                  setAlbums([]);
                  setActive(undefined);
                  setInvite("");
                  setError("");
                } catch (e) {
                  setError(message(e));
                }
              }}
            >
              Sair
            </button>
          </div>
        )}
      </header>
      {error && <p role="alert">{error}</p>}
      {account === undefined ? (
        <p role="status">
          {error ? "Conexão indisponível." : "Abrindo os álbuns…"}
        </p>
      ) : !account ? (
        <>
          <h1>Álbuns compartilhados</h1>
          <Auth onLogin={setAccount} />
        </>
      ) : active ? (
        <AlbumView
          key={active.id}
          album={active}
          account={account}
          initialInvite={invite}
          onBack={() => setActive(undefined)}
        />
      ) : (
        <>
          <h1>Meus álbuns</h1>
          <div className="real-albums">
            {albums.map((a) => (
              <button
                key={a.id}
                className="shared-card album-choice"
                onClick={() => select(a)}
              >
                <BookOpen />
                <strong>{a.title}</strong>
              </button>
            ))}
          </div>
          <div className="shared-grid">
            <section className="shared-card">
              <BookOpen />
              <h2>Criar um álbum</h2>
              <form onSubmit={(e) => createOrJoin(e, false)}>
                <label>
                  Nome do álbum
                  <input name="value" maxLength={90} required />
                </label>
                <button className="primary-button" disabled={busy}>
                  Criar álbum
                </button>
              </form>
            </section>
            <section className="shared-card">
              <Box />
              <h2>Entrar por convite</h2>
              <form onSubmit={(e) => createOrJoin(e, true)}>
                <label>
                  Código de convite
                  <input name="value" maxLength={100} required />
                </label>
                <button className="object-link" disabled={busy}>
                  Entrar no álbum
                </button>
              </form>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
