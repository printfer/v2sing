import { assertEquals, assertMatch } from "@std/assert";
import { parseVless } from "./vless.ts";

Deno.test("parseVless - valid VLESS URL with all parameters", () => {
  const raw =
    "vless://uuid@server.com:443?type=ws&path=%2Fcustompath&host=example.com#MyTag";

  const result = parseVless(raw);

  assertEquals(result, {
    type: "vless",
    tag: "MyTag",
    server: "server.com",
    server_port: 443,
    uuid: "uuid",
    transport: {
      type: "ws",
      path: "/custompath",
      headers: {
        Host: "example.com",
      },
    },
  });
});

Deno.test("parseVless - valid VLESS URL without optional fields", () => {
  const raw = "vless://uuid@server.com:443";

  const result = parseVless(raw);

  assertMatch(result.tag, /^vless_/); // Check that the tag matches the pattern
  assertEquals(result.type, "vless");
  assertEquals(result.server, "server.com");
  assertEquals(result.server_port, 443);
  assertEquals(result.uuid, "uuid");
});
