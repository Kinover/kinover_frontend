/**
 * <Text> → <AppText>, react-native에서 Text import 제거, AppText import 추가
 * TextInput은 보존
 */
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

function addAppTextImport(content) {
  if (/from ['"]components\/AppText['"]/.test(content)) return content;
  const lines = content.split('\n');
  let lastImportLine = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('import ')) lastImportLine = i;
    else if (trimmed !== '' && !trimmed.startsWith('//') && lastImportLine >= 0) {
      break;
    }
  }
  if (lastImportLine < 0) return content;
  lines.splice(lastImportLine + 1, 0, "import AppText from 'components/AppText';");
  return lines.join('\n');
}

function stripTextFromRNImports(content) {
  return content.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"]react-native['"]/gs,
    (full, body) => {
      const items = body
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .filter(part => {
          const base = part.split(/\s+as\s+/)[0].trim();
          return base !== 'Text';
        });
      if (items.length === 0) {
        return '';
      }
      return `import { ${items.join(', ')} } from 'react-native'`;
    },
  );
}

function transformJsx(s) {
  return s
    .replace(/<TextInput/g, '\uE000TEXTINPUT\uE000')
    .replace(/<Text(\s|>|\n)/g, '<AppText$1')
    .replace(/<\/Text>/g, '</AppText>')
    .replace(/\uE000TEXTINPUT\uE000/g, '<TextInput');
}

function processFile(filePath) {
  if (filePath.endsWith(`${path.sep}AppText.jsx`)) return false;
  let s = fs.readFileSync(filePath, 'utf8');
  const orig = s;

  const hasTextJsx =
    /<Text(\s|>|\n)/.test(s) || /<Text>/.test(s) || /<\/Text>/.test(s);
  if (!hasTextJsx) return false;

  s = transformJsx(s);
  if (s === orig) return false;

  s = stripTextFromRNImports(s);
  s = s.replace(/\n{3,}/g, '\n\n');
  s = addAppTextImport(s);

  fs.writeFileSync(filePath, s, 'utf8');
  return true;
}

const files = walk(srcRoot);
let n = 0;
for (const f of files) {
  if (processFile(f)) {
    n++;
    console.log(f);
  }
}
console.error('bulk-apptext: updated', n, 'files');
