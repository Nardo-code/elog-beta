(() => {
  const config = window.ELOG_CLOUD_CONFIG;
  const bridge = window.eLOGCloudBridge;
  const sdk = window.supabase;
  const client = config && sdk?.createClient ? sdk.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }) : null;

  const $ = selector => document.querySelector(selector);
  const MODE_KEY = 'edgelog-storage-mode';
  const PENDING_KEY = 'edgelog-cloud-onboarding-pending';
  const DEVICE_KEY = 'edgelog-device-id';
  const ANON_KEY = 'edgelog-anonymous-id';
  const LAST_HASH_KEY = 'edgelog-cloud-last-hash';
  const LAST_SERVER_KEY = 'edgelog-cloud-last-server-updated';
  const LAST_REVISION_KEY = 'edgelog-cloud-last-revision';
  const SYNC_INTERVAL = 60000;

  let session = null;
  let cloudReady = false;
  let googleEnabled = false;
  let schemaReady = false;
  let syncing = false;
  let conflict = null;
  let lastActivity = Date.now();

  function storageMode() { return localStorage.getItem(MODE_KEY) || 'unset'; }
  function getOrCreateId(key) {
    let value = localStorage.getItem(key);
    if (!value) {
      value = crypto.randomUUID();
      localStorage.setItem(key, value);
    }
    return value;
  }
  function deviceType() {
    const ua = navigator.userAgent;
    if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
    if (/Mobi|iPhone|Android/i.test(ua)) return 'mobile';
    return 'desktop';
  }
  function consent() { return bridge.getConsent() || {}; }
  function safeError(error) { return String(error?.message || error || 'Unknown error').slice(0, 240); }
  async function digest(value) {
    const data = new TextEncoder().encode(value);
    const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
    return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
  async function localWorkspaceHash() {
    return digest(JSON.stringify(bridge.getWorkspacePayload().items));
  }

  async function checkCloudAvailability() {
    if (!config || !client) return false;
    try {
      const [authResponse, schemaResponse] = await Promise.all([
        fetch(`${config.url}/auth/v1/settings`, { headers: { apikey: config.publishableKey } }),
        fetch(`${config.url}/rest/v1/elog_profiles?select=user_id&limit=0`, { headers: { apikey: config.publishableKey } })
      ]);
      const authSettings = authResponse.ok ? await authResponse.json() : {};
      googleEnabled = Boolean(authSettings.external?.google);
      let schemaBody = {};
      try { schemaBody = await schemaResponse.clone().json(); } catch { schemaBody = {}; }
      schemaReady = schemaResponse.status !== 404 && schemaBody.code !== 'PGRST205';
      cloudReady = authResponse.ok && googleEnabled && schemaReady;
    } catch {
      cloudReady = false;
    }
    renderOnboardingAvailability();
    renderCloudPanel();
    return cloudReady;
  }

  function dataNotice(mode) {
    if (mode === 'cloud') return `<strong>Cloud data disclosure</strong><p>Required for cloud mode: Google account identifier and email, your journal workspace, sync timestamps, app version, and consent choices. The owner dashboard receives account and sync status—not raw journal content. Optional analytics below stays off unless you enable it.</p>`;
    return `<strong>Local data disclosure</strong><p>Your journal stays in this browser. If you opt in below, eLOG sends only anonymous feature usage, app version, general device type, or client errors. It never includes symbols, trades, screenshots, notes, balances, or setup criteria.</p>`;
  }

  function renderOnboardingAvailability() {
    const cloudRadio = $('#cloud-choice-card input');
    const status = $('#cloud-choice-status');
    if (!cloudRadio || !status) return;
    cloudRadio.disabled = !cloudReady;
    status.textContent = cloudReady ? 'Available' : !schemaReady ? 'Database setup required' : !googleEnabled ? 'Google setup required' : 'Temporarily unavailable';
    status.classList.toggle('ready', cloudReady);
    const selectedMode = $('#onboarding-form input[name="storageMode"]:checked')?.value || 'local';
    $('#onboarding-data-notice').innerHTML = dataNotice(selectedMode);
  }

  function updateOnboardingChoice() {
    const mode = $('#onboarding-form input[name="storageMode"]:checked').value;
    $('#onboarding-data-notice').innerHTML = dataNotice(mode);
    $('#onboarding-submit').textContent = mode === 'cloud' ? 'Continue with Google' : 'Start with local storage';
  }

  function showOnboarding() {
    const overlay = $('#onboarding-overlay');
    overlay.classList.add('visible');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const hasPassword = bridge.hasDevicePassword();
    $('#onboarding-password-fields').hidden = hasPassword;
    $('#onboarding-form').elements.password.required = !hasPassword;
    $('#onboarding-form').elements.passwordConfirm.required = !hasPassword;
    const savedConsent = consent();
    ['analytics', 'diagnostics', 'marketing'].forEach(key => { $('#onboarding-form').elements[key].checked = Boolean(savedConsent[key]); });
    if (storageMode() === 'cloud') $('#onboarding-form').elements.storageMode.value = 'cloud';
    updateOnboardingChoice();
    renderOnboardingAvailability();
  }

  async function signInWithGoogle() {
    if (!client || !cloudReady) throw new Error('Cloud sign-in is not ready yet');
    const redirectTo = config.appUrl;
    const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) throw error;
  }

  async function upsertProfile() {
    if (!session?.user) return;
    const choices = consent();
    const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || bridge.getDisplayName();
    const { error } = await client.from('elog_profiles').upsert({
      user_id: session.user.id,
      display_name: String(name || 'Trader').slice(0, 80),
      storage_mode: 'cloud',
      analytics_consent: Boolean(choices.analytics),
      diagnostics_consent: Boolean(choices.diagnostics),
      product_updates_consent: Boolean(choices.marketing),
      consent_version: config.consentVersion,
      app_version: bridge.appVersion,
      last_seen_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    if (error) throw error;
  }

  async function trackEvent(eventName, metadata = {}) {
    if (!client) return;
    const choices = consent();
    const isDiagnostic = eventName === 'client_error' || eventName === 'sync_failed';
    if (isDiagnostic ? !choices.diagnostics : !choices.analytics) return;
    const row = {
      user_id: session?.user?.id || null,
      anonymous_id: session?.user ? null : getOrCreateId(ANON_KEY),
      event_name: eventName,
      app_version: bridge.appVersion,
      storage_mode: storageMode(),
      device_type: deviceType(),
      metadata
    };
    await client.from('elog_product_events').insert(row).then(() => {}).catch(() => {});
  }

  async function fetchRemoteWorkspace() {
    const { data, error } = await client.from('elog_workspaces').select('payload,revision,updated_at,device_id').eq('user_id', session.user.id).maybeSingle();
    if (error) throw error;
    return data;
  }

  function rememberSync(remote, hash) {
    localStorage.setItem(LAST_HASH_KEY, hash);
    localStorage.setItem(LAST_SERVER_KEY, remote.updated_at);
    localStorage.setItem(LAST_REVISION_KEY, String(remote.revision));
  }

  async function pushDeviceWorkspace(existing = null) {
    const payload = bridge.getWorkspacePayload();
    const row = {
      user_id: session.user.id,
      payload,
      revision: Number(existing?.revision || 0) + 1,
      device_id: getOrCreateId(DEVICE_KEY),
      client_updated_at: new Date().toISOString()
    };
    const { data, error } = await client.from('elog_workspaces').upsert(row, { onConflict: 'user_id' }).select('revision,updated_at').single();
    if (error) throw error;
    const hash = await localWorkspaceHash();
    rememberSync(data, hash);
    await trackEvent('sync_completed', { direction: 'upload' });
    return data;
  }

  async function useCloudWorkspace(remote) {
    const hash = await digest(JSON.stringify(remote.payload?.items || {}));
    rememberSync(remote, hash);
    await trackEvent('sync_completed', { direction: 'download' });
    bridge.applyWorkspacePayload(remote.payload);
  }

  function openConflict(remote) {
    conflict = remote;
    $('#cloud-conflict-modal').classList.add('open');
    $('#cloud-conflict-modal').setAttribute('aria-hidden', 'false');
  }

  function closeConflict() {
    conflict = null;
    $('#cloud-conflict-modal').classList.remove('open');
    $('#cloud-conflict-modal').setAttribute('aria-hidden', 'true');
  }

  async function syncNow(force = null) {
    if (!client || !session?.user || storageMode() !== 'cloud' || syncing) return;
    syncing = true;
    renderCloudPanel('Syncing…');
    try {
      await upsertProfile();
      const remote = await fetchRemoteWorkspace();
      if (!remote) {
        await pushDeviceWorkspace();
      } else if (force === 'cloud') {
        await useCloudWorkspace(remote);
        return;
      } else if (force === 'device') {
        await pushDeviceWorkspace(remote);
      } else {
        const localHash = await localWorkspaceHash();
        const lastHash = localStorage.getItem(LAST_HASH_KEY);
        const lastServer = localStorage.getItem(LAST_SERVER_KEY);
        const localChanged = !lastHash || localHash !== lastHash;
        const remoteChanged = !lastServer || remote.updated_at !== lastServer;
        if (localChanged && remoteChanged) {
          openConflict(remote);
        } else if (remoteChanged) {
          await useCloudWorkspace(remote);
          return;
        } else if (localChanged) {
          await pushDeviceWorkspace(remote);
        }
      }
      renderCloudPanel('Synced just now');
    } catch (error) {
      renderCloudPanel(`Sync paused: ${safeError(error)}`);
      await trackEvent('sync_failed', { message: safeError(error) });
    } finally {
      syncing = false;
    }
  }

  function isAdmin() { return session?.user?.app_metadata?.role === 'admin'; }

  async function loadProfileControls() {
    if (!session?.user) return;
    const { data } = await client.from('elog_profiles').select('support_access').eq('user_id', session.user.id).maybeSingle();
    if (data) $('#support-access').checked = Boolean(data.support_access);
  }

  function renderCloudPanel(statusOverride = '') {
    const mode = storageMode();
    const signedIn = Boolean(session?.user);
    $('#cloud-mode-title').textContent = mode === 'cloud' ? 'Cloud-synced workspace' : 'Local workspace';
    $('#cloud-mode-description').textContent = mode === 'cloud' ? 'Your journal can sync across devices after Google sign-in.' : 'Journal data is stored only in this browser.';
    $('#cloud-status-dot').classList.toggle('online', signedIn && mode === 'cloud');
    $('#cloud-status-text').textContent = statusOverride || (mode === 'cloud' ? signedIn ? 'Connected to secure cloud sync' : cloudReady ? 'Sign in to resume cloud sync' : 'Owner cloud setup is incomplete' : 'Local-only mode');
    $('#cloud-sign-in').hidden = signedIn;
    $('#cloud-sign-in').disabled = !cloudReady;
    $('#cloud-sign-in').textContent = mode === 'cloud' ? 'Sign in with Google' : 'Enable cloud with Google';
    ['#cloud-sync-now', '#cloud-download', '#cloud-sign-out', '#support-access-row', '#cloud-delete-account'].forEach(selector => { $(selector).hidden = !signedIn; });
    $('#admin-dashboard-link').hidden = !isAdmin();
    $('#cloud-identity').hidden = !signedIn;
    if (signedIn) {
      const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Trader';
      $('#cloud-user-name').textContent = name;
      $('#cloud-user-email').textContent = session.user.email || '';
      $('#cloud-avatar').textContent = String(name).charAt(0).toUpperCase();
    }
  }

  async function finishCloudOnboarding() {
    try {
      await upsertProfile();
      localStorage.removeItem(PENDING_KEY);
      bridge.beginApp();
      await trackEvent('onboarding_completed', { mode: 'cloud' });
      await syncNow();
    } catch (error) {
      showOnboarding();
      $('#onboarding-error').textContent = `Cloud setup is not ready: ${safeError(error)}`;
    }
  }

  $('#onboarding-form').addEventListener('change', event => {
    if (event.target.name === 'storageMode') updateOnboardingChoice();
  });

  $('#onboarding-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = new FormData(event.target);
    const mode = String(form.get('storageMode'));
    const errorBox = $('#onboarding-error');
    errorBox.textContent = '';
    if (mode === 'cloud' && !cloudReady) { errorBox.textContent = 'Cloud mode needs the database schema and Google provider enabled by the owner.'; return; }
    if (!bridge.hasDevicePassword()) {
      const password = String(form.get('password') || '');
      if (password !== String(form.get('passwordConfirm') || '')) { errorBox.textContent = 'The device passwords do not match.'; return; }
      if (password.length < 8) { errorBox.textContent = 'Use at least 8 characters for the device password.'; return; }
      await bridge.setInitialDevicePassword(password);
    }
    bridge.saveConsent({ analytics: form.has('analytics'), diagnostics: form.has('diagnostics'), marketing: form.has('marketing') });
    localStorage.setItem(MODE_KEY, mode);
    if (mode === 'local') {
      localStorage.removeItem(PENDING_KEY);
      bridge.beginApp();
      await trackEvent('onboarding_completed', { mode: 'local' });
      renderCloudPanel();
      return;
    }
    localStorage.setItem(PENDING_KEY, 'true');
    try { await signInWithGoogle(); }
    catch (error) { errorBox.textContent = safeError(error); }
  });

  $('#cloud-sign-in').addEventListener('click', async () => {
    if (!cloudReady) { bridge.toast('Cloud setup is not finished yet'); return; }
    if (storageMode() !== 'cloud') {
      const confirmed = window.confirm('Enable cloud sync? Your journal workspace will be stored in your private Supabase account and synchronized after Google sign-in.');
      if (!confirmed) return;
      localStorage.setItem(MODE_KEY, 'cloud');
      localStorage.setItem(PENDING_KEY, 'true');
    }
    try { await signInWithGoogle(); } catch (error) { bridge.toast(safeError(error)); }
  });
  $('#cloud-sync-now').addEventListener('click', () => syncNow());
  $('#cloud-download').addEventListener('click', () => syncNow('cloud'));
  $('#cloud-use-local').addEventListener('click', async () => {
    if (storageMode() === 'local') { bridge.toast('This device is already local-only.'); return; }
    const confirmed = window.confirm('Switch this device to local-only mode? The current device copy stays here. Any existing cloud copy remains private until you delete the cloud account.');
    if (!confirmed) return;
    localStorage.setItem(MODE_KEY, 'local');
    [LAST_HASH_KEY, LAST_SERVER_KEY, LAST_REVISION_KEY, PENDING_KEY].forEach(key => localStorage.removeItem(key));
    if (client && session) await client.auth.signOut();
    session = null;
    renderCloudPanel();
    bridge.toast('This device now uses local-only storage.');
  });
  $('#cloud-sign-out').addEventListener('click', async () => { await client.auth.signOut(); session = null; renderCloudPanel(); bridge.toast('Signed out. Local data remains on this device.'); });
  $('#support-access').addEventListener('change', async event => {
    if (!session?.user) return;
    const { error } = await client.from('elog_profiles').update({ support_access: event.target.checked }).eq('user_id', session.user.id);
    if (error) { event.target.checked = !event.target.checked; bridge.toast('Could not update support access'); }
    else bridge.toast(event.target.checked ? 'Temporary support access enabled' : 'Temporary support access disabled');
  });
  $('#cloud-delete-account').addEventListener('click', async () => {
    if (!session?.user || !window.confirm('Permanently delete your eLOG cloud account and cloud workspace? Your current device copy will remain local. This cannot be undone.')) return;
    const { error } = await client.rpc('elog_delete_my_account');
    if (error) { bridge.toast(`Account deletion failed: ${safeError(error)}`); return; }
    await client.auth.signOut();
    session = null;
    localStorage.setItem(MODE_KEY, 'local');
    [LAST_HASH_KEY, LAST_SERVER_KEY, LAST_REVISION_KEY, PENDING_KEY].forEach(key => localStorage.removeItem(key));
    renderCloudPanel();
    bridge.toast('Cloud account deleted. This device remains local-only.');
  });
  $('#conflict-use-cloud').addEventListener('click', async () => { const remote = conflict; closeConflict(); if (remote) await useCloudWorkspace(remote); });
  $('#conflict-use-device').addEventListener('click', async () => { const remote = conflict; closeConflict(); if (remote) await pushDeviceWorkspace(remote); });
  $('#conflict-cancel').addEventListener('click', closeConflict);

  document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => {
    const now = Date.now();
    if (now - lastActivity > 1000) trackEvent('page_view', { view: button.dataset.view });
    lastActivity = now;
  }));
  window.addEventListener('error', event => trackEvent('client_error', { message: safeError(event.error || event.message) }));
  window.addEventListener('unhandledrejection', event => trackEvent('client_error', { message: safeError(event.reason) }));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') syncNow(); });

  async function initialize() {
    await checkCloudAvailability();
    if (client) {
      const { data } = await client.auth.getSession();
      session = data.session;
      client.auth.onAuthStateChange((event, nextSession) => {
        session = nextSession;
        renderCloudPanel();
        if (event === 'SIGNED_IN' && storageMode() === 'cloud') {
          loadProfileControls();
          if (localStorage.getItem(PENDING_KEY)) finishCloudOnboarding();
          else syncNow();
        }
      });
    }
    if (storageMode() === 'unset' || (localStorage.getItem(PENDING_KEY) && !session)) showOnboarding();
    else if (storageMode() === 'cloud' && session) {
      await loadProfileControls();
      if (localStorage.getItem(PENDING_KEY)) await finishCloudOnboarding();
      else await syncNow();
    }
    renderCloudPanel();
    await trackEvent('app_opened');
    setInterval(() => syncNow(), SYNC_INTERVAL);
  }

  initialize().catch(error => {
    renderCloudPanel(`Cloud unavailable: ${safeError(error)}`);
    if (storageMode() === 'unset') showOnboarding();
  });
})();
