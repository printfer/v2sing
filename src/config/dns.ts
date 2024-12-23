export function getDnsConfig() {
  return {
    "servers": [
      {
        "tag": "google",
        "address": "tls://8.8.8.8",
      },
    ],
    "rules": [],
  };
}
