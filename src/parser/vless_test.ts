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

  assertMatch(result.tag as string, /^vless_/); // Check that the tag matches the pattern
  assertEquals(result.type, "vless");
  assertEquals(result.server, "server.com");
  assertEquals(result.server_port, 443);
  assertEquals(result.uuid, "uuid");
});

Deno.test("parseVless - supports reality and websocket options", () => {
  const raw =
    "vless://uuid@server.com:443?type=ws&path=%2Fws&host=example.com&flow=xtls-rprx-vision&packet-encoding=xudp&security=reality&sni=example.com&fp=chrome&pbk=pubkey&sid=abcd&ed=2048&eh=Sec-WebSocket-Protocol#RealityTag";

  const result = parseVless(raw);

  assertEquals(result, {
    type: "vless",
    tag: "RealityTag",
    server: "server.com",
    server_port: 443,
    uuid: "uuid",
    flow: "xtls-rprx-vision",
    packet_encoding: "xudp",
    tls: {
      enabled: true,
      server_name: "example.com",
      utls: {
        enabled: true,
        fingerprint: "chrome",
      },
      reality: {
        enabled: true,
        public_key: "pubkey",
        short_id: "abcd",
      },
    },
    transport: {
      type: "ws",
      path: "/ws",
      headers: {
        Host: "example.com",
      },
      max_early_data: 2048,
      early_data_header_name: "Sec-WebSocket-Protocol",
    },
  });
});

Deno.test("parseVless - preserves malformed tag escapes", () => {
  const raw = "vless://uuid@server.com:443#Bad%Tag";

  const result = parseVless(raw);

  assertEquals(result, {
    type: "vless",
    tag: "Bad%Tag",
    server: "server.com",
    server_port: 443,
    uuid: "uuid",
  });
});
