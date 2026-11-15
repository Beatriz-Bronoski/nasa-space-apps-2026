import { mkdir, copyFile } from "node:fs/promises";
const dest = "public/ai/runtime";
await mkdir(dest, { recursive: true });
await Promise.all([
  copyFile("node_modules/@tensorflow/tfjs/dist/tf.min.js", dest + "/tf.min.js"),
  copyFile(
    "node_modules/@tensorflow-models/coco-ssd/dist/coco-ssd.min.js",
    dest + "/coco-ssd.min.js",
  ),
]);
