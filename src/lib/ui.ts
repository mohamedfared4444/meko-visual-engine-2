import {Node, Rect, Circle, Txt, Line} from '@motion-canvas/2d';
import {Vector2, createSignal, Color, ThreadGenerator} from '@motion-canvas/core';
import {PAL} from './palette';

/**
 * Screen-space UI (not bound to the camera): title card, stage captions,
 * progress dots and the end card. All typography uses the bundled OFL
 * fonts so rendering is identical on every machine.
 */

export const FONT_DISPLAY = 'Baloo2';
export const FONT_BODY = 'Nunito';

export function makeTitleCard(): Node {
  return new Node({
    x: 540,
    y: 620,
    opacity: 0,
    children: [
      new Txt({
        text: 'HOW CHOCOLATE',
        fontFamily: FONT_DISPLAY,
        fontWeight: 800,
        fontSize: 118,
        fill: PAL.ink,
        textAlign: 'center',
      }),
      new Txt({
        text: 'IS MADE',
        fontFamily: FONT_DISPLAY,
        fontWeight: 800,
        fontSize: 118,
        fill: PAL.ink,
        y: 128,
        textAlign: 'center',
      }),
      new Rect({
        y: 210,
        width: 520,
        height: 76,
        radius: 38,
        fill: PAL.accent1,
      }),
      new Txt({
        text: 'FROM SCRATCH',
        fontFamily: FONT_BODY,
        fontWeight: 900,
        fontSize: 44,
        fill: '#FFF6E6',
        y: 210,
        textAlign: 'center',
      }),
    ],
  });
}

export function makeEndCard(): Node {
  return new Node({
    x: 540,
    y: 560,
    opacity: 0,
    children: [
      new Txt({
        text: 'FROM BEAN',
        fontFamily: FONT_DISPLAY,
        fontWeight: 800,
        fontSize: 104,
        fill: PAL.ink,
        textAlign: 'center',
      }),
      new Txt({
        text: 'TO BAR',
        fontFamily: FONT_DISPLAY,
        fontWeight: 800,
        fontSize: 104,
        fill: PAL.accent2,
        y: 112,
        textAlign: 'center',
      }),
      new Txt({
        text: 'Raw cocoa roasted, ground, conched and molded - all on one line.',
        fontFamily: FONT_BODY,
        fontWeight: 700,
        fontSize: 30,
        fill: PAL.inkSoft,
        y: 196,
        textAlign: 'center',
      }),
    ],
  });
}

export interface Caption {
  node: Node;
  label: Txt;
  setStage: (num: string, accent: string, text: string) => void;
}

/** Bottom caption pill: "01 · RAW COCOA BEANS" style stage labels. */
export function makeCaption(): Caption {
  const bg = new Rect({
    width: 640,
    height: 84,
    radius: 42,
    fill: 'rgba(64,41,27,0.86)',
  });
  const numTxt = new Txt({
    text: '01',
    fontFamily: FONT_DISPLAY,
    fontWeight: 800,
    fontSize: 40,
    fill: PAL.accent1,
    x: -258,
  });
  const label = new Txt({
    text: 'RAW COCOA BEANS',
    fontFamily: FONT_BODY,
    fontWeight: 900,
    fontSize: 34,
    fill: '#FFF6E6',
    x: 26,
  });
  const node = new Node({
    x: 540,
    y: 1770,
    opacity: 0,
    children: [bg, numTxt, label],
  });
  return {
    node,
    label,
    setStage: (num: string, accent: string, text: string) => {
      numTxt.text(num);
      numTxt.fill(new Color(accent));
      label.text(text);
    },
  };
}

export interface Progress {
  node: Node;
  setActive: (index: number) => ThreadGenerator;
}

/** Five progress dots under the top edge; active dot grows and fills. */
export function makeProgress(): Progress {
  const dots: Circle[] = [];
  const ring = createSignal(0);
  for (let i = 0; i < 5; i++) {
    dots.push(
      new Circle({
        x: (i - 2) * 64,
        width: 22,
        height: 22,
        fill: 'rgba(64,41,27,0.28)',
        stroke: 'rgba(64,41,27,0.45)',
        lineWidth: 2,
      }),
    );
  }
  const active = new Circle({
    width: 34,
    height: 34,
    fill: PAL.accent1,
    stroke: '#FFF6E6',
    lineWidth: 4,
    opacity: 0,
  });
  const node = new Node({
    x: 540,
    y: 148,
    opacity: 0,
    children: [...dots, active],
  });
  return {
    node,
    setActive: function* (index: number): ThreadGenerator {
      active.position.x((index - 2) * 64, 0.4);
      const accents = [PAL.accent1, PAL.accent2, PAL.accent3, PAL.accent4, PAL.accent5];
      active.fill(new Color(accents[index]), 0.4);
      active.opacity(1, 0.3);
      void ring;
    },
  };
}

/** Small callout pill with a leader line, used inside cutaway close-ups. */
export function makeCallout(text: string, accent: string = PAL.ink): Node {
  const label = new Txt({
    text,
    fontFamily: FONT_BODY,
    fontWeight: 800,
    fontSize: 30,
    fill: '#FFF6E6',
  });
  const pill = new Rect({
    width: label.text().length * 16 + 64,
    height: 58,
    radius: 29,
    fill: accent,
  });
  return new Node({
    opacity: 0,
    children: [
      pill,
      label,
      new Line({
        points: [new Vector2(0, 29), new Vector2(0, 86)],
        stroke: accent,
        lineWidth: 3.5,
      }),
      new Circle({y: 90, width: 14, height: 14, fill: accent}),
    ],
  });
}
