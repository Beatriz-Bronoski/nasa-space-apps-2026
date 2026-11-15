import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { patchCoreSource } from "../../scripts/patch-openpageflip.mjs";

const require = createRequire(import.meta.url);
const installedSource = readFileSync(
  require.resolve("@openpageflip/core"),
  "utf8",
);
const paginationStart = installedSource.indexOf("function buildSpreads(");
const paginationEnd = installedSource.indexOf(
  "function spreadIndexOfPage(",
  paginationStart,
);
assert.ok(paginationStart >= 0 && paginationEnd > paginationStart);

// Exercise the dependency's real pagination routine, without a simulated DOM or
// a second implementation of the density rules that caused the rigid turn.
const buildSpreads = runInNewContext(
  `${installedSource.slice(paginationStart, paginationEnd)}; buildSpreads`,
  { Orientation: { portrait: "portrait" } },
) as (
  count: number,
  orientation: string,
  cover: boolean,
) => { spreads: number[][]; hardByPosition: Set<number> };

test("story-only books keep odd and even final pages soft in spread and portrait layouts", () => {
  for (const count of [1, 2, 3, 4, 5, 6, 7]) {
    for (const orientation of ["landscape", "portrait"]) {
      const result = buildSpreads(count, orientation, false);
      assert.equal(
        result.hardByPosition.size,
        0,
        `${count} pages in ${orientation}`,
      );
      assert.deepEqual(
        Array.from(result.spreads.flat()),
        Array.from({ length: count }, (_, index) => index),
      );
      assert.equal(
        result.spreads.length,
        orientation === "portrait" ? count : Math.ceil(count / 2),
      );
    }
  }
});

test("books with covers retain hard first and trailing singleton covers", () => {
  for (const orientation of ["landscape", "portrait"]) {
    assert.deepEqual(
      Array.from(buildSpreads(4, orientation, true).hardByPosition),
      [0, 3],
    );
    assert.deepEqual(
      Array.from(buildSpreads(3, orientation, true).hardByPosition),
      [0],
    );
  }
});

const pristineBranch =
  "\telse {\n\t\tlandscape.push([i]);\n\t\thardByPosition.add(i);\n\t}";

test("the bounded dependency patch is repeatable and supports LF or CRLF installs", () => {
  for (const source of [
    pristineBranch,
    pristineBranch.replaceAll("\n", "\r\n"),
  ]) {
    const first = patchCoreSource(source);
    assert.equal(first.changed, true);
    assert.ok(first.source.includes("if (cover) hardByPosition.add(i);"));
    assert.deepEqual(patchCoreSource(first.source), {
      source: first.source,
      changed: false,
    });
  }
});

test("the dependency patch rejects missing or ambiguous upstream branches", () => {
  assert.throws(
    () => patchCoreSource("changed upstream implementation"),
    /unexpected pagination source/,
  );
  assert.throws(
    () => patchCoreSource(`${pristineBranch}\n${pristineBranch}`),
    /unexpected pagination source/,
  );
  const patched = patchCoreSource(pristineBranch).source;
  assert.throws(
    () => patchCoreSource(`${pristineBranch}\n${patched}`),
    /unexpected pagination source/,
  );
});
