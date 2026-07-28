/* ==========================================================================
   Ishmar Admin — generic CRUD engine
   Each admin content page defines a small config object describing its
   Supabase table, list columns and form fields, then calls
   initCrudPage(config). This file does the rest: list, search, create,
   edit, delete, image upload, and role-aware error messages.

   Field types: text, textarea, number, date, datetime, select, checkbox,
   image (uploads to Storage), relation (dropdown sourced from another
   table), tags (comma-separated <-> text[]), json (raw jsonb textarea).
   ========================================================================== */

function initCrudPage(config) {
  document.addEventListener('ishmar-admin-ready', () => new CrudPage(config).init());
}

class CrudPage {
  constructor(config) {
    this.config = config;
    this.rows = [];
    this.editingId = null;
    this.relationCache = {};
  }

  async init() {
    this.tableBody = document.getElementById('admin-table-body');
    this.searchInput = document.getElementById('admin-search');
    this.newBtn = document.getElementById('admin-new-btn');
    this.modalOverlay = document.getElementById('admin-modal-overlay');
    this.modalForm = document.getElementById('admin-modal-form');
    this.modalTitle = document.getElementById('admin-modal-title');
    this.modalError = document.getElementById('admin-modal-error');

    await this.loadRelationOptions();
    if (this.modalForm) this.renderForm();
    await this.loadRows();

    if (this.newBtn) this.newBtn.addEventListener('click', () => this.openModal());
    if (this.searchInput) this.searchInput.addEventListener('input', () => this.renderTable());
    document.querySelectorAll('[data-modal-close]').forEach((el) =>
      el.addEventListener('click', () => this.closeModal())
    );
    if (this.modalForm) this.modalForm.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  /* ---------------------------------------------------------------- data */

  async loadRows() {
    const { table, orderBy } = this.config;
    let query = window.ishmarSupabase.from(table).select('*');
    if (orderBy) query = query.order(orderBy.column, { ascending: !!orderBy.ascending });

    const { data, error } = await query;
    if (error) {
      this.tableBody.innerHTML = `<tr><td colspan="10" class="admin-empty">Couldn't load data: ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    this.rows = data || [];
    this.renderTable();
  }

  async loadRelationOptions() {
    for (const field of this.config.fields.filter((f) => f.type === 'relation')) {
      const { data } = await window.ishmarSupabase
        .from(field.relation.table)
        .select(`id, ${field.relation.labelColumn}`)
        .order(field.relation.labelColumn, { ascending: true });
      this.relationCache[field.key] = data || [];
    }
  }

  /* ---------------------------------------------------------------- list */

  renderTable() {
    const term = (this.searchInput?.value || '').trim().toLowerCase();
    const searchCols = this.config.searchColumns || [];
    const rows = term
      ? this.rows.filter((r) => searchCols.some((c) => String(r[c] || '').toLowerCase().includes(term)))
      : this.rows;

    if (!rows.length) {
      this.tableBody.innerHTML = `<tr><td colspan="10" class="admin-empty">No records yet.</td></tr>`;
      return;
    }

    this.tableBody.innerHTML = rows.map((row) => this.renderRow(row)).join('');

    this.tableBody.querySelectorAll('[data-edit-id]').forEach((btn) =>
      btn.addEventListener('click', () => this.openModal(btn.dataset.editId))
    );
    this.tableBody.querySelectorAll('[data-delete-id]').forEach((btn) =>
      btn.addEventListener('click', () => this.handleDelete(btn.dataset.deleteId))
    );
  }

  renderRow(row) {
    const cells = this.config.columns.map((col) => {
      if (col.type === 'image') {
        return `<td>${row[col.key] ? `<img class="thumb" src="${escapeHtml(row[col.key])}" alt="">` : ''}</td>`;
      }
      const raw = row[col.key];
      const value = col.format ? col.format(raw, row) : escapeHtml(raw ?? '—');
      return `<td>${value}</td>`;
    }).join('');

    const editBtn = this.config.fields.length
      ? `<button type="button" data-edit-id="${row.id}" aria-label="Edit">${ICON_EDIT}</button>`
      : '';
    const deleteBtn = this.config.hideDelete
      ? ''
      : `<button type="button" class="danger" data-delete-id="${row.id}" aria-label="Delete">${ICON_TRASH}</button>`;

    return `<tr>
      ${cells}
      <td>
        <div class="row-actions">
          ${editBtn}
          ${deleteBtn}
        </div>
      </td>
    </tr>`;
  }

  /* ---------------------------------------------------------------- form */

  renderForm() {
    this.modalForm.innerHTML = this.config.fields.map((f) => this.renderField(f)).join('');
  }

  renderField(field) {
    const id = `field-${field.key}`;
    const req = field.required ? 'required' : '';
    const hint = field.hint ? `<p class="form-note mt-1">${escapeHtml(field.hint)}</p>` : '';

    switch (field.type) {
      case 'textarea':
        return `<div class="form-field"><label for="${id}">${field.label}</label>
          <textarea id="${id}" name="${field.key}" rows="${field.rows || 4}" ${req} ${field.readonly ? 'readonly' : ''}></textarea>${hint}</div>`;

      case 'select': {
        const opts = field.options.map((o) => `<option value="${o}">${labelize(o)}</option>`).join('');
        return `<div class="form-field"><label for="${id}">${field.label}</label>
          <select id="${id}" name="${field.key}" ${req}><option value="">Select...</option>${opts}</select>${hint}</div>`;
      }

      case 'relation': {
        const opts = (this.relationCache[field.key] || [])
          .map((o) => `<option value="${o.id}">${escapeHtml(o[field.relation.labelColumn])}</option>`).join('');
        return `<div class="form-field"><label for="${id}">${field.label}</label>
          <select id="${id}" name="${field.key}"><option value="">None</option>${opts}</select>${hint}</div>`;
      }

      case 'checkbox':
        return `<div class="form-field"><div class="checkbox-field">
          <input type="checkbox" id="${id}" name="${field.key}">
          <label for="${id}">${field.label}</label></div>${hint}</div>`;

      case 'image':
        return `<div class="form-field"><label for="${id}">${field.label}</label>
          <div class="image-upload-field">
            <img class="preview" id="${id}-preview" src="" alt="" style="display:none;">
            <input type="file" id="${id}" name="${field.key}" accept="image/*" data-bucket="${field.bucket}">
          </div>
          <input type="hidden" id="${id}-url" name="${field.key}__existing">${hint}</div>`;

      case 'file':
        return `<div class="form-field"><label for="${id}">${field.label}</label>
          <input type="file" id="${id}" name="${field.key}" data-bucket="${field.bucket}">
          <input type="hidden" id="${id}-url" name="${field.key}__existing">${hint}</div>`;

      case 'number':
        return `<div class="form-field"><label for="${id}">${field.label}</label>
          <input type="number" id="${id}" name="${field.key}" ${req}>${hint}</div>`;

      case 'date':
        return `<div class="form-field"><label for="${id}">${field.label}</label>
          <input type="date" id="${id}" name="${field.key}" ${req}>${hint}</div>`;

      case 'datetime':
        return `<div class="form-field"><label for="${id}">${field.label}</label>
          <input type="datetime-local" id="${id}" name="${field.key}" ${req}>${hint}</div>`;

      case 'tags':
        return `<div class="form-field"><label for="${id}">${field.label}</label>
          <input type="text" id="${id}" name="${field.key}" placeholder="comma, separated, tags">${hint}</div>`;

      case 'json':
        return `<div class="form-field"><label for="${id}">${field.label}</label>
          <textarea id="${id}" name="${field.key}" rows="4" placeholder="[]"></textarea>${hint}</div>`;

      default:
        return `<div class="form-field"><label for="${id}">${field.label}</label>
          <input type="text" id="${id}" name="${field.key}" ${req} ${field.readonly ? 'readonly' : ''}>${hint}</div>`;
    }
  }

  /* ---------------------------------------------------------------- modal */

  openModal(id) {
    this.editingId = id || null;
    this.modalTitle.textContent = id ? `Edit ${this.config.title}` : `New ${this.config.title}`;
    this.modalError.classList.remove('is-visible');
    this.modalForm.reset();

    this.config.fields.filter((f) => f.type === 'image').forEach((f) => {
      const preview = document.getElementById(`field-${f.key}-preview`);
      if (preview) { preview.style.display = 'none'; preview.src = ''; }
    });

    if (id) {
      const row = this.rows.find((r) => String(r.id) === String(id));
      if (row) this.fillForm(row);
    }

    this.modalOverlay.classList.add('is-open');
  }

  closeModal() {
    this.modalOverlay.classList.remove('is-open');
    this.editingId = null;
  }

  fillForm(row) {
    this.config.fields.forEach((field) => {
      const el = document.getElementById(`field-${field.key}`);
      if (!el) return;
      const value = row[field.key];

      if (field.type === 'checkbox') {
        el.checked = !!value;
      } else if (field.type === 'tags') {
        el.value = Array.isArray(value) ? value.join(', ') : (value || '');
      } else if (field.type === 'json') {
        el.value = value ? JSON.stringify(value, null, 2) : '';
      } else if (field.type === 'image' || field.type === 'file') {
        const preview = document.getElementById(`field-${field.key}-preview`);
        const hidden = document.getElementById(`field-${field.key}-url`);
        if (value && preview) { preview.src = value; preview.style.display = 'block'; }
        if (hidden) hidden.value = value || '';
      } else if (field.type === 'datetime' && value) {
        el.value = value.slice(0, 16);
      } else {
        el.value = value ?? '';
      }
    });
  }

  /* ---------------------------------------------------------------- submit */

  async handleSubmit(e) {
    e.preventDefault();
    const submitBtn = this.modalForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Saving...';
    this.modalError.classList.remove('is-visible');

    try {
      const payload = await this.buildPayload();
      const { table } = this.config;

      const { error } = this.editingId
        ? await window.ishmarSupabase.from(table).update(payload).eq('id', this.editingId)
        : await window.ishmarSupabase.from(table).insert(payload);

      if (error) throw error;

      this.closeModal();
      await this.loadRows();
      showAdminToast(this.editingId ? 'Saved.' : 'Created.');
    } catch (err) {
      console.error('[Ishmar Admin] Save failed:', err);
      this.modalError.textContent = friendlyError(err);
      this.modalError.classList.add('is-visible');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  async buildPayload() {
    const formData = new FormData(this.modalForm);
    const payload = {};

    for (const field of this.config.fields) {
      if (field.readonly) continue;

      if (field.type === 'image' || field.type === 'file') {
        const fileInput = document.getElementById(`field-${field.key}`);
        const file = fileInput.files[0];
        if (file) {
          payload[field.key] = await uploadToStorage(field.bucket, file);
        } else {
          payload[field.key] = formData.get(`${field.key}__existing`) || null;
        }
        continue;
      }

      const raw = formData.get(field.key);

      if (field.type === 'checkbox') {
        payload[field.key] = document.getElementById(`field-${field.key}`).checked;
      } else if (field.type === 'number') {
        payload[field.key] = raw === '' ? null : Number(raw);
      } else if (field.type === 'tags') {
        payload[field.key] = raw ? raw.split(',').map((t) => t.trim()).filter(Boolean) : [];
      } else if (field.type === 'json') {
        payload[field.key] = raw ? JSON.parse(raw) : null;
      } else if (field.type === 'datetime') {
        payload[field.key] = raw ? new Date(raw).toISOString() : null;
      } else {
        payload[field.key] = raw === '' ? null : raw;
      }
    }

    if (this.config.extraPayload) Object.assign(payload, this.config.extraPayload());
    return payload;
  }

  async handleDelete(id) {
    if (!confirm('Delete this record? This can\'t be undone.')) return;
    const { error } = await window.ishmarSupabase.from(this.config.table).delete().eq('id', id);
    if (error) {
      showAdminToast(friendlyError(error), true);
      return;
    }
    await this.loadRows();
    showAdminToast('Deleted.');
  }
}

/* -------------------------------------------------------------------- utils */

async function uploadToStorage(bucket, file) {
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
  const { error } = await window.ishmarSupabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = window.ishmarSupabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function friendlyError(err) {
  if (err && err.code === '42501') return "You don't have permission to do this with your current role.";
  if (err && err.code === '23505') return 'That value already exists — try a different one (e.g. slug).';
  return (err && err.message) || 'Something went wrong.';
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function labelize(value) {
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function badge(value, color) {
  if (!value) return '—';
  return `<span class="badge badge-${color || 'gray'}">${escapeHtml(labelize(value))}</span>`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function showAdminToast(message, isError) {
  let toast = document.querySelector('.admin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'admin-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle('is-error', !!isError);
  toast.classList.add('is-visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

const ICON_EDIT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_TRASH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
