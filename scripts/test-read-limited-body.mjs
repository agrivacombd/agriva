import assert from "node:assert/strict";
import { readLimitedBody } from "../lib/http/read-limited-body.mjs";

const encoder = new TextEncoder();
const requestWith = (chunks, headers = {}) => new Request("https://example.test", {
  method: "POST",
  headers,
  body: new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  }),
});

assert.equal(await readLimitedBody(requestWith([encoder.encode('{"ok":true}')]), 32), '{"ok":true}');
assert.equal(await readLimitedBody(requestWith([encoder.encode("1234")]), 4), "1234");
assert.equal(await readLimitedBody(requestWith([encoder.encode("12345")]), 4), null);
assert.equal(await readLimitedBody(requestWith([encoder.encode("a"), encoder.encode("bcde")]), 4), null);
assert.equal(await readLimitedBody(requestWith([encoder.encode("tiny")], { "content-length": "9999" }), 4), null);

const unicode = encoder.encode("🌱");
assert.equal(await readLimitedBody(requestWith([unicode.slice(0, 2), unicode.slice(2)]), 4), "🌱");
assert.equal(await readLimitedBody(new Request("https://example.test"), 4), "");
await assert.rejects(() => readLimitedBody(requestWith([encoder.encode("x")]), -1), TypeError);
await assert.rejects(() => readLimitedBody(requestWith([encoder.encode("x")]), 1.5), TypeError);

console.log("Bounded request body reader tests passed.");
