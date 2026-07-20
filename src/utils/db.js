const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Cache flag: track whether backend is reachable
let backendOnline = true;

async function checkBackend() {
  try {
    const res = await fetch(`${API_URL}/forms`, { method: 'HEAD' });
    backendOnline = res.ok;
  } catch {
    backendOnline = false;
  }
}
// Kick off initial check
checkBackend();

/**
 * Get all forms from the database.
 * Prefers backend API, falls back to global_customForms in localStorage.
 */
export async function getForms() {
  try {
    const res = await fetch(`${API_URL}/forms`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        backendOnline = true;
        // Sync local cache with backend truth
        localStorage.setItem('global_customForms', JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {
    backendOnline = false;
    console.warn('Backend API offline. Using local cache.');
  }
  try {
    return JSON.parse(localStorage.getItem('global_customForms') || '[]');
  } catch {
    return [];
  }
}

/**
 * Save (create or update) a form.
 * Writes to local cache immediately, then syncs to backend.
 */
export async function saveForm(form) {
  if (!form || !form.id) {
    console.error('saveForm: invalid form object', form);
    return;
  }

  // 1. Immediately persist to local cache (upsert)
  let localForms = [];
  try {
    localForms = JSON.parse(localStorage.getItem('global_customForms') || '[]');
  } catch { localForms = []; }

  const idx = localForms.findIndex(f => f.id === form.id);
  if (idx > -1) {
    localForms[idx] = form;           // update in-place
  } else {
    localForms.unshift(form);          // prepend new form
  }
  localStorage.setItem('global_customForms', JSON.stringify(localForms));

  // 2. Sync to backend (upsert via PUT — server creates if not found)
  try {
    const res = await fetch(`${API_URL}/forms/${encodeURIComponent(form.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      backendOnline = true;
      // Refresh local cache from server response to ensure consistency
      const saved = await res.json().catch(() => null);
      if (saved && saved.form) {
        const idx2 = localForms.findIndex(f => f.id === form.id);
        if (idx2 > -1) localForms[idx2] = saved.form;
        localStorage.setItem('global_customForms', JSON.stringify(localForms));
      }
    }
  } catch (e) {
    backendOnline = false;
    console.warn('Backend API offline. Form saved to local cache only.');
  }
}

/**
 * Delete a form by ID.
 */
export async function deleteForm(id) {
  if (!id) return;

  // 1. Remove from local cache
  let localForms = [];
  try {
    localForms = JSON.parse(localStorage.getItem('global_customForms') || '[]');
  } catch { localForms = []; }
  localStorage.setItem('global_customForms', JSON.stringify(localForms.filter(f => f.id !== id)));

  // 2. Remove from backend
  try {
    await fetch(`${API_URL}/forms/${encodeURIComponent(id)}`, { method: 'DELETE' });
    backendOnline = true;
  } catch (e) {
    backendOnline = false;
    console.warn('Backend API offline. Form deleted from local cache only.');
  }
}

/**
 * Get all form submissions.
 */
export async function getResponses() {
  try {
    const res = await fetch(`${API_URL}/responses`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        backendOnline = true;
        localStorage.setItem('global_formSubmissions', JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {
    backendOnline = false;
    console.warn('Backend API offline. Using local submissions cache.');
  }
  try {
    return JSON.parse(localStorage.getItem('global_formSubmissions') || '[]');
  } catch {
    return [];
  }
}

/**
 * Save a new form submission.
 */
export async function saveResponse(response) {
  if (!response) return;

  // 1. Add to local cache (avoid duplicates by id)
  let localSubs = [];
  try {
    localSubs = JSON.parse(localStorage.getItem('global_formSubmissions') || '[]');
  } catch { localSubs = []; }

  if (response.id && localSubs.some(s => s.id === response.id)) {
    // already saved, skip
  } else {
    localSubs.unshift(response);
    localStorage.setItem('global_formSubmissions', JSON.stringify(localSubs));
  }

  // 2. Sync to backend
  try {
    await fetch(`${API_URL}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    });
    backendOnline = true;
  } catch (e) {
    backendOnline = false;
    console.warn('Backend API offline. Response saved to local cache only.');
  }
}

/**
 * Delete a form submission by ID.
 */
export async function deleteResponse(id) {
  if (!id) return;

  // 1. Remove from local cache
  let localSubs = [];
  try {
    localSubs = JSON.parse(localStorage.getItem('global_formSubmissions') || '[]');
  } catch { localSubs = []; }
  localStorage.setItem('global_formSubmissions', JSON.stringify(
    localSubs.filter(s => s.id !== id && s.response_id !== id)
  ));

  // 2. Remove from backend
  try {
    await fetch(`${API_URL}/responses/${encodeURIComponent(id)}`, { method: 'DELETE' });
    backendOnline = true;
  } catch (e) {
    backendOnline = false;
    console.warn('Backend API offline. Response deleted from local cache only.');
  }
}
