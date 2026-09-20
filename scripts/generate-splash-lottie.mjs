import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'assets', 'alva-splash-reveal.json');
const WIDTH = 1080;
const HEIGHT = 1920;
const CENTER = [WIDTH / 2, HEIGHT / 2, 0];

function svgPaths(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  return [...source.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].flatMap((match) => parsePath(match[1]));
}

function parsePath(source) {
  const tokens = [...source.matchAll(/[A-Za-z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)]
    .map((match) => /[A-Za-z]/.test(match[0]) ? match[0] : Number(match[0]));
  const paths = [];
  let index = 0;
  let command = '';
  let current = [0, 0];
  let shape = null;

  const number = () => {
    const value = tokens[index++];
    if (typeof value !== 'number') throw new Error(`Expected a number in SVG path: ${source}`);
    return value;
  };
  const point = () => [number(), number()];
  const addVertex = (vertex, incoming = [0, 0]) => {
    shape.v.push(vertex);
    shape.i.push(incoming);
    shape.o.push([0, 0]);
    current = vertex;
  };
  const close = () => {
    if (!shape) return;
    const first = shape.v[0];
    const last = shape.v.at(-1);
    if (shape.v.length > 1 && first[0] === last[0] && first[1] === last[1]) {
      shape.i[0] = shape.i.at(-1);
      shape.v.pop();
      shape.i.pop();
      shape.o.pop();
    }
    shape.c = true;
    paths.push(shape);
    current = first;
    shape = null;
  };

  while (index < tokens.length) {
    if (typeof tokens[index] === 'string') command = tokens[index++];
    if (!command) throw new Error(`Missing SVG path command: ${source}`);
    if (command !== command.toUpperCase()) throw new Error(`Relative SVG commands are unsupported: ${command}`);

    if (command === 'M') {
      if (shape) close();
      const vertex = point();
      shape = { c: false, v: [], i: [], o: [] };
      addVertex(vertex);
      command = 'L';
    } else if (command === 'L') {
      addVertex(point());
    } else if (command === 'H') {
      addVertex([number(), current[1]]);
    } else if (command === 'V') {
      addVertex([current[0], number()]);
    } else if (command === 'C') {
      if (!shape) throw new Error('Cubic segment before move command');
      const controlOut = point();
      const controlIn = point();
      const vertex = point();
      shape.o[shape.o.length - 1] = [controlOut[0] - current[0], controlOut[1] - current[1]];
      addVertex(vertex, [controlIn[0] - vertex[0], controlIn[1] - vertex[1]]);
    } else if (command === 'Z') {
      close();
      command = '';
    } else {
      throw new Error(`Unsupported SVG path command: ${command}`);
    }
  }
  if (shape) close();
  return paths;
}

const value = (k) => ({ a: 0, k });
const ease = (x1, y1, x2, y2, dimensions = 3) => ({
  o: { x: Array(dimensions).fill(x1), y: Array(dimensions).fill(y1) },
  i: { x: Array(dimensions).fill(x2), y: Array(dimensions).fill(y2) },
});
const scaleFrames = [
  { t: 0, s: [100, 100, 100], e: [88, 88, 100], ...ease(.42, 0, .58, 1) },
  { t: 2, s: [88, 88, 100], e: [104, 104, 100], ...ease(.2, 0, .4, 1) },
  { t: 3, s: [104, 104, 100], e: [42000, 42000, 100], ...ease(.55, 0, .85, .2) },
  { t: 10, s: [42000, 42000, 100] },
];

function transform({ position = [0, 0], scale = [100, 100] } = {}) {
  return {
    ty: 'tr',
    p: value(position),
    a: value([0, 0]),
    s: value(scale),
    r: value(0),
    o: value(100),
    sk: value(0),
    sa: value(0),
  };
}

function vectorGroup(name, paths, position, scale) {
  return {
    ty: 'gr',
    nm: name,
    it: [
      ...paths.map((shape, index) => ({
        ty: 'sh',
        nm: `${name} path ${index + 1}`,
        d: 1,
        ks: value(shape),
      })),
      { ty: 'fl', nm: `${name} fill`, c: value([1, 1, 1]), o: value(100), r: 2 },
      transform({ position, scale }),
    ],
  };
}

function logoShapes() {
  const symbolWidth = 115;
  const wordWidth = 327;
  const gap = 18;
  const totalWidth = symbolWidth + gap + wordWidth;
  const symbolScale = symbolWidth / 15.7988 * 100;
  const wordScale = wordWidth / 45.04 * 100;
  return [
    vectorGroup('Alva symbol', svgPaths('assets/wordmark-symbol.svg'),
      [WIDTH / 2 - totalWidth / 2, HEIGHT / 2 - 15.6708 * symbolScale / 200],
      [symbolScale, symbolScale]),
    vectorGroup('Alva wordmark', svgPaths('assets/wordmark-text.svg'),
      [WIDTH / 2 - totalWidth / 2 + symbolWidth + gap, HEIGHT / 2 - 16 * wordScale / 200],
      [wordScale, wordScale]),
  ];
}

function layerTransform(opacity) {
  return {
    a: value(CENTER),
    p: value(CENTER),
    s: { a: 1, k: scaleFrames },
    r: value(0),
    o: opacity,
  };
}

const animation = {
  nm: 'Alva Splash Reveal',
  v: '5.7.0',
  ddd: 0,
  h: HEIGHT,
  w: WIDTH,
  fr: 30,
  ip: 0,
  op: 11,
  meta: {
    g: 'Alva Design / Codex',
    a: 'Alva',
    d: 'No-hold logo anticipation and accelerated negative-space reveal',
    tc: '#49A3A6',
  },
  assets: [],
  markers: [
    { tm: 0, cm: 'start', dr: 0 },
    { tm: 2, cm: 'reveal', dr: 0 },
    { tm: 10, cm: 'complete', dr: 1 },
  ],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'White logo',
      sr: 1,
      st: 0,
      ip: 0,
      op: 11,
      ao: 0,
      ks: layerTransform({
        a: 1,
        k: [
          { t: 0, s: [100], e: [100], ...ease(.42, 0, .58, 1, 1) },
          { t: 2.5, s: [100], e: [0], ...ease(.4, 0, .7, 1, 1) },
          { t: 4.5, s: [0] },
        ],
      }),
      shapes: logoShapes(),
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Logo aperture matte',
      sr: 1,
      st: 0,
      ip: 0,
      op: 11,
      ao: 0,
      td: 1,
      ks: layerTransform(value(100)),
      shapes: logoShapes(),
    },
    {
      ddd: 0,
      ind: 3,
      ty: 1,
      nm: 'Brand overlay',
      sr: 1,
      st: 0,
      ip: 0,
      op: 11,
      ao: 0,
      tt: 2,
      sc: '#49A3A6',
      sw: WIDTH,
      sh: HEIGHT,
      ks: {
        a: value(CENTER),
        p: value(CENTER),
        s: value([100, 100, 100]),
        r: value(0),
        o: {
          a: 1,
          k: [
            { t: 0, s: [100], e: [100], ...ease(.42, 0, .58, 1, 1) },
            { t: 4.5, s: [100], e: [0], ...ease(.33, .33, .67, .67, 1) },
            { t: 8.8, s: [0] },
          ],
        },
      },
    },
  ],
};

fs.writeFileSync(output, `${JSON.stringify(animation)}\n`);
console.log(`Wrote ${path.relative(root, output)}`);
