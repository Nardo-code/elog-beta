import { readFile, access } from 'node:fs/promises';

const requiredFiles = [
  'index.html', 'app.js', 'styles.css', 'trade-form.css', 'motion.css', 'beta.css',
  'manifest.webmanifest', 'sw.js', 'icons/elog-icon.svg', 'icons/elog-192.png', 'icons/elog-512.png'
];

await Promise.all(requiredFiles.map(file => access(file)));
const [html, app, manifestText, worker] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('app.js', 'utf8'),
  readFile('manifest.webmanifest', 'utf8'),
  readFile('sw.js', 'utf8')
]);
const manifest = JSON.parse(manifestText);

const failures = [];
if (!html.includes('rel="manifest"')) failures.push('index.html is missing the web app manifest link');
if (!html.includes('apple-touch-icon')) failures.push('index.html is missing the Apple touch icon');
if (!app.includes("serviceWorker.register('./sw.js')")) failures.push('app.js does not register the service worker');
if (manifest.display !== 'standalone') failures.push('manifest display must be standalone');
if (manifest.start_url !== './' || manifest.scope !== './') failures.push('manifest paths must remain GitHub Pages compatible');
if (!worker.includes("'./index.html'")) failures.push('service worker does not cache the app entry point');

const idList = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
const ids = new Set(idList);
const duplicateIds = [...ids].filter(id => idList.filter(value => value === id).length > 1);
if (duplicateIds.length) failures.push(`duplicate HTML ids: ${duplicateIds.join(', ')}`);
for (const match of app.matchAll(/\$\('#([A-Za-z][\w:-]*)'\)/g)) {
  if (!ids.has(match[1])) failures.push(`app.js references missing element #${match[1]}`);
}

if (failures.length) {
  console.error(failures.map(message => `- ${message}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({ status: 'ok', requiredFiles: requiredFiles.length, htmlIds: ids.size, version: manifest.name }));
