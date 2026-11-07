const assert = require("node:assert/strict");
const { once } = require("node:events");
const { createServer } = require("node:http");
const { test } = require("node:test");
const { LumenBrainDriver } = require(process.env.LUMEN_BRAIN_TEST_BUILD || "../dist");

test("cancels in both modes and polls with brain-scoped credentials", async () => {
  const calls = [];
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString();
    const body = raw ? JSON.parse(raw) : undefined;
    calls.push({
      path: decodeURIComponent(request.url),
      method: request.method,
      brain: request.headers["x-brain-id"],
      token: request.headers.brainpat,
      body,
    });
    const cancellation = request.method === "POST";
    response.writeHead(cancellation ? 202 : 200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      task_id: "task:1",
      status: cancellation ? "cancelling" : "cancelled",
      ...body,
    }));
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const driver = new LumenBrainDriver("unused", {
      baseUrl: `http://127.0.0.1:${server.address().port}`,
      brainId: "test-brain",
      brainPat: "test-token",
    });
    for (const mode of ["keep_saved", "rollback"]) {
      assert.equal((await driver.cancelIngestion("task:1", mode)).status, "cancelling");
    }
    assert.equal((await driver.getIngestionTask("task:1")).status, "cancelled");
    const credentials = { brain: "test-brain", token: "test-token" };
    assert.deepEqual(calls, [
      { ...credentials, path: "/tasks/task:1/cancel", method: "POST", body: { mode: "keep_saved" } },
      { ...credentials, path: "/tasks/task:1/cancel", method: "POST", body: { mode: "rollback" } },
      { ...credentials, path: "/tasks/task:1", method: "GET", body: undefined },
    ]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
