"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Box, RefreshCw } from "lucide-react";
import { LABELS, type Keepsake } from "@/lib/keepsake";
import { recognizePhoto } from "@/lib/recognize";

const Viewer = dynamic(() => import("./KeepsakeViewer"), { ssr: false });
type Props = {
  photo: string;
  alt?: string;
  model?: Keepsake;
  onChange: (next?: Keepsake) => void | Promise<void>;
};

export function PhotoObject({
  photo,
  alt = "Foto da página",
  model,
  onChange,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [transition, setTransition] = useState<"idle" | "waiting" | "lifting">(
    "idle",
  );
  const [shown, setShown] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const ask = useRef<HTMLDialogElement>(null);
  const serial = useRef(0);
  useEffect(
    () => () => {
      serial.current++;
    },
    [],
  );
  useEffect(() => {
    if (!root.current) return;
    if (!window.IntersectionObserver) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setShown(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (transition !== "lifting") return;
    const timer = window.setTimeout(() => setTransition("idle"), 1150);
    return () => clearTimeout(timer);
  }, [transition]);

  async function apply(next: Keepsake | undefined) {
    setError("");
    setBusy(true);
    try {
      await onChange(next);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível salvar a alteração.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function transform() {
    ask.current?.close();
    setError("");
    setBusy(true);
    const id = ++serial.current;
    try {
      const result = await recognizePhoto(photo);
      if (id !== serial.current) return;
      setTransition(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "idle"
          : "waiting",
      );
      await onChange({
        version: 1,
        kind: result.kind,
        color: result.color,
        aspect: result.aspect,
        style: "faceted",
        variant: 0,
      });
    } catch (e) {
      if (id === serial.current) {
        setTransition("idle");
        setError(
          e instanceof Error
            ? e.message
            : "Não foi possível reconhecer a foto.",
        );
      }
    } finally {
      if (id === serial.current) setBusy(false);
    }
  }
  const onDraw = () => {
    setTransition((now) => (now === "waiting" ? "lifting" : now));
  };
  return (
    <div
      ref={root}
      lang="pt-BR"
      className={"page-object " + (model ? "object-present" : "photo-present")}
      data-opf-no-flip=""
      onKeyDown={(e) => {
        if (e.key.startsWith("Arrow")) e.stopPropagation();
      }}
    >
      {model ? (
        <>
          <div
            className={"page-object-surface motion-" + transition}
            aria-busy={busy}
          >
            {shown && <Viewer model={model} onDraw={onDraw} />}
            {transition !== "idle" && (
              <div className="photo-facets" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <img
                    key={i}
                    src={photo}
                    alt=""
                    draggable={false}
                    className={"photo-shard shard-" + i}
                  />
                ))}
              </div>
            )}
          </div>
          <p className="object-caption">
            <Box size={13} aria-hidden="true" />
            {LABELS[model.kind]} · 3D facetado
          </p>
          <details className="object-review">
            <summary>Avaliar ou ajustar</summary>
            <label>
              Avalie o resultado
              <select
                disabled={busy}
                value={model.rating ?? ""}
                onChange={(e) =>
                  void apply({
                    ...model,
                    style: "faceted",
                    rating: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              >
                <option value="">Sem avaliação</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option value={n} key={n}>
                    {n} de 5
                  </option>
                ))}
              </select>
            </label>
            <div className="object-entry">
              <button
                type="button"
                disabled={busy}
                className="object-link"
                onClick={() =>
                  void apply({
                    ...model,
                    style: "faceted",
                    variant: (model.variant + 1) % 256,
                    rating: undefined,
                  })
                }
              >
                <RefreshCw size={14} /> Gerar outra versão
              </button>
              <button
                type="button"
                disabled={busy}
                className="plain-object"
                onClick={() => void apply(undefined)}
              >
                Voltar à foto
              </button>
            </div>
          </details>
        </>
      ) : (
        <>
          <button
            type="button"
            className="transform-photo"
            disabled={busy}
            aria-label={"Transformar em 3D: " + alt}
            onClick={() => ask.current?.showModal()}
          >
            <img src={photo} alt={alt} draggable={false} />
            <span>
              <Box size={14} aria-hidden="true" /> 3D
            </span>
          </button>
          {busy && (
            <p role="status" className="object-caption">
              Reconhecendo no seu dispositivo…
            </p>
          )}
          <dialog
            ref={ask}
            className="object-dialog"
            aria-label="Transformar esta foto em 3D?"
          >
            <h2>Transformar esta foto em 3D?</h2>
            <p>
              O objeto reconhecido vira uma miniatura facetada sobre a página.
            </p>
            <div className="object-entry">
              <button
                autoFocus
                type="button"
                className="object-link"
                onClick={() => ask.current?.close()}
              >
                Manter foto
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => void transform()}
              >
                Sim, transformar
              </button>
            </div>
          </dialog>
        </>
      )}
      {error && (
        <p className="object-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
