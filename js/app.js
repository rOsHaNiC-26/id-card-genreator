/* ============================================================
   ID CARD GENERATOR — APPLICATION LOGIC
   ============================================================ */

// ==================== STATE ====================
const state = {
    templateImg: null,          // HTMLImageElement (for custom uploads only)
    templateFile: null,         // File object
    selectedTemplateId: null,   // ID of built-in template (e.g. 'corporate_blue')
    csvData: [],                // Array of row objects
    csvColumns: [],             // Column names from CSV
    photos: new Map(),          // filename -> HTMLImageElement
    photoFiles: new Map(),      // filename -> File object
    generatedCards: [],         // Array of { name, id, dataUrl, blob }
    currentPreview: 0,          // Index of currently previewed card

    // Column mapping
    mapping: {
        name: '',
        id: '',
        branch: '',
        dob: '',
        bloodGroup: '',
        photo: ''
    }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    setupDragDrop();
    setupFileInputs();
    setupScrollEffects();
    // Generate canvas thumbnails for built-in templates
    generateTemplateThumbnails();
});

// ==================== DRAG & DROP ====================
function setupDragDrop() {
    const zones = document.querySelectorAll('.upload-zone');
    zones.forEach(zone => {
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
        zone.addEventListener('dragleave', () => { zone.classList.remove('drag-over'); });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            const type = zone.dataset.type;
            const files = e.dataTransfer.files;
            if (type === 'csv' && files.length) handleCSVFile(files[0]);
            else if (type === 'photos' && files.length) handlePhotoFiles(files);
        });
        zone.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            const type = zone.dataset.type;
            if (type === 'csv') document.getElementById('csv-input').click();
            else if (type === 'photos') document.getElementById('photos-input').click();
        });
    });
}

function setupFileInputs() {
    document.getElementById('template-input').addEventListener('change', (e) => {
        if (e.target.files.length) handleTemplateFile(e.target.files[0]);
    });
    document.getElementById('csv-input').addEventListener('change', (e) => {
        if (e.target.files.length) handleCSVFile(e.target.files[0]);
    });
    document.getElementById('photos-input').addEventListener('change', (e) => {
        if (e.target.files.length) handlePhotoFiles(e.target.files);
    });
}

// ==================== TEMPLATE SELECTION ====================
function selectBuiltInTemplate(templateId, element) {
    if (!CARD_TEMPLATES[templateId]) {
        showToast('Template not found.', 'error');
        return;
    }

    // Update UI selection
    document.querySelectorAll('.template-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');

    // Set state
    state.selectedTemplateId = templateId;
    state.templateImg = null;
    state.templateFile = null;

    const tmpl = CARD_TEMPLATES[templateId];

    // Generate preview image from the template
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = tmpl.width;
    previewCanvas.height = tmpl.height;
    const ctx = previewCanvas.getContext('2d');
    const sampleData = { name: 'Sample Student', id: '12345', branch: 'Computer Science', dob: '01/01/2000', bloodGroup: 'B+' };
    tmpl.render(ctx, tmpl.width, tmpl.height, sampleData, null);

    showTemplatePreview(previewCanvas.toDataURL(), `${tmpl.name} (${tmpl.width}×${tmpl.height})`);
    showToast(`Template selected: ${tmpl.name}`, 'success');
    checkReadyState();
}

function handleTemplateFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file for the template.', 'error');
        return;
    }
    state.templateFile = file;
    state.selectedTemplateId = null; // Custom upload, not a built-in template
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            state.templateImg = img;
            showTemplatePreview(e.target.result, `${file.name} (${img.width}×${img.height})`);
            showToast(`Custom template loaded: ${img.width}×${img.height}px`, 'success');
            checkReadyState();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function showTemplatePreview(src, labelText) {
    document.getElementById('template-selector').style.display = 'none';
    const preview = document.getElementById('template-preview');
    preview.style.display = 'block';
    document.getElementById('template-preview-img').src = src;
    document.getElementById('template-name').textContent = labelText;
}

