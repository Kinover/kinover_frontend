/**
 * 파일 끝의 `const styles = StyleSheet.create({ ... });` 를
 * 컴포넌트 내부 `useScaledStyleSheet(rf => ({ ... }))` 로 옮깁니다.
 * (getResponsiveFontSize / 스타일 토큰 호출이 박혀 있던 고정 스타일 갱신)
 */
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, '..', 'src');

const SKIP_NAMES = new Set(['AppText.jsx', 'useScaledStyleSheet.js']);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.jsx')) out.push(p);
  }
  return out;
}

function extractTrailingStylesCreate(source) {
  const needle = 'const styles = StyleSheet.create(';
  const idx = source.lastIndexOf(needle);
  if (idx === -1) return null;

  let i = idx + needle.length;
  while (/\s/.test(source[i])) i++;
  if (source[i] !== '{') return null;

  let depth = 1;
  i++;
  const start = i;
  while (i < source.length && depth > 0) {
    const c = source[i];
    if (c === "'" || c === '"') {
      const q = c;
      i++;
      while (i < source.length) {
        if (source[i] === '\\') {
          i += 2;
          continue;
        }
        if (source[i] === q) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') depth--;
    i++;
  }
  if (depth !== 0) return null;
  const innerEnd = i - 1;
  const inner = source.slice(start, innerEnd);

  let j = i;
  while (/\s/.test(source[j])) j++;
  if (source[j] !== ')' || source[j + 1] !== ';') return null;
  let end = j + 2;
  while (/\s/.test(source[end])) end++;

  return {startIdx: idx, endIdx: end, inner};
}

function needsDynamic(inner) {
  return (
    /getResponsiveFontSize\s*\(/.test(inner) ||
    /EMPTY_STYLE\s*\(/.test(inner) ||
    /SETTING_STYLES\s*\(/.test(inner) ||
    /HEADER_STYLES\s*\(/.test(inner) ||
    /BOTTOMSHEET_STYLE\s*\(/.test(inner) ||
    /DEFAULT_STYLE\s*\(/.test(inner) ||
    /CHATROOM_STYLE\s*\(/.test(inner) ||
    /BUTTON_STYLES\s*\(/.test(inner) ||
    /BACKGROUND_COLORS\s*\(/.test(inner) ||
    /LAYOUT_STYLE\s*\(/.test(inner)
  );
}

function transformInner(inner) {
  return inner.replace(/getResponsiveFontSize\s*\(/g, 'rf(');
}

function findHookInsertIndex(source) {
  const re = /export default function \w+\([\s\S]*?\)\s*\{\s*\n/;
  const m = re.exec(source);
  if (m) return m.index + m[0].length;
  return null;
}

function ensureImport(source, line) {
  if (source.includes(line.trim())) return source;
  const lines = source.split('\n');
  let i = 0;
  while (
    i < lines.length &&
    (lines[i].trim().startsWith('//') ||
      lines[i].trim().startsWith('/*') ||
      lines[i].trim() === '')
  ) {
    i++;
  }
  let lastImport = -1;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t.startsWith('import ')) {
      lastImport = i;
      i++;
      continue;
    }
    if (t === '' && lastImport >= 0) {
      i++;
      continue;
    }
    break;
  }
  if (lastImport < 0) return source + '\n' + line;
  lines.splice(lastImport + 1, 0, line);
  return lines.join('\n');
}

function processFile(filePath) {
  const base = path.basename(filePath);
  if (SKIP_NAMES.has(base)) return false;

  let s = fs.readFileSync(filePath, 'utf8');
  if (s.includes('useScaledStyleSheet(')) return false;

  const ext = extractTrailingStylesCreate(s);
  if (!ext) return false;
  if (!needsDynamic(ext.inner)) return false;

  const head = s.slice(0, ext.startIdx);
  const insertAt = findHookInsertIndex(head);
  if (insertAt == null) {
    console.error('SKIP insert', filePath);
    return false;
  }

  const inner2 = transformInner(ext.inner);
  const indent = '  ';
  const hook = `${indent}const styles = useScaledStyleSheet(rf => ({\n${inner2}\n${indent}}));\n`;

  let next =
    s.slice(0, insertAt) + hook + s.slice(insertAt, ext.startIdx) + s.slice(ext.endIdx);

  next = ensureImport(
    next,
    "import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';",
  );

  fs.writeFileSync(filePath, next, 'utf8');
  return true;
}

let n = 0;
for (const f of walk(srcRoot)) {
  try {
    if (processFile(f)) {
      n++;
      console.log(f);
    }
  } catch (e) {
    console.error('ERR', f, e.message);
  }
}
console.error('promote-trailing-styles:', n, 'files');
