"use client";
import { useEffect, useRef, useState } from "react";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";
import { buildKeepsake } from "@/lib/keepsake-meshes";
import { LABELS, type Keepsake } from "@/lib/keepsake";

type Motion = "left" | "right" | "in" | "out" | "reset";
export default function KeepsakeViewer({
  model,
  onDraw,
}: {
  model: Keepsake;
  onDraw: () => void;
}) {
  const ready = useRef(onDraw);
  ready.current = onDraw;
  const host = useRef<HTMLDivElement>(null);
  const control = useRef<(action: Motion) => void>(() => {});
  const [failed, setFailed] = useState(false);
  const { kind, color, aspect, variant, style } = model;
  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    setFailed(false);
    let renderer: T.WebGLRenderer | SVGRenderer;
    try {
      renderer = new T.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } catch {
      renderer = new SVGRenderer();
      renderer.setQuality("low");
    }
    const element = renderer.domElement;
    element.setAttribute("aria-hidden", "true");
    parent.appendChild(element);
    const scene = new T.Scene();
    const mesh = buildKeepsake({
      version: 1,
      kind,
      color,
      aspect,
      variant,
      style,
    });
    scene.add(mesh);
    scene.add(new T.HemisphereLight(0xfff7e8, 0xabb1a7, 1.45));
    const key = new T.DirectionalLight(0xfff4db, 2.4);
    key.position.set(3, 5, 4);
    scene.add(key);
    const fill = new T.DirectionalLight(0xddeeff, 1);
    fill.position.set(-3, 2, -2);
    scene.add(fill);
    const bounds = new T.Box3().setFromObject(mesh);
    const size = bounds.getSize(new T.Vector3());
    const floor = new T.Group();
    // Soft concentric contact shadows also render in the SVG fallback.
    for (let step = 0; step < 7; step++) {
      const shadow = new T.Mesh(
        new T.CircleGeometry(1, 36),
        new T.MeshBasicMaterial({
          color: 0x504431,
          transparent: true,
          opacity: 0.042,
          depthWrite: false,
        }),
      );
      shadow.rotation.x = -Math.PI / 2;
      const spread = 0.78 - step * 0.065;
      shadow.scale.set(size.x * spread, size.z * spread, 1);
      shadow.position.set(0.07, bounds.min.y - 0.018 + step * 0.0004, -0.055);
      floor.add(shadow);
    }
    scene.add(floor);
    const camera = new T.PerspectiveCamera(35, 1, 0.1, 60);
    const initial = new T.Vector3(2.15, 5.6, 2.75).setLength(4.5);
    camera.position.copy(initial);
    const orbit = new OrbitControls(camera, element);
    orbit.enablePan = false;
    orbit.maxPolarAngle = Math.PI * 0.48;
    orbit.minDistance = 2.2;
    orbit.maxDistance = 8;
    orbit.update();
    orbit.saveState();
    const draw = () => renderer.render(scene, camera);
    let firstFrame = true;
    const resize = () => {
      const w = parent.clientWidth,
        h = parent.clientHeight;
      if (w > 0 && h > 0) {
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        draw();
        if (firstFrame) {
          firstFrame = false;
          ready.current();
        }
      }
    };
    const action = (move: Motion) => {
      if (move === "reset") orbit.reset();
      else {
        const polar = new T.Spherical().setFromVector3(camera.position);
        if (move === "left" || move === "right")
          polar.theta += move === "right" ? Math.PI / 8 : -Math.PI / 8;
        else
          polar.radius = T.MathUtils.clamp(
            polar.radius * (move === "in" ? 0.82 : 1.22),
            2.2,
            8,
          );
        camera.position.setFromSpherical(polar);
        orbit.update();
      }
      draw();
    };
    control.current = action;
    orbit.addEventListener("change", draw);
    const loss = () => setFailed(true);
    element.addEventListener("webglcontextlost", loss);
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    resize();
    return () => {
      control.current = () => {};
      observer.disconnect();
      orbit.removeEventListener("change", draw);
      orbit.dispose();
      element.removeEventListener("webglcontextlost", loss);
      const materials = new Set<T.Material>();
      scene.traverse((part) => {
        if (part instanceof T.Mesh) {
          part.geometry.dispose();
          for (const material of [part.material].flat())
            materials.add(material);
        }
      });
      for (const material of materials) material.dispose();
      if (renderer instanceof T.WebGLRenderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
      element.remove();
    };
  }, [kind, color, aspect, variant, style]);
  return (
    <div className="object-viewer">
      <div
        ref={host}
        className="object-stage"
        role="img"
        aria-label={"Miniatura facetada de " + LABELS[kind] + " sobre a página"}
      />
      {failed && (
        <p role="alert">O visor perdeu a conexão gráfica. Reabra a prévia.</p>
      )}
      <div className="object-tools" aria-label="Controles da miniatura">
        {(
          [
            ["left", "Girar à esquerda", "↶"],
            ["right", "Girar à direita", "↷"],
            ["in", "Aproximar", "+"],
            ["out", "Afastar", "−"],
            ["reset", "Vista de cima", "⟲"],
          ] as const
        ).map(([key, label, icon]) => (
          <button
            type="button"
            key={key}
            title={label}
            aria-label={label}
            onClick={() => control.current(key)}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
