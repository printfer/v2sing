import { assertEquals } from "@std/assert";
import { parseHysteria2 } from "./hysteria2.ts";

Deno.test("parseHysteria2 - valid Hysteria2 URL with all parameters", () => {
  const raw =
    "hysteria2://securepassword@123.456.789.000:8443?insecure=1&sni=example.com&obfs=custom&obfs-password=secret#MyServer";

  const result = parseHysteria2(raw);

  assertEquals(result, {
    type: "hysteria2",
    tag: "MyServer",
    server: "123.456.789.000",
    server_port: 8443,
    password: "securepassword",
    tls: {
      enabled: true,
      server_name: "example.com",
      insecure: true,
    },
    obfs: {
      type: "custom",
      password: "secret",
    },
  });
});

Deno.test("parseHysteria2 - valid URL with only required parameters", () => {
  const raw = "hysteria2://mypassword@server.com:443#NoObfsTag";

  const result = parseHysteria2(raw);

  assertEquals(result, {
    type: "hysteria2",
    tag: "NoObfsTag",
    server: "server.com",
    server_port: 443,
    password: "mypassword",
    tls: {
      enabled: true,
    },
  });
});

Deno.test("parseHysteria2 - valid URL with no tag (should generate one)", () => {
  const raw = "hysteria2://randompass@vpn.example.net:5000";

  const result = parseHysteria2(raw);

  assertEquals(result.type, "hysteria2");
  assertEquals(result.server, "vpn.example.net");
  assertEquals(result.server_port, 5000);
  assertEquals(result.password, "randompass");
  assertEquals((result.tls as { enabled: boolean }).enabled, true);
  assertEquals(typeof result.tag, "string"); // Should have a generated tag
});

Deno.test("parseHysteria2 - supports port hopping and userpass alias", () => {
  const raw =
    "hy2://user:pass@example.com:443?ports=443-8443&hop-interval=15-30&up=30%20Mbps&down=200&obfs=salamander&obfs-password=secret&sni=example.com&alpn=h3&bbr-profile=aggressive#HopTag";

  const result = parseHysteria2(raw);

  assertEquals(result, {
    type: "hysteria2",
    tag: "HopTag",
    server: "example.com",
    server_ports: ["443:8443"],
    hop_interval: "15s",
    hop_interval_max: "30s",
    up_mbps: 30,
    down_mbps: 200,
    password: "user:pass",
    bbr_profile: "aggressive",
    tls: {
      enabled: true,
      server_name: "example.com",
      alpn: ["h3"],
    },
    obfs: {
      type: "salamander",
      password: "secret",
    },
  });
});

Deno.test("parseHysteria2 - keeps sing-box style port ranges", () => {
  const raw = "hy2://pass@example.com:443?ports=2080:3000,4000#RangeTag";

  const result = parseHysteria2(raw);

  assertEquals(result, {
    type: "hysteria2",
    tag: "RangeTag",
    server: "example.com",
    server_ports: ["2080:3000", "4000"],
    password: "pass",
    tls: {
      enabled: true,
    },
  });
});
