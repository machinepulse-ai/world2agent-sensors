import { defineSensor } from "@world2agent/sdk/sensor";
import { hackernewsConfigSchema } from "./types.js";
import { start } from "./start.js";

export default defineSensor({
  id: "@world2agent/sensor-hackernews",
  version: "0.1.0-alpha.2",
  source_type: "hackernews",
  configSchema: hackernewsConfigSchema,
  auth: { type: "none" },
  async start(ctx) {
    return start(this, ctx);
  },
});

export { poll } from "./start.js";
export { transformStory } from "./transform.js";
export { hackernewsConfigSchema } from "./types.js";
export type { HackernewsConfig, HNStory } from "./types.js";
