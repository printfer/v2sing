export function getOutboundsConfig(subscribedOutbounds) {
  // Extract tags from the subscribed outbounds
  const tags = subscribedOutbounds.map((outbound) => outbound.tag);

  // Create the selector object
  const selector = {
    type: "selector",
    tag: "select",
    outbounds: ["auto", ...tags],
    default: "auto",
    interrupt_exist_connections: false,
  };

  // Create the urltest object
  const urltest = {
    tag: "auto",
    type: "urltest",
    outbounds: tags,
  };

  // Create the direct object (Note: This will be removed in sing-box v1.11.0+)
  const direct = {
    type: "direct",
    tag: "direct",
  };

  // Create the DNS object (Note: This will be removed in sing-box v1.11.0+)
  const dns = {
    type: "dns",
    tag: "dns-out",
  };

  // Return the new array with the prepended objects
  return [selector, urltest, ...subscribedOutbounds, direct, dns];
}
