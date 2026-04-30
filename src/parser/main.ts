import { parseClashSubscription } from "./clash.ts";
import { parseHysteria2 } from "./hysteria2.ts";
import { parseShadowsocks } from "./shadowsocks.ts";
import { parseTrojan } from "./trojan.ts";
import { parseVless } from "./vless.ts";
import { parseVmess } from "./vmess.ts";
import { decodeBase64, isBase64 } from "./utils.ts";

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
  subscription = decodeSubscriptionIfNeeded(subscription);

  if (/^\s*proxies\s*:/m.test(subscription)) {
    const { proxies, failedLines } = parseClashSubscription(subscription);
    const uniqueSubscription = deduplicateSubscription(proxies);
    return [
      uniqueSubscription,
      {
        failedLines,
        totalSuccess: uniqueSubscription.length,
        totalFailed: failedLines.length,
      },
    ];
  }

  const lines = subscription.split("\n").filter((line) => {
    const trimmedLine = line.trim();
    return trimmedLine !== "" && !trimmedLine.startsWith("#");
  });

  const parsedSubscription: Record<string, unknown>[] = [];
  const failedLines: { line: string; error: string }[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    try {
      let parsedLine;
      if (trimmedLine.startsWith("vmess://")) {
        parsedLine = parseVmess(trimmedLine);
      } else if (trimmedLine.startsWith("vless://")) {
        parsedLine = parseVless(trimmedLine);
      } else if (trimmedLine.startsWith("ss://")) {
        parsedLine = parseShadowsocks(trimmedLine);
      } else if (trimmedLine.startsWith("trojan://")) {
        parsedLine = parseTrojan(trimmedLine);
      } else if (
        trimmedLine.startsWith("hysteria2://") ||
        trimmedLine.startsWith("hy2://")
      ) {
        parsedLine = parseHysteria2(trimmedLine);
      } else {
        throw new Error("Unsupported protocol");
      }

      parsedSubscription.push(parsedLine);
    } catch (error) {
      failedLines.push({
        line: trimmedLine,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const uniqueSubscription = deduplicateSubscription(parsedSubscription);

  return [
    uniqueSubscription,
    {
      failedLines,
      totalSuccess: uniqueSubscription.length,
      totalFailed: failedLines.length,
    },
  ];
}

function decodeSubscriptionIfNeeded(subscription: string): string {
  const trimmedSubscription = subscription.trim();
  if (!isBase64(trimmedSubscription)) {
    return subscription;
  }

  try {
    const decodedSubscription = decodeBase64(trimmedSubscription);
    return decodedSubscription.includes("://") ||
        /^\s*proxies\s*:/m.test(decodedSubscription)
      ? decodedSubscription
      : subscription;
  } catch {
    return subscription;
  }
}

function deduplicateSubscription(
  parsedSubscription: Record<string, unknown>[],
): Record<string, unknown>[] {
  const uniqueSubscriptionMap = new Map<string, Record<string, unknown>>();

  for (const item of parsedSubscription) {
    if (item?.tag && !uniqueSubscriptionMap.has(item.tag as string)) {
      uniqueSubscriptionMap.set(item.tag as string, item);
    }
  }

  return Array.from(uniqueSubscriptionMap.values());
}
