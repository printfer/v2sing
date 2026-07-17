import { assertEquals } from "@std/assert";
import { getConfig } from "./main.ts";

Deno.test("getConfig - replaces outbound placeholders", () => {
  const outbound = {
    type: "vless",
    tag: "node",
  };
  const template = {
    outbounds: ["{{ outbounds }}"],
    selector: {
      outbounds: ["direct", "{{ outbounds_tags }}"],
    },
  };

  assertEquals(getConfig([outbound], template), {
    outbounds: [outbound],
    selector: {
      outbounds: ["direct", "node"],
    },
  });
});