function changeTemplate() {
    state.templateImg = null;
    state.templateFile = null;
    state.selectedTemplateId = null;
    document.querySelectorAll('.template-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById('template-selector').style.display = 'block';
    document.getElementById('template-preview').style.display = 'none';
    document.getElementById('template-input').value = '';
    checkReadyState();
}

function removeTemplate() {
    changeTemplate();
}

// ==================== CSV HANDLER ====================
function handleCSVFile(file) {
    if (!file.name.endsWith('.csv')) {
        showToast('Please upload a CSV file.', 'error');
        return;
    }
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            if (results.errors.length > 0) {
                showToast(`CSV parsing errors: ${results.errors[0].message}`, 'error');
            }
            state.csvData = results.data;
            state.csvColumns = results.meta.fields || [];

            document.querySelector('#upload-csv .upload-zone').style.display = 'none';
            const preview = document.getElementById('csv-preview');
            preview.style.display = 'block';
            document.getElementById('csv-name').textContent = file.name;
            document.getElementById('csv-rows').textContent = `${state.csvData.length} records found`;

            autoMapColumns();
            showColumnMapping();
            showToast(`CSV loaded: ${state.csvData.length} records`, 'success');
            checkReadyState();
        },
        error: (err) => { showToast(`Failed to parse CSV: ${err.message}`, 'error'); }
    });
}

