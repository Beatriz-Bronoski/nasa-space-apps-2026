import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { sharedApi } from "./shared.mjs";

test("independent accounts publish and sync a model, with membership and retry handling", async () => {
  const api = sharedApi(":memory:");
  const server = createServer((req, res) =>
    api.handle(req, res, new URL(req.url, "http://localhost")),
  );
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const root = "http://127.0.0.1:" + server.address().port + "/api/shared";
  const call = async (path, cookie = "", data) =>
    fetch(root + path, {
      method: data === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(data),
    });
  const account = async (handle) => {
    const r = await call("/register", "", {
      handle,
      password: "fictional-for-tests",
    });
    assert.equal(r.status, 200);
    return r.headers.get("set-cookie").split(";")[0];
  };
  try {
    const alice = await account("alpha"),
      bob = await account("bravo"),
      other = await account("charlie");
    const { album, invite } = await (
      await call("/albums", alice, { title: "Weekend" })
    ).json();
    const path = "/albums/" + album.id;
    assert.equal((await call(path + "/pages", bob)).status, 404);
    assert.equal((await call("/join", bob, { code: invite })).status, 200);
    assert.equal((await call("/join", other, { code: invite })).status, 404);
    const model = {
      version: 1,
      kind: "cat",
      color: "#a06543",
      aspect: 1.2,
      style: "faceted",
      variant: 7,
      rating: 4,
    };
    const entry = {
      request: "id-1",
      title: "Cat",
      text: "Today",
      photo: "data:image/jpeg;base64,/9j/2Q==",
      model,
    };
    assert.equal((await call(path + "/pages", other, entry)).status, 404);
    const first = await (await call(path + "/pages", alice, entry)).json();
    assert.deepEqual(
      await (await call(path + "/pages", alice, entry)).json(),
      first,
    );
    const feed = await (await call(path + "/pages", bob)).json();
    assert.equal(feed.pages.length, 1);
    assert.deepEqual(feed.pages[0].model, model);
    assert.equal(feed.pages[0].author, "alpha");
    assert.deepEqual(
      await (await call(path + "/pages?after=" + first.seq, bob)).json(),
      { pages: [] },
    );
    assert.equal(
      (await call(path + "/photos/" + first.seq, bob)).headers.get(
        "content-type",
      ),
      "image/jpeg",
    );
    assert.equal(
      (await call(path + "/photos/" + first.seq, other)).status,
      404,
    );
    assert.equal(
      (
        await call(path + "/pages", bob, {
          ...entry,
          request: "bad",
          model: { ...model, kind: "alien" },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await call(path + "/pages", bob, {
          ...entry,
          request: "without-photo",
          photo: null,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await call(path + "/pages", bob, {
          request: "plain",
          text: "just words",
          title: "",
          photo: null,
        })
      ).status,
      200,
    );
    const initialRevision = feed.pages[0].revision;
    const target = path + "/pages/" + first.seq;
    const edited = { ...model, variant: 2 };
    const edit = await call(target, bob, {
      expected: initialRevision,
      model: edited,
    });
    assert.equal(edit.status, 200);
    const { revision } = await edit.json();
    assert.ok(revision > initialRevision);
    const changes = await (
      await call(path + "/pages?after=" + initialRevision, alice)
    ).json();
    assert.deepEqual(
      changes.pages.find((p) => p.seq === first.seq).model,
      edited,
    );
    assert.equal(
      (await call(target, alice, { expected: initialRevision, model: null }))
        .status,
      409,
    );
    assert.equal(
      (await call(target, other, { expected: revision, model: null })).status,
      404,
    );
    assert.equal(
      (
        await call(target, alice, {
          expected: revision,
          model: { ...edited, style: "rounded" },
        })
      ).status,
      400,
    );
    assert.equal(
      (await call(target, alice, { expected: revision, model: null })).status,
      200,
    );
    assert.equal((await call("/logout", alice, {})).status, 200);
    assert.equal((await call(path + "/pages", alice)).status, 401);
    const login = await call("/login", "", {
      handle: "alpha",
      password: "fictional-for-tests",
    });
    assert.equal(login.status, 200);
    assert.equal(
      (
        await call(
          path + "/pages",
          login.headers.get("set-cookie").split(";")[0],
        )
      ).status,
      200,
    );
  } finally {
    await new Promise((r) => server.close(r));
    api.close();
  }
});
