import { decodeBase64, isBase64 } from "./utils.ts";
import { parseVmess } from "./vmess.ts";
import { parseVless } from "./vless.ts";
import { parseShadowsocks } from "./shadowsocks.ts";
import { parseTrojan } from "./trojan.ts";
import { parseHysteria2 } from "./hysteria2.ts";

export function parseSubscription(
  subscription: string,
): [
  Record<string, unknown>[],
  {
    failedLines: { line: string; error: string }[];
    totalSuccess: number;
    totalFailed: number;
  },
] {
  // Detect and decode Base64 if necessary
  if (isBase64(subscription)) {
    subscription = decodeBase64(subscription);
  }

  // Split the subscription into lines and filter out empty lines and comments
  const lines = subscription.split("\n").filter((line) =>
    line.trim() !== "" && !line.startsWith("#")
  );

  const parsedSubscription: Record<string, unknown>[] = [];
  const failedLines: { line: string; error: string }[] = [];

  for (const line of lines) {
    try {
      let parsedLine;
      if (line.startsWith("vmess://")) {
        parsedLine = parseVmess(line);
      } else if (line.startsWith("vless://")) {
        parsedLine = parseVless(line);
      } else if (line.startsWith("ss://")) {
        parsedLine = parseShadowsocks(line);
      } else if (line.startsWith("trojan://")) {
        parsedLine = parseTrojan(line);
      } else if (line.startsWith("hysteria2://") || line.startsWith("hy2://")) {
        parsedLine = parseHysteria2(line);
      } else {
        throw new Error(`Unsupported protocol`);
      }
      parsedSubscription.push(parsedLine);
    } catch (error) {
      failedLines.push({ line, error: error.message });
    }
  }

  // Filter out duplicate objects based on the 'tag' property
  const uniqueSubscriptionMap = new Map<string, Record<string, unknown>>();
  for (const item of parsedSubscription) {
    if (item?.tag && !uniqueSubscriptionMap.has(item.tag as string)) {
      uniqueSubscriptionMap.set(item.tag as string, item);
    }
  }

  return [
    Array.from(uniqueSubscriptionMap.values()),
    {
      failedLines,
      totalSuccess: uniqueSubscriptionMap.size,
      totalFailed: failedLines.length,
    },
  ];
}
