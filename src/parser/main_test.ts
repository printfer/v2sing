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
      server_ports: ["443:8443"],
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

Deno.test("parseSubscription - supports url-safe base64 subscriptions", () => {
  const encodedSubscription = btoa("trojan://password@example.com:443#UrlSafe")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const [result, info] = parseSubscription(encodedSubscription);

  assertEquals(info.failedLines, []);
  assertEquals(info.totalSuccess, 1);
  assertEquals(info.totalFailed, 0);
  assertEquals(result[0], {
    type: "trojan",
    tag: "UrlSafe",
    server: "example.com",
    server_port: 443,
    password: "password",
    tls: {
      enabled: true,
    },
  });
});

Deno.test("parseSubscription - deduplicates by tag", () => {
  const subscription = [
    "vless://uuid-1@example.com:443#SameTag",
    "vless://uuid-2@example.org:443#SameTag",
  ].join("\n");

  const [result, info] = parseSubscription(subscription);

  assertEquals(info.failedLines, []);
  assertEquals(info.totalSuccess, 1);
  assertEquals(info.totalFailed, 0);
  assertEquals(result, [
    {
      type: "vless",
      tag: "SameTag",
      server: "example.com",
      server_port: 443,
      uuid: "uuid-1",
    },
  ]);
});

Deno.test("parseSubscription - reports mixed line failures without aborting", () => {
  const subscription = [
    "vless://uuid@example.com:443#Ok",
    "unsupported://example.com",
    "vless://uuid@example.com:443?type=xhttp#BadTransport",
  ].join("\n");

  const [result, info] = parseSubscription(subscription);

  assertEquals(result, [
    {
      type: "vless",
      tag: "Ok",
      server: "example.com",
      server_port: 443,
      uuid: "uuid",
    },
  ]);
  assertEquals(info.totalSuccess, 1);
  assertEquals(info.totalFailed, 2);
  assertMatch(info.failedLines[0].error, /Unsupported protocol/);
  assertMatch(info.failedLines[1].error, /Unsupported transport type: xhttp/);
});

Deno.test("parseSubscription - supports broader Clash proxy fields", () => {
  const subscription = `
proxies:
  - name: ClashVLESSReality
    type: vless
    server: vless.example.com
    port: 443
    uuid: uuid
    flow: xtls-rprx-vision
    packet-encoding: xudp
    tls: true
    servername: reality.example.com
    client-fingerprint: chrome
    reality-opts:
      public-key: public-key
      short-id: abcd
    network: grpc
    grpc-opts:
      grpc-service-name: grpc-service
  - name: ClashSS
    type: ss
    server: ss.example.com
    port: 8388
    cipher: 2022-blake3-aes-256-gcm
    password: secret
    udp-over-tcp: true
    plugin: v2ray-plugin
    plugin-opts:
      mode: websocket
      host: cdn.example.com
  - name: ClashTrojanUpgrade
    type: trojan
    server: trojan.example.com
    port: 443
    password: secret
    sni: trojan.example.com
    network: ws
    ws-opts:
      path: /upgrade
      headers:
        host: cdn.example.com
      v2ray-http-upgrade: true
`;

  const [result, info] = parseSubscription(subscription);

  assertEquals(info.failedLines, []);
  assertEquals(info.totalSuccess, 3);
  assertEquals(info.totalFailed, 0);
  assertEquals(result, [
    {
      type: "vless",
      tag: "ClashVLESSReality",
      server: "vless.example.com",
      server_port: 443,
      uuid: "uuid",
      flow: "xtls-rprx-vision",
      packet_encoding: "xudp",
      tls: {
        enabled: true,
        server_name: "reality.example.com",
        utls: {
          enabled: true,
          fingerprint: "chrome",
        },
        reality: {
          enabled: true,
          public_key: "public-key",
          short_id: "abcd",
        },
      },
      transport: {
        type: "grpc",
        service_name: "grpc-service",
      },
    },
    {
      type: "shadowsocks",
      tag: "ClashSS",
      server: "ss.example.com",
      server_port: 8388,
      method: "2022-blake3-aes-256-gcm",
      password: "secret",
      plugin: "v2ray-plugin",
      plugin_opts: "mode=websocket;host=cdn.example.com",
      udp_over_tcp: true,
    },
    {
      type: "trojan",
      tag: "ClashTrojanUpgrade",
      server: "trojan.example.com",
      server_port: 443,
      password: "secret",
      tls: {
        enabled: true,
        server_name: "trojan.example.com",
      },
      transport: {
        type: "httpupgrade",
        host: "cdn.example.com",
        path: "/upgrade",
        headers: {
          host: "cdn.example.com",
        },
      },
    },
  ]);
});