// ==================== PHOTOS HANDLER ====================
function handlePhotoFiles(files) {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) { showToast('No valid image files found.', 'error'); return; }

    let loaded = 0;
    const miniGrid = document.getElementById('photos-grid-mini');
    miniGrid.innerHTML = '';

    fileArray.forEach(file => {
        state.photoFiles.set(file.name, file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                state.photos.set(file.name, img);
                loaded++;
                const thumb = document.createElement('img');
                thumb.src = e.target.result;
                thumb.alt = file.name;
                thumb.title = file.name;
                miniGrid.appendChild(thumb);

                if (loaded === fileArray.length) {
                    document.querySelector('#upload-photos .upload-zone').style.display = 'none';
                    document.getElementById('photos-preview').style.display = 'block';
                    document.getElementById('photos-count').textContent = `${loaded} photos loaded`;
                    showToast(`${loaded} photos loaded successfully`, 'success');
                    checkReadyState();
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// ==================== REMOVE HANDLERS ====================
function removeCSV() {
    state.csvData = [];
    state.csvColumns = [];
    document.querySelector('#upload-csv .upload-zone').style.display = 'flex';
    document.getElementById('csv-preview').style.display = 'none';
    document.getElementById('csv-input').value = '';
    document.getElementById('column-mapping-section').style.display = 'none';
    checkReadyState();
}

function removePhotos() {
    state.photos.clear();
    state.photoFiles.clear();
    document.querySelector('#upload-photos .upload-zone').style.display = 'flex';
    document.getElementById('photos-preview').style.display = 'none';
    document.getElementById('photos-input').value = '';
    checkReadyState();
}

// ==================== COLUMN MAPPING ====================
function autoMapColumns() {
    const cols = state.csvColumns.map(c => c.toLowerCase().trim());
    const m = state.mapping;
    m.name = findColumn(cols, ['name', 'full name', 'student name', 'fullname']);
    m.id = findColumn(cols, ['erp number', 'id', 'student id', 'roll number', 'roll no', 'enrollment', 'erp']);
    m.branch = findColumn(cols, ['branch', 'department', 'dept', 'course', 'program']);
    m.dob = findColumn(cols, ['date of birth', 'dob', 'birth date', 'birthdate']);
    m.bloodGroup = findColumn(cols, ['blood group', 'bloodgroup', 'blood_group', 'blood type']);
    m.photo = findColumn(cols, ['photo for id card', 'photo', 'image', 'picture', 'photo_path', 'photo file']);
}

function findColumn(columns, keywords) {
    for (const kw of keywords) {
        const idx = columns.indexOf(kw);
        if (idx !== -1) return state.csvColumns[idx];
    }
    for (const kw of keywords) {
        const idx = columns.findIndex(c => c.includes(kw));
        if (idx !== -1) return state.csvColumns[idx];
    }
    return '';
}

function showColumnMapping() {
    const section = document.getElementById('column-mapping-section');
    section.style.display = 'block';
    const grid = document.getElementById('mapping-grid');
    const fields = [
        { key: 'name', label: '👤 Name', required: true },
        { key: 'id', label: '🔢 ID / Roll Number', required: true },
        { key: 'branch', label: '🏫 Branch / Department' },
        { key: 'dob', label: '📅 Date of Birth' },
        { key: 'bloodGroup', label: '🩸 Blood Group' },
        { key: 'photo', label: '📸 Photo Filename' }
    ];
    grid.innerHTML = fields.map(field => {
        const options = state.csvColumns.map(col =>
            `<option value="${escapeHtml(col)}" ${state.mapping[field.key] === col ? 'selected' : ''}>${escapeHtml(col)}</option>`
        ).join('');
        return `<div class="mapping-item">
            <label>${field.label} ${field.required ? '<span style="color:var(--error)">*</span>' : ''}</label>
            <select onchange="updateMapping('${field.key}', this.value)">
                <option value="">— Select Column —</option>
                ${options}
            </select>
        </div>`;
    }).join('');
}

function updateMapping(key, value) {
    state.mapping[key] = value;
    updatePreview();
}

// ==================== STATE CHECK ====================
function checkReadyState() {
    const hasTemplate = !!state.selectedTemplateId || !!state.templateImg;
    const hasCSV = state.csvData.length > 0;

    if (hasTemplate && hasCSV) {
        document.getElementById('layout-section').style.display = 'block';
        document.getElementById('generate-section').style.display = 'block';
        document.getElementById('generate-subtitle').textContent = `${state.csvData.length} cards will be created`;
        updatePreview();
    } else {
        document.getElementById('layout-section').style.display = 'none';
        document.getElementById('generate-section').style.display = 'none';
    }
}

// ==================== PREVIEW ====================
function updatePreview() {
    const hasTemplate = !!state.selectedTemplateId || !!state.templateImg;
    if (!hasTemplate || state.csvData.length === 0) return;

    const idx = state.currentPreview;
    const row = state.csvData[idx];
    if (!row) return;

    const canvas = document.getElementById('preview-canvas');
    renderCard(canvas, row);

    document.getElementById('preview-counter').textContent = `${idx + 1} / ${state.csvData.length}`;
    document.getElementById('prev-preview').disabled = idx === 0;
    document.getElementById('next-preview').disabled = idx >= state.csvData.length - 1;
}

function navigatePreview(dir) {
    state.currentPreview = Math.max(0, Math.min(state.csvData.length - 1, state.currentPreview + dir));
    updatePreview();
}

// ==================== CARD RENDERING ====================
function renderCard(canvas, rowData) {
    const m = state.mapping;

    // Get data values
    const data = {
        name: rowData[m.name] || '',
        id: rowData[m.id] || '',
        branch: rowData[m.branch] || '',
        dob: rowData[m.dob] || '',
        bloodGroup: rowData[m.bloodGroup] || ''
    };

    // Get photo
    const photoName = m.photo ? rowData[m.photo] : null;
    const photoImg = photoName ? state.photos.get(photoName) : null;

    // Use built-in template if selected
    if (state.selectedTemplateId && CARD_TEMPLATES[state.selectedTemplateId]) {
        const tmpl = CARD_TEMPLATES[state.selectedTemplateId];
        canvas.width = tmpl.width;
        canvas.height = tmpl.height;
        const ctx = canvas.getContext('2d');
        tmpl.render(ctx, tmpl.width, tmpl.height, data, photoImg);
        return;
    }

    // Fallback: custom template image with simple overlay
    if (state.templateImg) {
        const template = state.templateImg;
        canvas.width = template.width;
        canvas.height = template.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(template, 0, 0);

        // Draw photo
        if (photoImg) {
            const pX = 50, pY = template.height * 0.25, pW = 225, pH = 275;
            ctx.drawImage(photoImg, pX, pY, pW, pH);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(pX, pY, pW, pH);
        }

        // Draw text
        const tX = 320;
        let tY = template.height * 0.28;
        const lH = 60;
        const fields = [
            { label: 'Name', value: data.name },
            { label: 'ID', value: data.id },
            { label: 'Branch', value: data.branch },
            { label: 'DOB', value: data.dob },
            { label: 'Blood Group', value: data.bloodGroup }
        ];
        fields.forEach((f, i) => {
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.fillText(f.label + ':', tX, tY + i * lH);
            ctx.fillStyle = '#111';
            ctx.font = 'bold 24px Arial';
            ctx.fillText(f.value || '—', tX, tY + i * lH + 28);
        });

        // Draw barcode
        if (data.id) {
            try {
                const bc = document.createElement('canvas');
                JsBarcode(bc, String(data.id), { format: 'CODE128', width: 2, height: 50, displayValue: true, fontSize: 16, margin: 0, background: 'transparent' });
                ctx.drawImage(bc, 55, template.height * 0.75);
            } catch (e) {}
        }
    }
}

// ==================== GENERATION ====================
async function generateAllCards() {
    const hasTemplate = !!state.selectedTemplateId || !!state.templateImg;
    if (!hasTemplate || state.csvData.length === 0) {
        showToast('Please select a template and upload CSV data first.', 'error');
        return;
    }

    const btn = document.getElementById('generate-btn');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ Generating...</span>';

    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    progressContainer.style.display = 'flex';

    const resultsGrid = document.getElementById('results-grid');
    resultsGrid.innerHTML = '';
    state.generatedCards = [];

    const total = state.csvData.length;

    for (let i = 0; i < total; i++) {
        const row = state.csvData[i];
        const name = row[state.mapping.name] || `Card_${i + 1}`;
        const id = row[state.mapping.id] || `${i + 1}`;

        const canvas = document.createElement('canvas');
        renderCard(canvas, row);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const blob = await canvasToBlob(canvas, 'image/jpeg', 0.95);
        state.generatedCards.push({ name, id, dataUrl, blob });

        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <img src="${dataUrl}" alt="${escapeHtml(name)}">
            <div class="result-card-info">
                <span title="${escapeHtml(name)}">${escapeHtml(name)}</span>
                <button onclick="downloadCard(${i})">⬇ Download</button>
            </div>`;
        resultsGrid.appendChild(card);

        const pct = Math.round(((i + 1) / total) * 100);
        progressFill.style.width = `${pct}%`;
        progressText.textContent = `${pct}%`;
        if (i % 5 === 0) await sleep(10);
    }

    btn.disabled = false;
    btn.innerHTML = '<span>🚀 Regenerate All Cards</span>';
    document.getElementById('download-zip-btn').style.display = 'inline-flex';
    document.getElementById('generate-title').textContent = 'Generation Complete!';
    document.getElementById('generate-subtitle').textContent = `${total} cards generated successfully`;
    showToast(`✅ Successfully generated ${total} ID cards!`, 'success');
}

// ==================== DOWNLOAD ====================
function downloadCard(index) {
    const card = state.generatedCards[index];
    if (!card) return;
    const link = document.createElement('a');
    link.href = card.dataUrl;
    link.download = `${sanitizeFilename(card.id)}_${sanitizeFilename(card.name)}.jpg`;
    link.click();
}

async function downloadAllAsZip() {
    if (state.generatedCards.length === 0) { showToast('No cards to download.', 'error'); return; }
    const btn = document.getElementById('download-zip-btn');
    btn.disabled = true;
    btn.innerHTML = '<span>📦 Creating ZIP...</span>';
    try {
        const zip = new JSZip();
        const folder = zip.folder('ID_Cards');
        state.generatedCards.forEach((card) => {
            const filename = `${sanitizeFilename(card.id)}_${sanitizeFilename(card.name)}.jpg`;
            folder.file(filename, card.blob);
        });
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'ID_Cards.zip');
        showToast(`📦 Downloaded ${state.generatedCards.length} cards as ZIP!`, 'success');
    } catch (e) { showToast(`Failed to create ZIP: ${e.message}`, 'error'); }
    btn.disabled = false;
    btn.innerHTML = '<span>📦 Download ZIP</span>';
}

// ==================== UTILITIES ====================
function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => { canvas.toBlob((blob) => resolve(blob), type, quality); });
}
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function escapeHtml(str) { const div = document.createElement('div'); div.textContent = str || ''; return div.innerHTML; }
function sanitizeFilename(name) { return String(name || 'unknown').replace(/[^a-zA-Z0-9_\-\.]/g, '_').substring(0, 50); }

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('toast-exit'); setTimeout(() => toast.remove(), 300); }, 4000);
}

// ==================== SCROLL EFFECTS ====================
function setupScrollEffects() {
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        nav.style.padding = window.scrollY > 100 ? '8px 0' : '16px 0';
    });
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)'; }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.step-card, .upload-card, .config-section').forEach(el => {
        el.style.opacity = '0'; el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
}
