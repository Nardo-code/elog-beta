(() => {
  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
  const FILE_NAME = 'elog-workspace.json';
  const LOCKED_FOR_BETA_2 = true;
  const API = 'https://www.googleapis.com/drive/v3/files';
  const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';

  function locked() {
    if (LOCKED_FOR_BETA_2) throw new Error('Google Drive storage is reserved for Beta #2');
  }

  async function driveFetch(url, accessToken, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { Authorization: `Bearer ${accessToken}`, ...(options.headers || {}) }
    });
    if (!response.ok) throw new Error(`Google Drive request failed (${response.status})`);
    return response;
  }

  async function findBackup(accessToken) {
    const query = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
    const response = await driveFetch(`${API}?spaces=appDataFolder&q=${query}&fields=files(id,name,modifiedTime)&pageSize=1`, accessToken);
    return (await response.json()).files?.[0] || null;
  }

  async function upload(accessToken, workspace) {
    locked();
    const existing = await findBackup(accessToken);
    const body = JSON.stringify({ format: 'elog-workspace', version: 1, savedAt: new Date().toISOString(), workspace });
    if (existing) {
      await driveFetch(`${UPLOAD_API}/${existing.id}?uploadType=media`, accessToken, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
      return existing.id;
    }
    const boundary = `elog_${crypto.randomUUID()}`;
    const multipart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'] })}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
    const response = await driveFetch(`${UPLOAD_API}?uploadType=multipart&fields=id`, accessToken, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipart });
    return (await response.json()).id;
  }

  async function download(accessToken) {
    locked();
    const file = await findBackup(accessToken);
    if (!file) return null;
    const response = await driveFetch(`${API}/${file.id}?alt=media`, accessToken);
    return response.json();
  }

  window.eLOGDriveStorage = Object.freeze({
    status: 'locked-beta-2',
    scope: SCOPE,
    storageSpace: 'appDataFolder',
    fileName: FILE_NAME,
    requiresExplicitConsent: true,
    upload,
    download
  });
})();
