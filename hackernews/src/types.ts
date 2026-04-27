import { z } from "zod";

export const hackernewsConfigSchema = z.object({
  /** How many top stories to watch (default: 10). */
  top_n: z.coerce.number().positive().default(10),
  /** Polling interval in seconds (default: 300 = 5 minutes). */
  interval_seconds: z.coerce.number().positive().default(300),
  /** Minimum HN score to emit a signal (default: 20). */
  min_score: z.coerce.number().nonnegative().default(20),
  /** Minimum comment count to emit a signal (default: 0). */
  min_comments: z.coerce.number().nonnegative().default(0),
});

export type HackernewsConfig = z.infer<typeof hackernewsConfigSchema>;

export interface HNStory {
  id: number;
  title: string;
  url?: string;
  text?: string;
  by: string;
  score: number;
  descendants: number;
  time: number;
}
