import { assertEquals } from "@std/assert";
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
