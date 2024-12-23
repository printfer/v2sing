import { assertEquals } from "@std/assert";
import { parseVmess } from "./vmess.ts";

// Helper function to encode a VMess config as Base64
function encodeVmessConfig(config: Record<string, unknown>): string {
  const jsonStr = JSON.stringify(config);
  return btoa(jsonStr);
}

Deno.test("parseVmess - valid VMess URL with all parameters", () => {
  const vmessConfig = {
    v: "2",
    ps: "TestNode",
    add: "example.com",
    port: "443",
    id: "cafd65c4-bf0f-4e5d-8d3e-5f6b39e3243c",
    aid: "0",
    scy: "auto",
    net: "ws",
    type: "none",
    host: "example.com",
    path: "/path",
    tls: "tls",
    sni: "example.com",
  };

  const encodedConfig = "vmess://" + encodeVmessConfig(vmessConfig);
  const result = parseVmess(encodedConfig);

  assertEquals(result, {
    type: "vmess",
    tag: "TestNode",
    server: "example.com",
    server_port: 443,
    uuid: "cafd65c4-bf0f-4e5d-8d3e-5f6b39e3243c",
    security: "auto",
    alter_id: 0,
    tls: {
      enabled: true,
      server_name: "example.com",
    },
    transport: {
      type: "ws",
      path: "/path",
      headers: { Host: "example.com" },
    },
  });
});

Deno.test("parseVmess - valid VMess URL without host", () => {
  const vmessConfig = {
    v: "2",
    ps: "TestNode",
    add: "example.com",
    port: "443",
    id: "cafd65c4-bf0f-4e5d-8d3e-5f6b39e3243c",
    aid: "0",
    scy: "auto",
    net: "tcp",
    type: "none",
    path: "",
    tls: "none",
  };

  const encodedConfig = "vmess://" + encodeVmessConfig(vmessConfig);
  const result = parseVmess(encodedConfig);

  assertEquals(result, {
    type: "vmess",
    tag: "TestNode",
    server: "example.com",
    server_port: 443,
    uuid: "cafd65c4-bf0f-4e5d-8d3e-5f6b39e3243c",
    security: "auto",
    alter_id: 0,
  });
});
