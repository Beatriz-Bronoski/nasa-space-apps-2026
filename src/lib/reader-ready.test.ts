import test from "node:test";
import assert from "node:assert/strict";
import { afterReaderImagesPaint } from "./reader-ready";

function deferred() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

class FakeImage {
  readonly listeners = new Map<string, Set<() => void>>();
  readonly decoding = deferred();
  decodeCalls = 0;

  constructor(public complete = false) {}

  decode() {
    this.decodeCalls += 1;
    return this.decoding.promise;
  }
  addEventListener(name: string, callback: () => void) {
    const listeners = this.listeners.get(name) ?? new Set();
    listeners.add(callback);
    this.listeners.set(name, listeners);
  }
  removeEventListener(name: string, callback: () => void) {
    this.listeners.get(name)?.delete(callback);
  }
  emit(name: string) {
    for (const callback of [...(this.listeners.get(name) ?? [])]) callback();
  }
  get listenerCount() {
    return [...this.listeners.values()].reduce(
      (count, listeners) => count + listeners.size,
      0,
    );
  }
  get element() {
    return this as unknown as HTMLImageElement;
  }
}

class FakeWindow {
  now = 0;
  nextId = 1;
  readonly frames = new Map<number, FrameRequestCallback>();
  readonly timers = new Map<number, { at: number; callback: () => void }>();

  setTimeout = (callback: () => void, delay: number) => {
    const id = this.nextId++;
    this.timers.set(id, { at: this.now + delay, callback });
    return id;
  };
  clearTimeout = (id: number) => {
    this.timers.delete(id);
  };
  requestAnimationFrame = (callback: FrameRequestCallback) => {
    const id = this.nextId++;
    this.frames.set(id, callback);
    return id;
  };
  cancelAnimationFrame = (id: number) => {
    this.frames.delete(id);
  };

  advance(ms: number) {
    this.now += ms;
    for (const [id, timer] of [...this.timers]) {
      if (timer.at <= this.now && this.timers.delete(id)) timer.callback();
    }
  }
  paintFrame() {
    const callbacks = [...this.frames.values()];
    this.frames.clear();
    for (const callback of callbacks) callback(this.now);
  }
}

