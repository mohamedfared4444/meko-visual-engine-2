import './styles.css';

import project from './project?project';
import {Renderer, Vector2, RendererResult} from '@motion-canvas/core';
import type {Exporter, ExporterClass, Project, RendererSettings} from '@motion-canvas/core';

/**
 * Headless render harness.
 *
 * Motion Canvas 3.x has no official CLI renderer, so this page drives the
 * public `Renderer` class inside headless Chrome. A small custom exporter
 * (defined HERE, inside vite-transformed code, so `import.meta.hot` is
 * guaranteed available) streams every frame to the vite-plugin's own
 * `motion-canvas:export` websocket endpoint, which writes the JPEGs to
 * `output/`. The Node driver (scripts/render.mjs) then assembles the MP4.
 */

interface HarnessState {
  status: 'boot' | 'rendering' | 'done' | 'error';
  error?: string;
  frames?: number;
}

declare global {
  interface Window {
    __MC_RENDER_STATE: HarnessState;
  }
}

window.__MC_RENDER_STATE = {status: 'boot'};

const CONCURRENT_EXPORTS = 8;

/**
 * JPEG frame exporter speaking the vite-plugin's export protocol.
 * Mirrors @motion-canvas/core's ImageExporter, minus editor-only meta UI.
 */
class FrameExporter implements Exporter {
  public static readonly id = 've2/frames';
  public static readonly displayName = 'VE2 JPEG frames';
  private static readonly pending = new Set<number>();

  public static meta(): never {
    throw new Error('meta() is only used by the editor UI');
  }

  public static async create(_project: Project, settings: RendererSettings): Promise<Exporter> {
    const quality = ((settings.exporter.options as {quality?: number} | undefined)?.quality ?? 95) / 100;
    return new FrameExporter(quality);
  }

  private constructor(private readonly quality: number) {}

  public async start(): Promise<void> {
    const hot = import.meta.hot;
    if (hot) {
      hot.on('motion-canvas:export-ack', (response: {frame: number}) => {
        FrameExporter.pending.delete(response.frame);
      });
    }
  }

  public async handleFrame(
    canvas: HTMLCanvasElement,
    frame: number,
    _sceneFrame: number,
    _sceneName: string,
    signal: AbortSignal,
  ): Promise<void> {
    const hot = import.meta.hot;
    if (!hot) {
      throw new Error('import.meta.hot is unavailable - frames cannot be exported');
    }
    while (FrameExporter.pending.size > CONCURRENT_EXPORTS) {
      await new Promise(resolve => setTimeout(resolve, 25));
      if (signal.aborted) return;
    }
    FrameExporter.pending.add(frame);
    hot.send('motion-canvas:export', {
      frame,
      name: String(frame).padStart(6, '0'),
      data: canvas.toDataURL('image/jpeg', this.quality),
      mimeType: 'image/jpeg',
      subDirectories: ['chocolate-preview'],
    });
  }

  public async stop(): Promise<void> {
    while (FrameExporter.pending.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  }
}

// The class only has to satisfy the shape Renderer looks up at runtime.
const FrameExporterClass = FrameExporter as unknown as ExporterClass;

async function run(): Promise<void> {
  const state = window.__MC_RENDER_STATE;
  try {
    // Deterministic typography: wait until every @font-face is loaded.
    await document.fonts.load('800 60px Baloo2');
    await document.fonts.load('600 40px Baloo2');
    await document.fonts.load('900 40px "Nunito"');
    await document.fonts.load('700 40px "Nunito"');
    await document.fonts.ready;

    state.status = 'rendering';

    const renderer = new Renderer(project);
    project.meta.rendering.exporter.exporters.push(FrameExporterClass);

    let result: RendererResult | null = null;
    renderer.onFinished.subscribe(r => (result = r));

    await renderer.render({
      name: 'chocolate-preview',
      range: [0, Infinity],
      fps: 30,
      size: new Vector2(1080, 1920),
      resolutionScale: 1,
      colorSpace: 'srgb',
      background: null,
      exporter: {
        name: FrameExporter.id,
        options: {quality: 95},
      },
    } as Parameters<Renderer['render']>[0]);

    if (result === RendererResult.Success) {
      state.status = 'done';
    } else {
      state.status = 'error';
      state.error = `Renderer finished with result ${result}`;
    }
  } catch (err) {
    state.status = 'error';
    state.error = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack ?? ''}` : String(err);
  }
}

void run();
