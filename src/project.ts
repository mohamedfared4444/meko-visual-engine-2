import {makeProject} from '@motion-canvas/core';

import chocolate from './scenes/chocolate?scene';

/**
 * Meko Visual Engine 2.0 - prototype project.
 *
 * 1080x1920 @ 30fps, deterministic, silent. Audio/word-timing integration
 * surface is documented in lib/narration.ts.
 */
export default makeProject({
  scenes: [chocolate],
});
