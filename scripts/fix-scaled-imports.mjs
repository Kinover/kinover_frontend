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

const BAD =
  /import \{\nimport \{useScaledStyleSheet\} from 'hooks\/useScaledStyleSheet';\n/g;
const FIX = "import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';\nimport {\n";

let n = 0;
for (const f of walk(srcRoot)) {
  let s = fs.readFileSync(f, 'utf8');
  if (!s.includes("import {\nimport {useScaledStyleSheet}")) continue;
  s = s.replace(BAD, FIX);
  fs.writeFileSync(f, s, 'utf8');
  n++;
  console.log(f);
}
console.error('fix-scaled-imports:', n);
