export function getRouteConfig() {
  return {
    "rules": [
      {
        "protocol": "dns",
        "outbound": "dns-out",
      },
      {
        "ip_is_private": true,
        "outbound": "direct",
      },
    ],
    "auto_detect_interface": true,
  };
}
