import { assertEquals, assertThrows } from "@std/assert";
import { parseTrojan } from "./trojan.ts";

Deno.test("parseTrojan - valid Trojan URL with all parameters", () => {
  const raw =
    "trojan://password123@example.com:443?sni=example.com&security=tls#MyTag";

  const result = parseTrojan(raw);

  assertEquals(result, {
    type: "trojan",
    tag: "MyTag",
    server: "example.com",
    server_port: 443,
    password: "password123",
    tls: {
      enabled: true,
      server_name: "example.com",
    },
  });
});

Deno.test("parseTrojan - supports websocket and reality fields", () => {
  const raw =
    "trojan://password123@example.com:443?type=ws&path=%2Fws&host=cdn.example.com&security=reality&sni=example.com&pbk=pubkey&sid=abcd&fp=chrome#RealityTrojan";

  const result = parseTrojan(raw);

  assertEquals(result, {
    type: "trojan",
    tag: "RealityTrojan",
    server: "example.com",
    server_port: 443,
    password: "password123",
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
        Host: "cdn.example.com",
      },
    },
  });
});

Deno.test("parseTrojan - supports IPv6 URI host", () => {
  const raw = "trojan://password123@[2001:db8::2]:443#IPv6";

  const result = parseTrojan(raw);

  assertEquals(result, {
    type: "trojan",
    tag: "IPv6",
    server: "2001:db8::2",
    server_port: 443,
    password: "password123",
    tls: {
      enabled: true,
    },
  });
});

Deno.test("parseTrojan - rejects missing password", () => {
  assertThrows(
    () => parseTrojan("trojan://@server.com:443#MissingPassword"),
    Error,
    "Missing password",
  );
});
