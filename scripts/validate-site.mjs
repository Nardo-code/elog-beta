import { readFile, access } from 'node:fs/promises';

const requiredFiles = [
  'index.html', 'app.js', 'styles.css', 'trade-form.css', 'motion.css', 'beta.css',
  'cloud.css', 'cloud-config.js', 'cloud.js', 'drive-storage.js', 'admin.html', 'admin.css', 'admin.js',
  'manifest.webmanifest', 'sw.js', 'icons/elog-icon.svg', 'icons/elog-192.png', 'icons/elog-512.png',
  'supabase/schema.sql', 'supabase/make-owner-admin.sql', 'supabase/fix-account-deletion.sql', 'supabase/README.md'
];

await Promise.all(requiredFiles.map(file => access(file)));
const [html, app, cloud, admin, config, schema, manifestText, worker] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('app.js', 'utf8'),
  readFile('cloud.js', 'utf8'),
  readFile('admin.js', 'utf8'),
  readFile('cloud-config.js', 'utf8'),
  readFile('supabase/schema.sql', 'utf8'),
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
for (const file of ['./cloud.js', './admin.html', './cloud-config.js']) {
  if (!worker.includes(`'${file}'`)) failures.push(`service worker does not cache ${file}`);
}
if (!html.includes('id="onboarding-overlay"')) failures.push('first-run storage and consent onboarding is missing');
if (!html.includes('id="cloud-use-local"')) failures.push('local-only mode control is missing');
if (!cloud.includes("provider: 'google'")) failures.push('Google sign-in is not configured in cloud.js');
if (!cloud.includes("'edgelog-storage-mode'")) failures.push('cloud.js does not persist the storage choice');
if (!admin.includes("app_metadata?.role !== 'admin'")) failures.push('admin dashboard role gate is missing');
if (!schema.includes('alter table public.elog_workspaces enable row level security')) failures.push('workspace RLS is missing');
const combinedClientCode = `${html}\n${app}\n${cloud}\n${admin}\n${config}`;
if (/sb_secret_|service_role\s*[:=]/i.test(combinedClientCode)) failures.push('a secret or service-role credential appears in public client files');
if (!config.includes('sb_publishable_')) failures.push('cloud config must use a publishable Supabase key');
if (!config.includes('googleClientId') || !html.includes('accounts.google.com/gsi/client')) failures.push('Google quick sign-in configuration is missing');
if (!cloud.includes('signInWithIdToken') || !cloud.includes('use_fedcm_for_prompt: true')) failures.push('Google quick sign-in must use Supabase ID-token auth and FedCM');

const idList = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
const ids = new Set(idList);
const duplicateIds = [...ids].filter(id => idList.filter(value => value === id).length > 1);
if (duplicateIds.length) failures.push(`duplicate HTML ids: ${duplicateIds.join(', ')}`);
for (const match of app.matchAll(/\$\('#([A-Za-z][\w:-]*)'\)/g)) {
  if (!ids.has(match[1])) failures.push(`app.js references missing element #${match[1]}`);
}
for (const match of cloud.matchAll(/\$\('#([A-Za-z][\w:-]*)'\)/g)) {
  if (!ids.has(match[1])) failures.push(`cloud.js references missing element #${match[1]}`);
}

if (failures.length) {
  console.error(failures.map(message => `- ${message}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({ status: 'ok', requiredFiles: requiredFiles.length, htmlIds: ids.size, version: manifest.name }));
