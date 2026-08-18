import configTemplateDefault from "./templates/default.ts";

export function getConfig(
  subscribedOutbounds: Record<string, unknown>[],
  configTemplate: Record<string, unknown> = configTemplateDefault,
): Record<string, unknown> {
  // Generate replacements for the config template
  const replacements: Record<string, unknown> = {
    outbounds_tags: subscribedOutbounds.map((outbound) => outbound.tag),
    outbounds: subscribedOutbounds,
  };
  return Object.fromEntries(
    Object.entries(configTemplate).map(([key, value]) => [
      key,
      replacePlaceholdersInConfig(value, replacements),
    ]),
  );
}

// Function to recursively replace placeholders in a config template
function replacePlaceholdersInConfig(
  template: unknown,
  replacements: Record<string, unknown>,
): unknown {
  if (typeof template === "string") {
    // Replace placeholders in strings
    const placeholderMatch = template.match(/^\{\{(.*?)\}\}$/);
    if (placeholderMatch) {
      const key = placeholderMatch[1].trim();
      if (Object.hasOwn(replacements, key)) {
        return replacements[key]; // Replace with the exact replacement (object, array, or primitive)
      }
    }
    return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const replacementKey = key.trim();
      return Object.hasOwn(replacements, replacementKey)
        ? String(replacements[replacementKey])
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
