import { assertEquals, assertMatch } from "@std/assert";
import { parseSubscription } from "./main.ts";

Deno.test("parseSubscription - supports Clash YAML subscriptions", () => {
  const subscription = `
proxies:
  - name: ClashVMess
    type: vmess
    server: vmess.example.com
    port: 443
    uuid: cafd65c4-bf0f-4e5d-8d3e-5f6b39e3243c
    alterId: 0
    cipher: auto
    tls: true
    servername: example.com
    network: ws
    ws-opts:
      path: /ws
      headers:
        Host: cdn.example.com
  - name: ClashHy2
    type: hysteria2
    server: hy2.example.com
    port: 443
    ports: 443-8443
    hop-interval: 20-40
    password: secret
    sni: hy2.example.com
`;

  const [result, info] = parseSubscription(subscription);

  assertEquals(info, {
    failedLines: [],
    totalSuccess: 2,
    totalFailed: 0,
  });
  assertEquals(result, [
    {
      type: "vmess",
      tag: "ClashVMess",
      server: "vmess.example.com",
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
        path: "/ws",
        headers: {
          Host: "cdn.example.com",
        },
      },
    },
    {
      type: "hysteria2",
      tag: "ClashHy2",
      server: "hy2.example.com",
      server_ports: ["443-8443"],
      hop_interval: "20s",
      hop_interval_max: "40s",
      password: "secret",
      tls: {
        enabled: true,
        server_name: "hy2.example.com",
      },
    },
  ]);
});

Deno.test("parseSubscription - decodes base64 subscriptions", () => {
  const encodedSubscription = btoa("vless://uuid@server.com:443#Base64Tag");

  const [result, info] = parseSubscription(encodedSubscription);

  assertEquals(info.failedLines, []);
  assertEquals(info.totalSuccess, 1);
  assertEquals(info.totalFailed, 0);
  assertEquals(result[0], {
    type: "vless",
    tag: "Base64Tag",
    server: "server.com",
    server_port: 443,
    uuid: "uuid",
  });
});

Deno.test("parseSubscription - rejects unsupported Clash transport cleanly", () => {
  const subscription = `
proxies:
  - name: UnsupportedXhttp
    type: vless
    server: server.com
    port: 443
    uuid: uuid
    network: xhttp
`;

  const [result, info] = parseSubscription(subscription);

  assertEquals(result, []);
  assertEquals(info.totalSuccess, 0);
  assertEquals(info.totalFailed, 1);
  assertMatch(info.failedLines[0].error, /Unsupported transport type: xhttp/);
});
