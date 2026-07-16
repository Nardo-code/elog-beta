(() => {
  const config = window.ELOG_CLOUD_CONFIG;
  const sdk = window.supabase;
  const client = config && sdk?.createClient ? sdk.createClient(config.url, config.publishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
  const $ = selector => document.querySelector(selector);
  const labels = { cloud_users:'Cloud users',active_7d:'Active (7 days)',analytics_opt_in:'Analytics opt-in',diagnostics_opt_in:'Diagnostics opt-in',synced_workspaces:'Synced workspaces',events_7d:'Events (7 days)' };
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const when = value => value ? new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)) : 'Never';
  function toast(message){ const node=$('#admin-toast'); node.textContent=message; node.classList.add('show'); setTimeout(()=>node.classList.remove('show'),2600); }
  function gate(title, copy, action='back'){
    $('#admin-content').hidden=true; $('#admin-gate').hidden=false; $('#admin-gate-title').textContent=title; $('#admin-gate-copy').textContent=copy;
    $('#admin-sign-in').hidden=action!=='signin'; $('#admin-back').hidden=action!=='back'; $('#admin-sign-out').hidden=true;
  }
  async function loadDashboard(session){
    if (session.user.app_metadata?.role !== 'admin') { gate('Owner access not assigned','This account is signed in, but it does not have the eLOG admin role. Run the owner-role setup after your first sign-in.'); return; }
    $('#admin-gate').hidden=true; $('#admin-content').hidden=false; $('#admin-sign-out').hidden=false;
    const [summaryResult,usersResult,eventsResult]=await Promise.all([client.rpc('elog_admin_summary'),client.rpc('elog_admin_users'),client.rpc('elog_admin_event_summary',{days_back:30})]);
    const error=summaryResult.error||usersResult.error||eventsResult.error; if(error) throw error;
    const summary=summaryResult.data||{};
    $('#summary-grid').innerHTML=Object.entries(labels).map(([key,label])=>`<article class="summary"><strong>${Number(summary[key]||0).toLocaleString()}</strong><small>${label}</small></article>`).join('');
    const users=usersResult.data||[]; $('#admin-users-empty').hidden=users.length>0;
    $('#admin-users').innerHTML=users.map(user=>`<tr><td class="user-cell"><strong>${esc(user.display_name||'Trader')}</strong><small>${esc(String(user.user_id).slice(0,8))}…</small></td><td><span class="badge">${esc(user.storage_mode)}</span></td><td><span class="badge ${user.analytics_consent?'yes':''}">Analytics ${user.analytics_consent?'on':'off'}</span> <span class="badge ${user.diagnostics_consent?'yes':''}">Errors ${user.diagnostics_consent?'on':'off'}</span></td><td><span class="badge ${user.support_access?'yes':''}">${user.support_access?'Granted':'Off'}</span></td><td>${esc(when(user.last_seen_at))}</td><td>${user.workspace_updated_at?`Rev ${Number(user.workspace_revision||0)} · ${esc(when(user.workspace_updated_at))}`:'Not synced'}</td></tr>`).join('');
    const events=eventsResult.data||[]; $('#admin-events-empty').hidden=events.length>0;
    $('#admin-events').innerHTML=events.map(item=>`<div class="event-row"><span>${esc(String(item.event_name).replaceAll('_',' '))}</span><strong>${Number(item.event_count||0).toLocaleString()}</strong></div>`).join('');
  }
  async function initialize(){
    if(!client){ gate('Cloud configuration unavailable','The public cloud client could not load. Return to eLOG and use local mode until setup is restored.'); return; }
    const {data,error}=await client.auth.getSession(); if(error) throw error;
    if(!data.session){ gate('Owner sign-in required','Sign in with the Google account assigned the eLOG admin role.','signin'); return; }
    await loadDashboard(data.session);
  }
  $('#admin-sign-in').addEventListener('click',async()=>{ const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:new URL('admin.html',location.href).href}}); if(error) toast(error.message); });
  $('#admin-sign-out').addEventListener('click',async()=>{ await client.auth.signOut(); gate('Signed out','Owner access has been closed.','signin'); });
  $('#refresh-admin').addEventListener('click',async()=>{ try{ const {data}=await client.auth.getSession(); if(data.session){await loadDashboard(data.session);toast('Dashboard refreshed');} }catch(error){toast(error.message);} });
  initialize().catch(error=>gate('Dashboard unavailable',String(error.message||error)));
})();
