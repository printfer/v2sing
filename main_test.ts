import { assertEquals } from "@std/assert";
import worker from "./main.ts";

Deno.test("worker - rejects non-object config templates", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;

  globalThis.fetch = () => {
    fetchCount += 1;
    return Promise.resolve(
      fetchCount === 1
        ? new Response("vless://uuid@server.example:443#node")
        : Response.json([]),
    );
  };

  try {
    const response = await worker.fetch(
      new Request(
        "https://worker.example/?sub=https://example.com/sub&config=https://example.com/config",
      ),
    );

    assertEquals(response.status, 500);
    assertEquals(await response.json(), {
      error: "Error fetching config template",
      details: "Config template must be a JSON object",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
