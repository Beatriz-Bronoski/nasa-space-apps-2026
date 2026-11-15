import assert from "node:assert/strict";
import test from "node:test";
import { addContribution, createInitialData } from "./model";
import { parseStoredData } from "./storage";
import { isKeepsake, KINDS, type Keepsake } from "./keepsake";
import { buildKeepsake } from "./keepsake-meshes";
import { Box3, Group, Mesh, PerspectiveCamera, TorusGeometry } from "three";
import { groundKeepsake, hitSilhouette } from "./keepsake-projection";

const model: Keepsake = {
  version: 1,
  kind: "dog",
  style: "natural",
  color: "#cfb697",
  aspect: 1.25,
  variant: 0,
  rating: 4,
};
test("a scrapbook photo retains its approved 3D object in the draft and on publication", () => {
  const data = createInitialData();
  const draft = {
    title: "Dog in the garden",
    text: "",
    photo: "/images/sam.jpg",
    object3d: model,
  };
  data.drafts["alex:sam"] = draft;
  const loaded = parseStoredData(JSON.stringify(data));
  assert.deepEqual(loaded.drafts["alex:sam"].object3d, model);
  const next = addContribution(loaded, {
    ...draft,
    albumId: "sam",
    authorId: "alex",
  });
  assert.deepEqual(
    parseStoredData(JSON.stringify(next)).pages.find(
      (p) => p.title === draft.title,
    )?.object3d,
    model,
  );
  assert.throws(() =>
    parseStoredData(
      JSON.stringify({
        ...data,
        drafts: { "alex:sam": { ...draft, photo: undefined } },
      }),
    ),
  );
});
test("the eight supported classes create bounded three-dimensional geometry", () => {
  for (const kind of KINDS) {
    const mesh = buildKeepsake({ ...model, kind });
    const bounds = new Box3().setFromObject(mesh);
    assert.ok(mesh.children.length >= 2);
    for (const axis of ["x", "y", "z"] as const) {
      assert.ok(bounds.max[axis] > bounds.min[axis]);
      assert.ok(bounds.max[axis] <= 1.18 && bounds.min[axis] >= -1.18);
    }
  }
  assert.equal(isKeepsake({ ...model, kind: "unknown" }), false);
  assert.equal(isKeepsake({ ...model, color: "invalid" }), false);
  assert.equal(isKeepsake({ ...model, aspect: Infinity }), false);
});

test("tilting a miniature keeps its lowest vertex on the paper at the same anchor", () => {
  const bounds = new Box3();
  for (const kind of KINDS) {
    const pivot = new Group();
    pivot.add(buildKeepsake({ ...model, kind }));
    pivot.position.set(1.2, 0, -0.7);
    const paperHeight = bounds.setFromObject(pivot, true).min.y;
    for (const tilt of [0.3, Math.PI / 2, Math.PI, -0.8, 0]) {
      pivot.rotation.set(tilt, tilt / 2, 0);
      groundKeepsake(pivot, paperHeight, bounds);
      assert.ok(
        Math.abs(bounds.setFromObject(pivot, true).min.y - paperHeight) < 1e-6,
      );
      assert.equal(pivot.position.x, 1.2);
      assert.equal(pivot.position.z, -0.7);
    }
  }
});

test("the pointer silhouette includes the rim and leaves its hole and the surrounding paper untouched", () => {
  const ring = new Mesh(new TorusGeometry(1, 0.25, 12, 48));
  const camera = new PerspectiveCamera(45, 1, 0.1, 10);
  camera.position.z = 4;
  const path = hitSilhouette(ring, camera);
  const triangles = Array.from(
    path.matchAll(/M(-?\d+) (-?\d+)L(-?\d+) (-?\d+) (-?\d+) (-?\d+)Z/g),
    (match) => match.slice(1).map(Number),
  );
  function contains(x: number, y: number) {
    return triangles.some(
      ([ax, ay, bx, by, cx, cy]) =>
        (bx - ax) * (y - ay) <= (by - ay) * (x - ax) &&
        (cx - bx) * (y - by) <= (cy - by) * (x - bx) &&
        (ax - cx) * (y - cy) <= (ay - cy) * (x - cx),
    );
  }
  assert.equal(contains(800, 500), true);
  assert.equal(contains(500, 500), false);
  assert.equal(contains(50, 50), false);
});
