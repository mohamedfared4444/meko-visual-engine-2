/**
 * Narration compatibility hook (UNUSED in this first prototype).
 *
 * The Visual Engine 2.0 prototype renders silently. When the engine is
 * promoted, Meko's existing Edge-TTS narration and per-word timings map
 * onto this timeline through `NarrationCue`s:
 *
 *  - `startSec` / `endSec` come from the Meko word-timing JSON
 *    (the same data the current renderer consumes for karaoke captions).
 *  - `sceneTime()` in the timeline below is seconds from render start at
 *    a fixed 30 fps, so cues translate 1:1.
 *  - Future captions: draw word ranges from `words` onto screen-space UI
 *    (see ui.ts) exactly like the current engine's single-pop captions.
 *
 * Nothing here touches Meko's production pipeline; it only documents the
 * integration surface.
 */

export interface NarrationWord {
  word: string;
  startSec: number;
  endSec: number;
}

export interface NarrationCue {
  stage: 1 | 2 | 3 | 4 | 5;
  text: string;
  startSec: number;
  endSec: number;
  words?: NarrationWord[];
}

/**
 * Stage start times produced by the prototype timeline (seconds).
 * Recomputed by hand from chocolate.ts - the single source of truth for
 * scheduling narration once audio is introduced.
 */
export const STAGE_STARTS: Record<number, number> = {
  1: 4.8,
  2: 13.4,
  3: 24.8,
  4: 34.9,
  5: 43.6,
};

export const SAMPLE_CUES: NarrationCue[] = [
  {stage: 1, text: 'Raw cocoa beans arrive on the line.', startSec: 4.8, endSec: 8.5},
  {stage: 2, text: 'Beans roast slowly in a hot drum.', startSec: 13.4, endSec: 17.5},
  {stage: 3, text: 'Steel rollers crack beans into nibs.', startSec: 24.8, endSec: 28.5},
  {stage: 4, text: 'The paste is conched into smooth chocolate.', startSec: 34.9, endSec: 38.5},
  {stage: 5, text: 'Liquid chocolate fills molds and cools into bars.', startSec: 43.6, endSec: 48.0},
];
