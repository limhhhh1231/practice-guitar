const fs = require('node:fs');
const path = require('node:path');
const directory = __dirname;
const project = path.resolve(directory, '..');
let html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
for (const filename of ['sample-bank.js', 'groove-engine.js', 'practice-catalog.js', 'groove-app.js', 'fretboard-knowledge.js', 'chord-shapes.js', 'ear-engine.js', 'ear-audio.js', 'ear-app.js', 'green-ui.js']) {
  html = html.replace(`<script src="${filename}"></script>`, () => `<script>\n${fs.readFileSync(path.join(directory, filename), 'utf8')}\n</script>`);
}
for (const filename of ['groove.css', 'fretboard-knowledge.css', 'chord-shapes.css', 'green-ui.css', 'ear.css']) {
  html = html.replace(`<link rel="stylesheet" href="${filename}">`, () => `<style>\n${fs.readFileSync(path.join(directory, filename), 'utf8')}\n</style>`);
}
for (const filename of ['index.html', 'outputs/fretboard-lab.html', 'outputs/fretboard-lab-green.html', 'publish/index.html']) {
  const output = path.join(project, filename);
  fs.mkdirSync(path.dirname(output), {recursive:true});
  fs.writeFileSync(output, html);
  console.log(`Built ${filename} (${Buffer.byteLength(html)} bytes)`);
}
for (const folder of ['assets','outputs/assets','publish/assets']) {
  fs.mkdirSync(path.join(project,folder),{recursive:true});
  fs.copyFileSync(path.join(directory,'assets/ATTRIBUTION.md'),path.join(project,folder,'ATTRIBUTION.md'));
}
fs.writeFileSync(path.join(project,'.nojekyll'),'');
fs.writeFileSync(path.join(project,'publish/.nojekyll'),'');
