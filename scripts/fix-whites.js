const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const exts = ['.js', '.jsx', '.ts', '.tsx'];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (file === 'node_modules' || file === 'android' || file === 'ios' || file === '.git') return;
      results = results.concat(walk(full));
    } else {
      if (exts.includes(path.extname(full))) results.push(full);
    }
  });
  return results;
}

const files = walk(root);
let changed = 0;
files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  let original = code;

  // Replacements
  code = code.replace(/backgroundColor:\s*'white'/g, "backgroundColor: colors.card");
  code = code.replace(/backgroundColor:\s*\"white\"/g, 'backgroundColor: colors.card');
  code = code.replace(/color:\s*'white'/g, 'color: colors.white');
  code = code.replace(/color:\s*\"white\"/g, 'color: colors.white');
  code = code.replace(/getContrastingTextColor\(\s*'white'\s*\)/g, 'colors.text');
  code = code.replace(/getContrastingTextColor\(\s*\"white\"\s*\)/g, 'colors.text');

  // Also replace occurrences where 'white' is used alone in some JSX props e.g., activeColor: colors.white
  code = code.replace(/:\s*'white'([,\n\r])/g, ": colors.white$1");
  code = code.replace(/:\s*\"white\"([,\n\r])/g, ': colors.white$1');

  if (code !== original) {
    // ensure import exists; use simple string checks
    if (!code.includes("from '../utils/theme'") && !code.includes('from "../utils/theme"') && !code.includes('from "../utils\\theme"')) {
      // insert after last import statement if present
      const importRegex = /(^import[\s\S]*?;\s*)/gm;
      let match;
      let lastIdx = 0;
      while ((match = importRegex.exec(code)) !== null) {
        lastIdx = importRegex.lastIndex;
      }
      const insert = "import { colors } from '../utils/theme';\n";
      if (lastIdx > 0) {
        code = code.slice(0, lastIdx) + insert + code.slice(lastIdx);
      } else {
        code = insert + code;
      }
    }
    fs.writeFileSync(file, code, 'utf8');
    changed++;
    console.log('Patched', file);
  }
});
console.log('Done. Files changed:', changed);