async function withWindow(run: (clock: FakeWindow) => void | Promise<void>) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  const clock = new FakeWindow();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: clock,
  });
  try {
    await run(clock);
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

test(
  "reader readiness waits for loaded photos to decode and two paint frames",
  { concurrency: false },
  async () => {
    await withWindow(async (clock) => {
      const cached = new FakeImage(true);
      const loading = new FakeImage();
      let calls = 0;
      afterReaderImagesPaint([cached.element, loading.element], () => {
        calls += 1;
      });
      assert.equal(cached.decodeCalls, 1);
      assert.equal(loading.decodeCalls, 0);
      assert.equal(clock.frames.size, 0);

      cached.decoding.resolve();
      await Promise.resolve();
      assert.equal(
        clock.frames.size,
        0,
        "one pending photo must still hold the reveal",
      );
      loading.emit("load");
      assert.equal(loading.decodeCalls, 1);
      assert.equal(
        clock.frames.size,
        0,
        "load alone does not guarantee decoded pixels",
      );
      loading.decoding.reject(
        new Error("A failed decode must not trap the album"),
      );
      await Promise.resolve();

      assert.equal(clock.timers.size, 0);
      assert.equal(loading.listenerCount, 0);
      assert.equal(clock.frames.size, 1);
      clock.paintFrame();
      assert.equal(calls, 0);
      clock.paintFrame();
      assert.equal(calls, 1);
      clock.paintFrame();
      assert.equal(calls, 1);
    });
  },
);

test(
  "an unavailable photo stops delaying reader readiness after the image deadline",
  { concurrency: false },
  async () => {
    await withWindow((clock) => {
      const unavailable = new FakeImage();
      let ready = false;
      afterReaderImagesPaint([unavailable.element], () => {
        ready = true;
      });
      assert.equal(unavailable.listenerCount, 2);
      clock.advance(1799);
      assert.equal(clock.frames.size, 0);
      clock.advance(1);
      assert.equal(unavailable.listenerCount, 0);
      assert.equal(clock.frames.size, 1);
      clock.paintFrame();
      assert.equal(ready, false);
      clock.paintFrame();
      assert.equal(ready, true);
      assert.equal(clock.timers.size, 0);
    });
  },
);

test(
  "cancelling reader readiness removes listeners and ignores late photo promises",
  { concurrency: false },
  async () => {
    await withWindow(async (clock) => {
      const decoding = new FakeImage(true);
      const loading = new FakeImage();
      let ready = false;
      const cancel = afterReaderImagesPaint(
        [decoding.element, loading.element],
        () => {
          ready = true;
        },
      );
      cancel();
      assert.equal(loading.listenerCount, 0);
      assert.equal(clock.timers.size, 0);
      assert.equal(clock.frames.size, 0);
      decoding.decoding.resolve();
      loading.emit("load");
      loading.decoding.resolve();
      await Promise.resolve();
      clock.advance(5000);
      clock.paintFrame();
      clock.paintFrame();
      assert.equal(ready, false);
      assert.equal(loading.decodeCalls, 0);
      assert.equal(clock.frames.size, 0);
    });
  },
);

test(
  "an empty spread waits two frames and cancellation prevents its queued reveal",
  { concurrency: false },
  async () => {
    await withWindow((clock) => {
      let calls = 0;
      const cancel = afterReaderImagesPaint([], () => {
        calls += 1;
      });
      assert.equal(clock.timers.size, 0);
      clock.paintFrame();
      assert.equal(calls, 0);
      cancel();
      assert.equal(clock.frames.size, 0);
      clock.paintFrame();
      assert.equal(calls, 0);

      afterReaderImagesPaint([], () => {
        calls += 1;
      });
      clock.paintFrame();
      assert.equal(calls, 0);
      clock.paintFrame();
      assert.equal(calls, 1);
    });
  },
);

test(
  "reader readiness waits for handwriting fonts as well as decoded photos",
  { concurrency: false },
  async () => {
    await withWindow(async (clock) => {
      const image = new FakeImage(true);
      const fonts = deferred();
      let calls = 0;
      afterReaderImagesPaint(
        [image.element],
        () => {
          calls += 1;
        },
        fonts.promise,
      );
      image.decoding.resolve();
      await Promise.resolve();
      assert.equal(
        clock.frames.size,
        0,
        "decoded photos do not release still-loading fonts",
      );
      fonts.resolve();
      await Promise.resolve();
      assert.equal(clock.timers.size, 0);
      assert.equal(clock.frames.size, 1);
      clock.paintFrame();
      assert.equal(calls, 0);
      clock.paintFrame();
      assert.equal(calls, 1);
    });
  },
);

test(
  "fonts without photos use the shared deadline and late font promises cannot reveal again",
  { concurrency: false },
  async () => {
    await withWindow(async (clock) => {
      const fonts = deferred();
      let calls = 0;
      afterReaderImagesPaint(
        [],
        () => {
          calls += 1;
        },
        fonts.promise,
      );
      clock.advance(1799);
      assert.equal(clock.frames.size, 0);
      clock.advance(1);
      clock.paintFrame();
      assert.equal(calls, 0);
      clock.paintFrame();
      assert.equal(calls, 1);
      fonts.resolve();
      await Promise.resolve();
      assert.equal(clock.frames.size, 0);
      assert.equal(calls, 1);

      const cancelledFonts = deferred();
      const cancel = afterReaderImagesPaint(
        [],
        () => {
          calls += 1;
        },
        cancelledFonts.promise,
      );
      cancel();
      cancelledFonts.reject(new Error("An interrupted font load is harmless"));
      await Promise.resolve();
      assert.equal(clock.timers.size, 0);
      assert.equal(clock.frames.size, 0);
      assert.equal(calls, 1);

      const failedFonts = deferred();
      afterReaderImagesPaint(
        [],
        () => {
          calls += 1;
        },
        failedFonts.promise,
      );
      failedFonts.reject(new Error("Use the fallback font"));
      await Promise.resolve();
      assert.equal(clock.timers.size, 0);
      clock.paintFrame();
      clock.paintFrame();
      assert.equal(calls, 2);
    });
  },
);
