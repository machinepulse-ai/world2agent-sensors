# @world2agent/sensor-hackernews

World2Agent sensor for Hacker News. Polls the top-stories endpoint and emits one signal per story that crosses a configurable score threshold.

Part of [World2Agent](https://github.com/machinepulse-ai/world2agent).

## Install

```bash
npm install -g @world2agent/sensor-hackernews
```

> Inside **Claude Code**, prefer `/world2agent:sensor-add @world2agent/sensor-hackernews` — the plugin does the Q&A and wires up the handler skill for you.

## Signals emitted

- `news.story.trending`

## Run

```bash
w2a-sensor-hackernews
```

See [`SETUP.md`](./SETUP.md) for deployment patterns, configuration, and handler-skill setup.

## License

Apache-2.0
