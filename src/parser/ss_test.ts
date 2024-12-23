import { assertEquals } from "@std/assert";
import { parseShadowsocks } from "./ss.ts";

Deno.test("parseShadowsocks - valid Shadowsocks URL with all parameters", () => {
  const raw =
    "ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZDEyMw==@example.com:12345#ExampleTag";

  const result = parseShadowsocks(raw);

  assertEquals(result, {
    type: "shadowsocks",
    tag: "ExampleTag",
    server: "example.com",
    server_port: 12345,
    method: "chacha20-ietf-poly1305",
    password: "password123",
  });
});
