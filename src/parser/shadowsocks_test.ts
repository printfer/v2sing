import { assertEquals } from "@std/assert";
import { parseShadowsocks } from "./shadowsocks.ts";

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

Deno.test("parseShadowsocks - supports SIP002 user info and plugin fields", () => {
  const credentials = btoa("2022-blake3-chacha20-poly1305:password123");
  const raw =
    `ss://${credentials}@example.com:443?plugin=v2ray-plugin%3Bmode%3Dwebsocket%3Bhost%3Dcdn.example.com#PluginTag`;

  const result = parseShadowsocks(raw);

  assertEquals(result, {
    type: "shadowsocks",
    tag: "PluginTag",
    server: "example.com",
    server_port: 443,
    method: "2022-blake3-chacha20-poly1305",
    password: "password123",
    plugin: "v2ray-plugin",
    plugin_opts: "mode=websocket;host=cdn.example.com",
  });
});

Deno.test("parseShadowsocks - supports legacy full base64 URI", () => {
  const raw = `ss://${btoa("aes-256-gcm:password@example.com:8388")}#LegacyTag`;

  const result = parseShadowsocks(raw);

  assertEquals(result, {
    type: "shadowsocks",
    tag: "LegacyTag",
    server: "example.com",
    server_port: 8388,
    method: "aes-256-gcm",
    password: "password",
  });
});
