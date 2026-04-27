# World2Agent sensors

Example sensors for [World2Agent](https://github.com/machinepulse-ai/world2agent) — the open protocol that lets AI agents perceive the world.

These are reference implementations, meant to show what a sensor looks like and to be useful as-is. Each subdirectory is an independent npm package that emits W2A signals from a specific source.

## Sensors

| Package | Source | Signals | Status |
| :-- | :-- | :-- | :-- |
| [`@world2agent/sensor-hackernews`](./hackernews) | Hacker News top stories | `news.story.trending` | `0.1.0-alpha` |

The community-published registry lives at [SensorHub](https://world2agent.ai/hub) — that's where the broader ecosystem of sensors will land.

## Use a sensor

Inside **Claude Code**, the easiest path is the `world2agent` plugin:

```
/world2agent:sensor-add @world2agent/sensor-hackernews
```

The plugin asks the configuration questions defined in the sensor's `SETUP.md`, writes `~/.world2agent/config.json`, and installs the matching handler skill.

Outside Claude Code, install and run the binary directly:

```bash
npm install -g @world2agent/sensor-hackernews
w2a-sensor-hackernews
```

Each sensor's `README.md` and `SETUP.md` cover its specific configuration and deployment patterns.

## Build a sensor

Sensors are built with the [`@world2agent/sdk`](https://github.com/machinepulse-ai/world2agent-typescript-sdk) — `defineSensor` from `@world2agent/sdk/sensor` is the entry point. The SDK handles the signal envelope, transports (stdout / HTTP / fanout), and Zod-based config validation; you write the polling loop and the source-to-signal transform.

See [`hackernews/src/`](./hackernews/src) as a reference implementation.

## Repository layout

This repo is a flat collection — no root-level package manager, no shared build, no workspaces. Each sensor is self-contained: its own `package.json`, its own `tsconfig.json`, its own release cadence. Run package commands inside the relevant subdirectory.

## License

Apache-2.0. See each subpackage's `LICENSE` for details.
