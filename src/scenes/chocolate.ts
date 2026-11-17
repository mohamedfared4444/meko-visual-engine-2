import {makeScene2D, Node, Rect, Gradient} from '@motion-canvas/2d';
import {
  Vector2,
  all,
  waitFor,
  spawn,
  linear,
  easeInOutCubic,
  easeInCubic,
  easeOutCubic,
  easeOutBack,
  useTime,
  ThreadGenerator,
} from '@motion-canvas/core';
import {PAL} from '../lib/palette';
import {WORLD} from '../lib/world';
import {CameraRig} from '../lib/camera';
import {makeBean, makeBar, makeDollop, travelWobble} from '../lib/beans';
import {makeBackground, makeFloor} from '../lib/machines/background';
import {makeConveyor} from '../lib/machines/conveyor';
import {makeRoaster} from '../lib/machines/roaster';
import {makeGrinder} from '../lib/machines/grinder';
import {makeConche} from '../lib/machines/conche';
import {
  makeDepositor,
  makeDepositorGantry,
  makeChocolatePipe,
  makeCoolingTunnel,
  makeMold,
  type Mold,
} from '../lib/machines/molder';
import {
  makeTitleCard,
  makeEndCard,
  makeCaption,
  makeProgress,
  makeCallout,
} from '../lib/ui';

/** Wait until an absolute scene time (seconds). */
function* at(t: number): ThreadGenerator {
  const delta = t - useTime();
  if (delta > 0) yield* waitFor(delta);
}

/** Deterministic horizontal drift for nib particles. */
function nibDrift(i: number): number {
  return [-26, -12, 0, 12, 26][i % 5];
}

/**
 * "HOW CHOCOLATE IS MADE FROM SCRATCH"
 *
 * Five connected production stages on a single continuous line:
 *   1. raw cocoa beans ride the intake conveyor
 *   2. beans enter the roasting drum (porthole cutaway)
 *   3. steel rollers crack roasted beans into paste (window cutaway,
 *      close-up transformation shot)
 *   4. paste is conched into smooth liquid chocolate
 *   5. liquid chocolate fills molds, cools in the tunnel, bars stack up
 *
 * Total: ~60s @ 30fps (~1800 frames), silent (see lib/narration.ts).
 */
