import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, '..', 'src');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.jsx')) out.push(p);
  }
  return out;
}

const APP = "import AppText from 'components/AppText';";

function fix(content) {
  let s = content;

  const replacers = [
    [
      /import React, \{\nimport AppText from 'components\/AppText';\n/g,
      `${APP}\nimport React, {\n`,
    ],
    [
      /import Animated, \{\nimport AppText from 'components\/AppText';\n/g,
      `${APP}\nimport Animated, {\n`,
    ],
    [
      /import DateTimePicker, \{\nimport AppText from 'components\/AppText';\n/g,
      `${APP}\nimport DateTimePicker, {\n`,
    ],
    [
      /import \{\nimport AppText from 'components\/AppText';\n/g,
      `${APP}\nimport {\n`,
    ],
  ];

  for (const [from, to] of replacers) {
    if (from.test(s)) {
      s = s.replace(from, to);
      break;
    }
  }

  // 연속 중복 AppText import 한 줄만 유지
  const dup = new RegExp(
    `(${APP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n){2,}`,
    'g',
  );
  s = s.replace(dup, `${APP}\n`);

  return s;
}

let n = 0;
for (const f of walk(srcRoot)) {
  const c = fs.readFileSync(f, 'utf8');
  const nc = fix(c);
  if (nc !== c) {
    fs.writeFileSync(f, nc, 'utf8');
    n++;
    console.log(f);
  }
}
console.error('fix-apptext-imports:', n, 'files');
