import assert from "node:assert/strict";
import test from "node:test";
import { addContribution, createInitialData } from "./model";
import { parseStoredData } from "./storage";
import { isKeepsake, KINDS, type Keepsake } from "./keepsake";
import { buildKeepsake } from "./keepsake-meshes";
import { Box3 } from "three";

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