export default makeScene2D(function* (view): ThreadGenerator {
  // ------------------------------------------------------------------
  // Layers + camera
  //
  // Motion Canvas 2D puts the view origin at the CANVAS CENTER. Every
  // layer therefore wraps its world-space children in an inner node
  // offset by (-540, -960); screen-space UI does the same for itself.
  // ------------------------------------------------------------------
  const rig = new CameraRig();
  const worldLayer = (): {layer: Node; inner: Node} => {
    const layer = new Node({});
    const inner = new Node({position: new Vector2(-WORLD.centerX, -WORLD.centerY)});
    layer.add(inner);
    return {layer, inner};
  };
  const bgL = worldLayer();
  const mainL = worldLayer();
  const fgL = worldLayer();
  const screenUI = new Node({position: new Vector2(-WORLD.centerX, -WORLD.centerY)});
  view.add(bgL.layer);
  view.add(mainL.layer);
  view.add(fgL.layer);
  view.add(screenUI);

  rig.bind({node: bgL.layer, factor: 0.55});
  rig.bind({node: mainL.layer, factor: 1});
  rig.bind({node: fgL.layer, factor: 1.15});

  // Opening framing: wide view of the whole line.
  rig.cx(1420);
  rig.cy(930);
  rig.zoom(0.4);

  bgL.inner.add(makeBackground());
  mainL.inner.add(makeFloor());

  // ------------------------------------------------------------------
  // Machines
  // ------------------------------------------------------------------
  const belt1 = makeConveyor(740, 985, 290); // x -80 .. 660
  const roaster = makeRoaster(WORLD.stage2, WORLD.floorY);
  const belt2 = makeConveyor(250, 1000, 1075); // x 950 .. 1200
  const grinder = makeGrinder(WORLD.stage3, WORLD.floorY);
  const conche = makeConche(WORLD.stage4, WORLD.floorY);
  const pipe = makeChocolatePipe();
  const gantry = makeDepositorGantry(2260, WORLD.floorY, 590);
  const depositor = makeDepositor(2260, 590);
  const belt3 = makeConveyor(560, 1010, 2540); // x 2260 .. 2820
  const tunnel = makeCoolingTunnel(2660, WORLD.floorY);

  mainL.inner.add(belt1.node);
  mainL.inner.add(roaster.node);
  mainL.inner.add(belt2.node);
  mainL.inner.add(grinder.node);
  mainL.inner.add(conche.node);
  mainL.inner.add(pipe);
  mainL.inner.add(gantry);
  mainL.inner.add(depositor);
  mainL.inner.add(belt3.node);
  mainL.inner.add(tunnel);

  // ------------------------------------------------------------------
  // Screen-space UI
  // ------------------------------------------------------------------
  const vignette = new Rect({
    width: WORLD.width,
    height: WORLD.height,
    fill: new Gradient({
      type: 'radial',
      from: {x: 0, y: 0},
      to: {x: 0, y: 0},
      fromRadius: 420,
      toRadius: 1180,
      stops: [
        {offset: 0, color: 'rgba(64,41,27,0)'},
        {offset: 1, color: 'rgba(64,41,27,0.20)'},
      ],
    }),
  });
  view.add(vignette);
  const title = makeTitleCard();
  const endCard = makeEndCard();
  const caption = makeCaption();
  const progress = makeProgress();
  const calloutRoaster = makeCallout('ROASTING DRUM', PAL.accent2);
  calloutRoaster.position(new Vector2(WORLD.stage2, 660));
  const calloutGrinder = makeCallout('STEEL ROLLERS', PAL.accent3);
  calloutGrinder.position(new Vector2(WORLD.stage3, 610));
  const calloutConche = makeCallout('CONCHING TANK', PAL.accent4);
  calloutConche.position(new Vector2(WORLD.stage4, 660));

  mainL.inner.add(calloutRoaster);
  mainL.inner.add(calloutGrinder);
  mainL.inner.add(calloutConche);
  screenUI.add(title);
  screenUI.add(endCard);
  screenUI.add(caption.node);
  screenUI.add(progress.node);

  // ------------------------------------------------------------------
  // Stage 1 props: raw beans on the intake conveyor
  // ------------------------------------------------------------------
  interface FeedBean {
    node: Node;
    startX: number;
  }
  const feedBeans: FeedBean[] = [];
  for (let i = 0; i < 6; i++) {
    const startX = 10 + i * 108;
    const bean = makeBean(0, 0, 1);
    bean.position(new Vector2(startX, 973));
    mainL.inner.add(bean);
    feedBeans.push({node: bean, startX});
  }

  // ------------------------------------------------------------------
  // Stage 2 props: roasted beans leaving the roaster onto belt 2
  // ------------------------------------------------------------------
  const roastBeans: Node[] = [];
  for (let i = 0; i < 3; i++) {
    const bean = makeBean(1, 0, 0.94);
    bean.position(new Vector2(955, 988));
    bean.opacity(0);
    mainL.inner.add(bean);
    roastBeans.push(bean);
  }

  // ------------------------------------------------------------------
  // Stage 3 props: nib bursts between the rollers
  // ------------------------------------------------------------------
  const bursts: Node[][] = [];
  for (let b = 0; b < 3; b++) {
    const group = new Node({
      position: new Vector2(1350, 905),
      opacity: () => Math.min(1, Math.max(0, (0.92 - grinder.pasteLevel()) * 3)),
    });
    const nibs: Node[] = [];
    const offsets = [-58, -28, 0, 30, 58];
    for (let i = 0; i < offsets.length; i++) {
      const nib = makeBean(1, 20 + i * 17, 0.34);
      nib.position(new Vector2(offsets[i] * 0.2, -30 - (i % 2) * 8));
      group.add(nib);
      nibs.push(nib);
    }
    mainL.inner.add(group);
    bursts.push(nibs);
  }

  // Paste pulses travelling through the two pipes
  const pastePulse = makeDollop(10);
  pastePulse.opacity(0);
  mainL.inner.add(pastePulse);
  const pumpPulse = makeDollop(10);
  pumpPulse.opacity(0);
  mainL.inner.add(pumpPulse);

  // ------------------------------------------------------------------
  // Stage 5 props: molds, dollops, finished bars
  // ------------------------------------------------------------------
  const moldSpeed = 90; // world px/s
  const moldT0 = 43.6; // molds start moving
  const moldStarts = [2140, 2000, 1860];
  const molds: Mold[] = [];
  for (const sx of moldStarts) {
    const mold = makeMold();
    mold.node.position(new Vector2(sx, 978));
    mainL.inner.add(mold.node);
    molds.push(mold);
  }
  const moldEnds = moldStarts.map(sx => moldT0 + (2810 - sx) / moldSpeed);

  const dollops: Node[] = [];
  for (let i = 0; i < 3; i++) {
    const d = makeDollop(16);
    d.opacity(0);
    d.position.x(() => molds[i].node.position.x());
    d.position.y(742);
    mainL.inner.add(d);
    dollops.push(d);
  }

  const bars: Node[] = [];
  for (let i = 0; i < 3; i++) {
    const bar = makeBar(160, 48, 1);
    bar.position(new Vector2(2810, 978));
    bar.opacity(0);
    mainL.inner.add(bar);
    bars.push(bar);
  }
  const slots: Array<[number, number]> = [
    [2850, 1156],
    [2900, 1156],
    [2875, 1110],
  ];

  // ------------------------------------------------------------------
  // 0.0 - 3.0  Title over the wide production line
  // ------------------------------------------------------------------
  yield* title.opacity(1, 0.5, easeOutCubic);
  yield* title.y(620, 2.0, easeInOutCubic);
  yield* title.opacity(0, 0.5, easeInCubic);

  // ------------------------------------------------------------------
  // 3.0 - 4.8  Push into stage 1
  // ------------------------------------------------------------------
  yield* rig.flyTo(380, 1010, 1.02, 1.8, easeInOutCubic);

  // ------------------------------------------------------------------
  // 4.8 - 13.2  Stage 1: continuous conveyor ride
  // ------------------------------------------------------------------
  caption.setStage('01', PAL.accent1, 'RAW COCOA BEANS');
  yield* all(caption.node.opacity(1, 0.35), progress.node.opacity(1, 0.35));
  yield* progress.setActive(0);

  const belt1Speed = 64; // world px/s
  // Beans ride the belt and enter the roaster mouth one after another.
  for (const fb of feedBeans) {
    spawn(function* (): ThreadGenerator {
      yield* travelWobble(fb.node, fb.startX, 655, (655 - fb.startX) / belt1Speed, 973, 4);
      yield* all(fb.node.opacity(0, 0.28, easeInCubic), fb.node.position.x(676, 0.28, easeInCubic));
    });
  }
  yield* belt1.drive(belt1Speed * 8.05, 8.05, linear);
  yield* at(13.4);

  // ------------------------------------------------------------------
  // 13.4 - 24.8  Stage 2: roasting (cutaway close-up)
  // ------------------------------------------------------------------
  yield* caption.node.opacity(0, 0.22);
  caption.setStage('02', PAL.accent2, 'ROASTING DRUM');
  yield* all(caption.node.opacity(1, 0.22), progress.setActive(1));
  yield* rig.flyTo(WORLD.stage2, 940, 1.12, 1.0, easeInOutCubic);

  yield* all(roaster.heat(1, 1.4, easeInOutCubic), roaster.spin(960, 3, linear));
  yield* roaster.cutaway(1, 0.8, easeInOutCubic);
  yield* calloutRoaster.opacity(1, 0.35);
  spawn(function* (): ThreadGenerator {
    yield* at(18.4);
    yield* roaster.spin(2400, 6.5, linear);
  });

  // Close-up on the porthole: beans slowly darken as they roast.
  yield* rig.flyTo(roaster.windowX, roaster.windowY, 1.55, 1.0, easeInOutCubic);
  yield* roaster.roast(1, 3.4, easeInOutCubic);

  yield* all(calloutRoaster.opacity(0, 0.35), rig.flyTo(905, 985, 1.05, 0.9, easeInOutCubic));
  yield* roaster.cutaway(0.3, 0.5, easeInOutCubic);

  // Roasted beans exit the chute onto belt 2 and roll to the grinder.
  spawn(function* (): ThreadGenerator {
    yield* belt2.drive(240, 3.4, linear);
  });
  for (let i = 0; i < roastBeans.length; i++) {
    spawn(function* (): ThreadGenerator {
      yield* at(22.9 + i * 0.6);
      yield* all(roastBeans[i].opacity(1, 0.3), roastBeans[i].position.x(975, 0.3, easeOutCubic));
      yield* travelWobble(roastBeans[i], 975, 1185, 3.0, 988, 4);
      yield* all(roastBeans[i].opacity(0, 0.25, easeInCubic), roastBeans[i].position.x(1200, 0.25, easeInCubic));
    });
  }
  yield* at(24.8);

  // ------------------------------------------------------------------
  // 24.8 - 34.9  Stage 3: grinding (close-up transformation)
  // ------------------------------------------------------------------
  yield* caption.node.opacity(0, 0.22);
  caption.setStage('03', PAL.accent3, 'GRINDING INTO COCOA PASTE');
  yield* all(caption.node.opacity(1, 0.22), progress.setActive(2));
  yield* rig.flyTo(WORLD.stage3, 950, 1.12, 1.0, easeInOutCubic);

  spawn(function* (): ThreadGenerator {
    yield* grinder.spin(1920, 10, linear);
  });
  yield* grinder.cutaway(1, 1.0, easeInOutCubic);
  yield* calloutGrinder.opacity(1, 0.35);
  yield* rig.flyTo(grinder.windowX, grinder.windowY + 10, 1.75, 1.0, easeInOutCubic);

  // Beans crack between the rollers; nibs fall into the trough.
  const crackTimes = [27.6, 29.0, 30.4];
  for (let b = 0; b < bursts.length; b++) {
    spawn(function* (): ThreadGenerator {
      yield* at(crackTimes[b]);
      for (let i = 0; i < bursts[b].length; i++) {
        spawn(function* (): ThreadGenerator {
          yield* waitFor(i * 0.07);
          const nib = bursts[b][i];
          yield* all(
            nib.position.x(nib.position.x() + nibDrift(i), 0.55, easeOutCubic),
            nib.position.y(84 + (i % 3) * 6, 0.55, easeOutCubic),
            nib.rotation(nib.rotation() + 90, 0.55, easeOutCubic),
          );
        });
      }
    });
  }
  yield* grinder.pasteLevel(0.12, 1.2, easeInOutCubic);
  yield* at(31.0);
  yield* grinder.pasteLevel(1, 4.0, easeInOutCubic);
  yield* all(calloutGrinder.opacity(0, 0.35), rig.flyTo(1400, 990, 1.15, 1.0, easeInOutCubic));

  // Paste pulse travels the pipe up into the conche.
  spawn(function* (): ThreadGenerator {
    yield* at(33.6);
    pastePulse.position(new Vector2(1524, 1100));
    yield* pastePulse.opacity(1, 0.15);
    yield* pastePulse.position.y(742, 0.8, easeInOutCubic);
    yield* pastePulse.position.x(1830, 1.0, easeInOutCubic);
    yield* all(pastePulse.position.y(792, 0.25, easeInCubic), pastePulse.opacity(0, 0.25));
  });
  yield* at(34.9);

  // ------------------------------------------------------------------
  // 34.9 - 42.2  Stage 4: conching into liquid chocolate
  // ------------------------------------------------------------------
  yield* caption.node.opacity(0, 0.22);
  caption.setStage('04', PAL.accent4, 'SMOOTH LIQUID CHOCOLATE');
  yield* all(caption.node.opacity(1, 0.22), progress.setActive(3));
  yield* rig.flyTo(WORLD.stage4, 960, 1.12, 1.0, easeInOutCubic);

  spawn(function* (): ThreadGenerator {
    yield* all(conche.level(0.75, 4.5, easeInOutCubic), conche.spin(1680, 7.3, linear));
  });
  yield* calloutConche.opacity(1, 0.35);
  yield* all(conche.smooth(1, 4.4, easeInOutCubic), rig.flyTo(WORLD.stage4, 940, 1.3, 2.2, easeInOutCubic));
  yield* all(calloutConche.opacity(0, 0.35), rig.flyTo(2100, 1000, 1.0, 1.0, easeInOutCubic));
  yield* at(42.2);

  // ------------------------------------------------------------------
  // 42.2 - 43.6  Pump liquid chocolate up to the depositor
  // ------------------------------------------------------------------
  yield* caption.node.opacity(0, 0.22);
  caption.setStage('05', PAL.accent5, 'MOLDING & COOLING');
  yield* all(caption.node.opacity(1, 0.22), progress.setActive(4));

  spawn(function* (): ThreadGenerator {
    yield* at(43.0);
    pumpPulse.position(new Vector2(2086, 1070));
    yield* pumpPulse.opacity(1, 0.15);
    yield* pumpPulse.position.x(2288, 0.5, easeInOutCubic);
    yield* pumpPulse.position.y(660, 0.6, easeInOutCubic);
    yield* pumpPulse.opacity(0, 0.15);
  });
  yield* at(43.6);

  // ------------------------------------------------------------------
  // 43.6 - 52.9  Stage 5: molding, cooling, demolding
  // ------------------------------------------------------------------
  yield* rig.flyTo(2350, 990, 1.12, 1.0, easeInOutCubic);

  spawn(function* (): ThreadGenerator {
    yield* belt3.drive(moldSpeed * 11, 11, linear);
  });
  for (let i = 0; i < molds.length; i++) {
    spawn(function* (): ThreadGenerator {
      yield* molds[i].node.position.x(2810, (2810 - moldStarts[i]) / moldSpeed, linear);
    });
  }

  // Dollops drop when each mold passes under the nozzle; x tracks the mold.
  const dollopTimes = [45.0, 46.6, 48.2];
  for (let i = 0; i < dollops.length; i++) {
    spawn(function* (): ThreadGenerator {
      yield* at(dollopTimes[i]);
      yield* dollops[i].opacity(1, 0.15);
      yield* dollops[i].position.y(950, 0.45, easeInCubic);
      yield* all(dollops[i].opacity(0, 0.18), molds[i].fill(1, 0.45, easeOutCubic));
    });
  }

  // Demolding: the bar lifts out of the mold and hops onto the stack.
  for (let i = 0; i < bars.length; i++) {
    spawn(function* (): ThreadGenerator {
      yield* at(moldEnds[i] + 0.15);
      const bar = bars[i];
      bar.position(new Vector2(2810, 978));
      yield* all(bar.opacity(1, 0.2), molds[i].fill(0, 0.3, easeInCubic));
      yield* bar.position.y(946, 0.4, easeOutCubic);
      yield* bar.position.x(slots[i][0], 0.55, easeInOutCubic);
      yield* bar.position.y(slots[i][1], 0.55, easeOutBack);
    });
  }

  // Slow tracking pan along the molding line.
  spawn(function* (): ThreadGenerator {
    yield* at(47.0);
    yield* rig.cx(2700, 4.4, easeInOutCubic);
    yield* rig.zoomTo(1.0, 0.8, easeInOutCubic);
  });
  yield* at(52.9);

  // ------------------------------------------------------------------
  // 52.9 - 60.4  Final wide shot: the whole production process
  // ------------------------------------------------------------------
  yield* all(caption.node.opacity(0, 0.3), progress.node.opacity(0, 0.6));
  yield* rig.flyTo(1420, 900, 0.35, 2.4, easeInOutCubic);

  // Finished-product display (screen space).
  const showcaseSpecs: Array<[number, number, number]> = [
    [330, 1616, -5],
    [540, 1598, 0],
    [750, 1616, 5],
  ];
  for (let i = 0; i < showcaseSpecs.length; i++) {
    const [sx, sy, rot] = showcaseSpecs[i];
    const bar = makeBar(230, 130, 1);
    bar.position(new Vector2(sx, sy + 130));
    bar.rotation(rot);
    bar.opacity(0);
    screenUI.add(bar);
    spawn(function* (): ThreadGenerator {
      yield* at(55.4 + i * 0.45);
      yield* all(
        bar.opacity(1, 0.5, easeOutCubic),
        bar.position.y(sy, 0.6, easeOutCubic),
      );
    });
  }

  yield* at(57.2);
  yield* endCard.opacity(1, 0.6, easeOutCubic);
  yield* waitFor(2.8);
});
