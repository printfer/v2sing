import { getDnsConfig } from "./dns.ts";
import { getInboundsConfig } from "./inbounds.ts";
import { getOutboundsConfig } from "./outbounds.ts";
import { getRouteConfig } from "./route.ts";

export function getConfig(subscribedOutbounds, configTemplate?) {
  if (configTemplate) {
    return useConfigTemplate(configTemplate, subscribedOutbounds);
  }

  return {
    dns: getDnsConfig(),
    inbounds: getInboundsConfig(),
    outbounds: getOutboundsConfig(subscribedOutbounds),
    route: getRouteConfig(),
  };
}

function useConfigTemplate(template, subscribedOutbounds) {
  // Generate replacements for the config template
  const replacements = {
    outbounds_tags: subscribedOutbounds.map((outbound) => outbound.tag),
    outbounds: subscribedOutbounds,
  };
  return replacePlaceholdersInConfig(template, replacements);
}

// Function to recursively replace placeholders in a config template
function replacePlaceholdersInConfig(template, replacements) {
  if (typeof template === "string") {
    // Replace placeholders in strings
    const placeholderMatch = template.match(/^\{\{(.*?)\}\}$/);
    if (placeholderMatch) {
      const key = placeholderMatch[1].trim();
      if (key in replacements) {
        return replacements[key]; // Replace with the exact replacement (object, array, or primitive)
      }
    }
    return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const replacementKey = key.trim();
      return replacementKey in replacements
        ? replacements[replacementKey]
        : match;
    });
  } else if (Array.isArray(template)) {
    // Process each item in the array
    return template.flatMap((item) => {
      const result = replacePlaceholdersInConfig(item, replacements);
      return Array.isArray(result) ? result : [result]; // Flatten arrays into the parent
    });
  } else if (typeof template === "object" && template !== null) {
    // Recursively process objects
    return Object.fromEntries(
      Object.entries(template).map(([key, value]) => [
        key,
        replacePlaceholdersInConfig(value, replacements),
      ]),
    );
  }
  // Return the value if it's not a string, object, or array
  return template;
}
