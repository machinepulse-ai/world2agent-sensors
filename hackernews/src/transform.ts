import { createSignal, type W2ASignal, type SensorSpec } from "@world2agent/sdk";
import type { HackernewsConfig, HNStory } from "./types.js";

export function transformStory(
  spec: SensorSpec<HackernewsConfig>,
  story: HNStory,
  rank: number,
): W2ASignal {
  const hnUrl = `https://news.ycombinator.com/item?id=${story.id}`;
  const link = story.url || hnUrl;

  const tags: string[] = [];
  if (story.score >= 500) tags.push("[HOT]");
  else if (story.score >= 300) tags.push("[POPULAR]");
  if (story.descendants >= 200) tags.push("[ACTIVE DISCUSSION]");
  else if (story.descendants >= 100) tags.push("[DISCUSSING]");
  if (story.title.toLowerCase().startsWith("show hn")) tags.push("[Show HN]");
  if (story.title.toLowerCase().startsWith("ask hn")) tags.push("[Ask HN]");

  const prefix = tags.length > 0 ? tags.join(" ") + " " : "";
  const summary = `${prefix}#${rank} (${story.score}pts, ${story.descendants} comments) ${story.title}`;

  return createSignal(spec, {
    event: {
      type: "hackernews.story.trending",
      occurred_at: story.time * 1000,
      summary,
    },
    source_event: {
      schema: {
        type: "object",
        properties: {
          id: { type: "number" },
          title: { type: "string" },
          url: { type: "string" },
          hn_url: { type: "string" },
          score: { type: "number" },
          comments: { type: "number" },
          author: { type: "string" },
          rank: { type: "number" },
        },
        required: ["id", "title", "hn_url", "score", "comments", "author", "rank"],
      },
      data: {
        id: story.id,
        title: story.title,
        url: link,
        hn_url: hnUrl,
        score: story.score,
        comments: story.descendants,
        author: story.by,
        rank,
      },
    },
    attachments: [
      {
        type: "inline" as const,
        mime_type: "text/plain",
        description: "Story title and link",
        data: `${story.title}\n${link}`,
      },
      ...(story.text
        ? [
            {
              type: "inline" as const,
              mime_type: "text/html",
              description: "Story body (Ask HN / text post)",
              data: story.text,
            },
          ]
        : []),
    ],
    source: { user_identity: story.by },
  });
}
