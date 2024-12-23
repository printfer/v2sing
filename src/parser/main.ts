import { decodeBase64, isBase64 } from "./utils.ts";
import { parseVmess } from "./vmess.ts";
import { parseVless } from "./vless.ts";
import { parseShadowsocks } from "./ss.ts";
import { parseTrojan } from "./trojan.ts";

export function parseSubscription(
  subscription: string,
): Record<string, unknown>[] {
  // Detect and decode Base64 if necessary
  if (isBase64(subscription)) {
    subscription = decodeBase64(subscription);
  }

  // Split the subscription into lines and filter out empty lines and comments
  const lines = subscription.split("\n").filter((line) =>
    line.trim() !== "" && !line.startsWith("#")
  );

  const parsedSubscription = lines.map((line) => {
    try {
      if (line.startsWith("vmess://")) {
        return parseVmess(line);
      } else if (line.startsWith("vless://")) {
        return parseVless(line);
      } else if (line.startsWith("ss://")) {
        return parseShadowsocks(line);
      } else if (line.startsWith("trojan://")) {
        return parseTrojan(line);
      } else {
        throw new Error(`Unsupported protocol: ${line}`);
      }
    } catch (error) {
      throw new Error(`Error parsing line: ${line} (${error.message})`);
    }
  });

  // Filter out duplicate objects based on the 'tag' property
  const uniqueSubscriptionMap = new Map<string, Record<string, unknown>>();
  for (const item of parsedSubscription) {
    if (item?.tag && !uniqueSubscriptionMap.has(item.tag as string)) {
      uniqueSubscriptionMap.set(item.tag as string, item);
    }
  }

  // Return unique objects as an array
  return Array.from(uniqueSubscriptionMap.values());
}
