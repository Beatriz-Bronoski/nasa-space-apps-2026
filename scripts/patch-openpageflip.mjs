import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const supportedVersion = "0.4.2";
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/**
 * OpenPageFlip treats a trailing, unpaired story page as a hardcover even with
 * cover:false. Keep its pagination intact and reserve positional hardness for
 * books that actually enable covers. The upstream MIT license is unchanged.
 */
export function patchCoreSource(source) {
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const original = [
    "\telse {",
    "\t\tlandscape.push([i]);",
    "\t\thardByPosition.add(i);",
    "\t}",
  ].join(newline);
  const replacement = original.replace(
    "hardByPosition.add(i);",
    "if (cover) hardByPosition.add(i);",
  );
  const occurrences = (text) => source.split(text).length - 1;
  const originalCount = occurrences(original);
  const patchedCount = occurrences(replacement);

  if (originalCount === 0 && patchedCount === 1)
    return { source, changed: false };
  if (originalCount !== 1 || patchedCount !== 0)
    throw new Error(
      "OpenPageFlip density patch: unexpected pagination source. Review the pinned dependency before continuing.",
    );
  return { source: source.replace(original, replacement), changed: true };
}

export function patchInstalledCore() {
  const require = createRequire(import.meta.url);
  const modulesRoot = realpathSync(path.join(projectRoot, "node_modules"));
  const packageFile = realpathSync(
    require.resolve("@openpageflip/core/package.json"),
  );
  const packageRoot = path.dirname(packageFile);
  const location = path.relative(modulesRoot, packageRoot);
  if (location.startsWith("..") || path.isAbsolute(location))
    throw new Error(
      "OpenPageFlip density patch: dependency must resolve within this project's node_modules.",
    );
  const metadata = JSON.parse(readFileSync(packageFile, "utf8"));
  if (
    metadata.name !== "@openpageflip/core" ||
    metadata.version !== supportedVersion
  )
    throw new Error(
      `OpenPageFlip density patch supports @openpageflip/core ${supportedVersion}; found ${metadata.version}. Review the patch before upgrading.`,
    );
  const entry = realpathSync(require.resolve("@openpageflip/core"));
  if (entry !== realpathSync(path.join(packageRoot, "dist", "index.js")))
    throw new Error(
      "OpenPageFlip density patch: unexpected module entry point.",
    );

  const result = patchCoreSource(readFileSync(entry, "utf8"));
  if (result.changed) writeFileSync(entry, result.source, "utf8");
  console.log(
    `OpenPageFlip ${supportedVersion}: story-page density fix ${result.changed ? "applied" : "already applied"}.`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    patchInstalledCore();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
