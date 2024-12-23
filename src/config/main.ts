import { getDnsConfig } from "./dns.ts";
import { getInboundsConfig } from "./inbounds.ts";
import { getOutboundsConfig } from "./outbounds.ts";
import { getRouteConfig } from "./route.ts";

export function getConfig(subscribedOutbounds) {
  return {
    dns: getDnsConfig(),
    inbounds: getInboundsConfig(),
    outbounds: getOutboundsConfig(subscribedOutbounds),
    route: getRouteConfig(),
  };
}
