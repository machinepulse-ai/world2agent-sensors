# HackerNews Sensor Setup

Polls the [HackerNews API](https://github.com/HackerNews/API) for the top list; emits stories that pass the pre-filter. Semantic filtering is the handler skill's job.

All scores are HN official data (`score` = net upvotes, `descendants` = total comments).

## Configuration Parameters (written to `~/.world2agent/config.json`)

| Parameter | Type | Default | Description |
|---|---|---|---|
| `top_n` | number | 30 | How many top stories to watch |
| `min_score` | number | 1 | Below this score → skipped |
| `min_comments` | number | 0 | Below this comment count → skipped |
| `interval_seconds` | number | 300 | Poll interval |

## Questions to Ask

At most 3 questions.

1. **"Defaults are: top 30 stories, min score 50, 5-minute polling. Keep or change?"**

   `min_score: 50` is the recommended persona default (below that is noise). User can tighten or loosen. Skip if they say defaults fine.

2. **"What topics do you care about?"**

   Free text, fills `[USER_TOPICS]`. E.g. AI / LLM / Rust / startups / dev tools. Drives semantic relevance in the handler.

3. **"For a relevant story, do you want the title + link, a one-sentence "what / why it matters", or a deep dive (score ≥ 300 or comments ≥ 100 → WebSearch + 3-5 bullet report)?"**

   One bundled ask for handling depth + deep-dive trigger thresholds. Fills `[USER_NORMAL_STYLE]` and `[USER_DEEP_DIVE_THRESHOLD]`/`[USER_HOT_THRESHOLD]` with defaults 300 / 100 unless user overrides.

Irrelevant topics → silent skip. Don't separately ask.

## Output

### 1. Write `~/.world2agent/config.json`

```json
{
  "sensors": [
    {
      "package": "@world2agent/sensor-hackernews",
      "config": {
        "top_n": 30,
        "min_score": 50,
        "min_comments": 0,
        "interval_seconds": 300
      },
      "skills": ["<absolute path to the handler SKILL.md directory you wrote in §2>"]
    }
  ]
}
```

### 2. Write `.claude/skills/world2agent-sensor-hackernews/SKILL.md`

`name` MUST equal `world2agent-sensor-hackernews`. Template:

```markdown
---
name: world2agent-sensor-hackernews
user-invocable: false
description: Handle Hacker News story signals (hackernews.story.*). Topics: [USER_TOPICS].
---

# HackerNews Signal Handler

## Topics of interest
[USER_TOPICS]

Judge relevance from title + summary. Off-topic → skip silently.

## Signal anatomy
- `event.summary`: already tagged `[HOT]` / `[POPULAR]` / `[ACTIVE DISCUSSION]`
- `source_event.data`: `{ id, title, url, hn_url, score, comments, author, rank }`

## Handling
- Deep dive (score ≥ [USER_DEEP_DIVE_THRESHOLD] or comments ≥ [USER_HOT_THRESHOLD]): acknowledge → WebSearch/WebFetch the HN thread → 3–5 bullets (what / why now / main disagreement / one memorable angle) + [Article](url) | [HN](hn_url)
- Regular relevant: [USER_NORMAL_STYLE]
- Off-topic: silent

## Reply style
- Lead with judgment, then facts
- Don't restate the title (it's in the summary)
- Reply in the user's conversation language
```

## Before writing

1. Show `config.json` + skill for confirmation.
2. Create `.claude/skills/world2agent-sensor-hackernews/` and write both files.
