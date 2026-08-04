const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Cache flag: track whether backend is reachable
let backendOnline = true;

async function checkBackend() {
  try {
    const res = await fetch(`${API_URL}/forms`, { signal: AbortSignal.timeout(3000) });
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
        // Merge with local forms to preserve user edits and deleted questions
        let localForms = [];
        try { localForms = JSON.parse(localStorage.getItem('global_customForms') || '[]'); } catch { localForms = []; }

        const mergedMap = new Map();
        // Add backend forms
        data.forEach(f => mergedMap.set(f.id, f));
        // Override with local forms if local form is newer or explicitly saved
        localForms.forEach(lf => {
          const existing = mergedMap.get(lf.id);
          if (!existing || (lf.updatedAt || 0) >= (existing.updatedAt || 0)) {
            mergedMap.set(lf.id, lf);
          }
        });

        const mergedList = Array.from(mergedMap.values());
        localStorage.setItem('global_customForms', JSON.stringify(mergedList));
        return mergedList;
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

  // 1. Sync to backend API first
  try {
    const res = await fetch(`${API_URL}/forms/${encodeURIComponent(form.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      backendOnline = true;
    }
  } catch (e) {
    backendOnline = false;
    console.warn('Backend API offline. Saving form to local cache only.');
  }

  // 2. Persist to local cache safely with quota protection
  let localForms = [];
  try {
    localForms = JSON.parse(localStorage.getItem('global_customForms') || '[]');
  } catch { localForms = []; }

  const idx = localForms.findIndex(f => f.id === form.id);
  if (idx > -1) {
    localForms[idx] = form;
  } else {
    localForms.unshift(form);
  }
  try {
    localStorage.setItem('global_customForms', JSON.stringify(localForms));
  } catch (e) {
    console.warn('LocalStorage quota limit reached while saving form cache.');
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
  try {
    localStorage.setItem('global_customForms', JSON.stringify(localForms.filter(f => f.id !== id)));
  } catch (e) {}

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
  let localSubs = [];
  try {
    localSubs = JSON.parse(localStorage.getItem('global_formSubmissions') || '[]');
  } catch { localSubs = []; }

  try {
    const res = await fetch(`${API_URL}/responses`);
    if (res.ok) {
      const dbSubs = await res.json();
      if (Array.isArray(dbSubs)) {
        backendOnline = true;
        const mergedMap = new Map();
        // Add backend responses
        dbSubs.forEach(s => { if (s && s.id) mergedMap.set(s.id, s); });
        // Add local responses that aren't on server yet
        localSubs.forEach(s => {
          if (s && s.id && !mergedMap.has(s.id)) {
            mergedMap.set(s.id, s);
            // Push missing local submission to backend server
            fetch(`${API_URL}/responses/${encodeURIComponent(s.id)}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(s)
            }).catch(() => {});
          }
        });

        const mergedList = Array.from(mergedMap.values());
        mergedList.sort((a, b) => (b.id || '').localeCompare(a.id || ''));

        try {
          localStorage.setItem('global_formSubmissions', JSON.stringify(mergedList));
        } catch (e) {
          try {
            localStorage.setItem('global_formSubmissions', JSON.stringify(mergedList.slice(0, 20)));
          } catch (e2) {}
        }
        return mergedList;
      }
    }
  } catch (e) {
    backendOnline = false;
    console.warn('Backend API offline. Using local submissions cache.');
  }

  return localSubs;
}

/**
 * Save a new form submission.
 */
export async function saveResponse(response) {
  if (!response) return;

  // 1. Sync to backend API FIRST so submission is saved on disk server
  try {
    await fetch(`${API_URL}/responses/${encodeURIComponent(response.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    });
    backendOnline = true;
  } catch (e) {
    backendOnline = false;
    console.warn('Backend API offline. Saving response to local cache only.');
  }

  // 2. Add/Update in local cache safely (with quota overflow fallback)
  let localSubs = [];
  try {
    localSubs = JSON.parse(localStorage.getItem('global_formSubmissions') || '[]');
  } catch { localSubs = []; }

  const idx = localSubs.findIndex(s => s.id === response.id);
  if (idx > -1) {
    localSubs[idx] = response;
  } else {
    localSubs.unshift(response);
  }

  try {
    localStorage.setItem('global_formSubmissions', JSON.stringify(localSubs));
  } catch (quotaError) {
    console.warn('LocalStorage quota limit reached. Retaining recent submissions in cache.');
    try {
      localStorage.setItem('global_formSubmissions', JSON.stringify(localSubs.slice(0, 20)));
    } catch (e) {}
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
