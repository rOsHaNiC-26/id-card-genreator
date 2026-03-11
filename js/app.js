/* ============================================================
   ID CARD GENERATOR — APPLICATION LOGIC
   ============================================================ */

// ==================== STATE ====================
const state = {
    templateImg: null,       // HTMLImageElement
    templateFile: null,      // File object
    csvData: [],             // Array of row objects
    csvColumns: [],          // Column names from CSV
    photos: new Map(),       // filename -> HTMLImageElement
    photoFiles: new Map(),   // filename -> File object
    generatedCards: [],      // Array of { name, id, dataUrl, blob }
    currentPreview: 0,       // Index of currently previewed card

    // Column mapping
    mapping: {
        name: '',
        id: '',
        branch: '',
        dob: '',
        bloodGroup: '',
        photo: ''
    },

    // Layout configuration
    config: {
        photo: { enabled: true, x: 30, y: 235, w: 210, h: 260 },
        text: {
            enabled: true, x: 360, y: 175,
            size: 28, lineHeight: 50,
            color: '#000000', font: 'Arial',
            boldFirst: true, showLabels: true
        },
        barcode: { enabled: true, x: 56, y: 528, h: 80, format: 'CODE39' }
    }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    setupDragDrop();
    setupFileInputs();
    setupConfigListeners();
    setupScrollEffects();
});

// ==================== DRAG & DROP ====================
function setupDragDrop() {
    const zones = document.querySelectorAll('.upload-zone');

    zones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            const type = zone.dataset.type;
            const files = e.dataTransfer.files;

            if (type === 'template' && files.length) handleTemplateFile(files[0]);
            else if (type === 'csv' && files.length) handleCSVFile(files[0]);
            else if (type === 'photos' && files.length) handlePhotoFiles(files);
        });

        zone.addEventListener('click', (e) => {
            // Don't trigger file input if clicking the button (button handles it)
            if (e.target.tagName === 'BUTTON') return;
            const type = zone.dataset.type;
            if (type === 'template') document.getElementById('template-input').click();
            else if (type === 'csv') document.getElementById('csv-input').click();
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

// ==================== FILE HANDLERS ====================
function handleTemplateFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file for the template.', 'error');
        return;
    }

    state.templateFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            state.templateImg = img;
            showTemplatePreview(e.target.result, `${file.name} (${img.width}×${img.height})`);
            showToast(`Template loaded: ${img.width}×${img.height}px`, 'success');
            checkReadyState();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

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

            // Show preview
            document.querySelector('#upload-csv .upload-zone').style.display = 'none';
            const preview = document.getElementById('csv-preview');
            preview.style.display = 'block';
            document.getElementById('csv-name').textContent = file.name;
            document.getElementById('csv-rows').textContent = `${state.csvData.length} records found`;

            // Auto-detect column mapping
            autoMapColumns();
            showColumnMapping();

            showToast(`CSV loaded: ${state.csvData.length} records with ${state.csvColumns.length} columns`, 'success');
            checkReadyState();
        },
        error: (err) => {
            showToast(`Failed to parse CSV: ${err.message}`, 'error');
        }
    });
}

function handlePhotoFiles(files) {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
        showToast('No valid image files found.', 'error');
        return;
    }

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

                // Add thumbnail
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
// Select a built-in template from the gallery
function selectBuiltInTemplate(element) {
    const templatePath = element.dataset.template;

    // Update selection UI
    document.querySelectorAll('.template-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        state.templateImg = img;
        state.templateFile = null;
        const name = element.querySelector('.template-name').textContent;
        showTemplatePreview(templatePath, `${name} (${img.width}×${img.height})`);
        showToast(`Template selected: ${name}`, 'success');
        checkReadyState();
    };
    img.onerror = () => {
        showToast('Failed to load template image.', 'error');
    };
    img.src = templatePath;
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
    document.querySelectorAll('.template-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById('template-selector').style.display = 'block';
    document.getElementById('template-preview').style.display = 'none';
    document.getElementById('template-input').value = '';
    checkReadyState();
}

function removeTemplate() {
    state.templateImg = null;
    state.templateFile = null;
    document.querySelectorAll('.template-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById('template-selector').style.display = 'block';
    document.getElementById('template-preview').style.display = 'none';
    document.getElementById('template-input').value = '';
    checkReadyState();
}

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
    const mapping = state.mapping;

    // Name
    mapping.name = findColumn(cols, ['name', 'full name', 'student name', 'fullname']);
    // ID
    mapping.id = findColumn(cols, ['erp number', 'id', 'student id', 'roll number', 'roll no', 'enrollment', 'erp']);
    // Branch
    mapping.branch = findColumn(cols, ['branch', 'department', 'dept', 'course', 'program']);
    // DOB
    mapping.dob = findColumn(cols, ['date of birth', 'dob', 'birth date', 'birthdate']);
    // Blood Group
    mapping.bloodGroup = findColumn(cols, ['blood group', 'bloodgroup', 'blood_group', 'blood type']);
    // Photo
    mapping.photo = findColumn(cols, ['photo for id card', 'photo', 'image', 'picture', 'photo_path', 'photo file']);
}

function findColumn(columns, keywords) {
    for (const keyword of keywords) {
        const idx = columns.indexOf(keyword);
        if (idx !== -1) return state.csvColumns[idx];
    }
    // Partial match
    for (const keyword of keywords) {
        const idx = columns.findIndex(c => c.includes(keyword));
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
        { key: 'branch', label: '🏫 Branch / Department', required: false },
        { key: 'dob', label: '📅 Date of Birth', required: false },
        { key: 'bloodGroup', label: '🩸 Blood Group', required: false },
        { key: 'photo', label: '📸 Photo Filename', required: false }
    ];

    grid.innerHTML = fields.map(field => {
        const options = state.csvColumns.map(col =>
            `<option value="${escapeHtml(col)}" ${state.mapping[field.key] === col ? 'selected' : ''}>${escapeHtml(col)}</option>`
        ).join('');

        return `
            <div class="mapping-item">
                <label>${field.label} ${field.required ? '<span style="color:var(--error)">*</span>' : ''}</label>
                <select onchange="updateMapping('${field.key}', this.value)">
                    <option value="">— Select Column —</option>
                    ${options}
                </select>
            </div>
        `;
    }).join('');
}

function updateMapping(key, value) {
    state.mapping[key] = value;
    updatePreview();
}

// ==================== CONFIG LISTENERS ====================
function setupConfigListeners() {
    const configInputs = [
        'photo-x', 'photo-y', 'photo-w', 'photo-h',
        'text-x', 'text-y', 'text-size', 'text-lh', 'text-color', 'text-font',
        'barcode-x', 'barcode-y', 'barcode-h', 'barcode-format'
    ];

    configInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                syncConfigFromUI();
                updatePreview();
            });
            el.addEventListener('change', () => {
                syncConfigFromUI();
                updatePreview();
            });
        }
    });

    // Toggle switches
    ['toggle-photo', 'toggle-text', 'toggle-barcode', 'text-bold-first', 'text-show-labels'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                syncConfigFromUI();
                updatePreview();
            });
        }
    });
}

function syncConfigFromUI() {
    const c = state.config;
    c.photo.enabled = document.getElementById('toggle-photo').checked;
    c.photo.x = int('photo-x');
    c.photo.y = int('photo-y');
    c.photo.w = int('photo-w');
    c.photo.h = int('photo-h');

    c.text.enabled = document.getElementById('toggle-text').checked;
    c.text.x = int('text-x');
    c.text.y = int('text-y');
    c.text.size = int('text-size');
    c.text.lineHeight = int('text-lh');
    c.text.color = document.getElementById('text-color').value;
    c.text.font = document.getElementById('text-font').value;
    c.text.boldFirst = document.getElementById('text-bold-first').checked;
    c.text.showLabels = document.getElementById('text-show-labels').checked;

    c.barcode.enabled = document.getElementById('toggle-barcode').checked;
    c.barcode.x = int('barcode-x');
    c.barcode.y = int('barcode-y');
    c.barcode.h = int('barcode-h');
    c.barcode.format = document.getElementById('barcode-format').value;
}

function int(id) {
    return parseInt(document.getElementById(id).value, 10) || 0;
}

// ==================== STATE CHECK ====================
function checkReadyState() {
    const hasTemplate = !!state.templateImg;
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
    if (!state.templateImg || state.csvData.length === 0) return;

    const idx = state.currentPreview;
    const row = state.csvData[idx];
    if (!row) return;

    const canvas = document.getElementById('preview-canvas');
    renderCard(canvas, row);

    // Update counter
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
    const template = state.templateImg;
    canvas.width = template.width;
    canvas.height = template.height;
    const ctx = canvas.getContext('2d');

    // 1. Draw template background
    ctx.drawImage(template, 0, 0);

    const m = state.mapping;
    const c = state.config;

    // 2. Draw Photo
    if (c.photo.enabled && m.photo) {
        const photoName = rowData[m.photo];
        const photoImg = state.photos.get(photoName);
        if (photoImg) {
            ctx.drawImage(photoImg, c.photo.x, c.photo.y, c.photo.w, c.photo.h);
            // Border
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(c.photo.x, c.photo.y, c.photo.w, c.photo.h);
        } else {
            // Placeholder
            ctx.fillStyle = 'rgba(200,200,200,0.3)';
            ctx.fillRect(c.photo.x, c.photo.y, c.photo.w, c.photo.h);
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1;
            ctx.strokeRect(c.photo.x, c.photo.y, c.photo.w, c.photo.h);
            ctx.fillStyle = '#888';
            ctx.font = `${Math.min(c.photo.w, c.photo.h) * 0.12}px ${c.text.font}`;
            ctx.textAlign = 'center';
            ctx.fillText('No Photo', c.photo.x + c.photo.w / 2, c.photo.y + c.photo.h / 2);
            ctx.textAlign = 'start';
        }
    }

    // 3. Draw Text Fields
    if (c.text.enabled) {
        const fields = [];
        if (m.name) fields.push({ label: 'Name', value: rowData[m.name] || '' });
        if (m.id) fields.push({ label: 'ID', value: rowData[m.id] || '' });
        if (m.branch) fields.push({ label: 'Branch', value: rowData[m.branch] || '' });
        if (m.dob) fields.push({ label: 'DOB', value: rowData[m.dob] || '' });
        if (m.bloodGroup) fields.push({ label: 'Blood Group', value: rowData[m.bloodGroup] || '' });

        let y = c.text.y;
        fields.forEach((field, i) => {
            const isBold = c.text.boldFirst && i === 0;
            ctx.font = `${isBold ? 'bold ' : ''}${c.text.size}px ${c.text.font}`;
            ctx.fillStyle = c.text.color;

            const text = c.text.showLabels
                ? `${field.label} : ${field.value}`
                : field.value;

            ctx.fillText(text, c.text.x, y + c.text.size);
            y += c.text.lineHeight;
        });
    }

    // 4. Draw Barcode
    if (c.barcode.enabled && m.id) {
        const idValue = rowData[m.id];
        if (idValue) {
            try {
                const barcodeCanvas = document.createElement('canvas');
                JsBarcode(barcodeCanvas, String(idValue), {
                    format: c.barcode.format,
                    width: 1.5,
                    height: c.barcode.h,
                    displayValue: false,
                    margin: 0,
                    background: 'transparent'
                });
                ctx.drawImage(barcodeCanvas, c.barcode.x, c.barcode.y);
            } catch (e) {
                // Barcode generation might fail for some formats with invalid data
                ctx.fillStyle = '#888';
                ctx.font = `12px ${c.text.font}`;
                ctx.fillText(`[Barcode: ${idValue}]`, c.barcode.x, c.barcode.y + 20);
            }
        }
    }
}

// ==================== GENERATION ====================
async function generateAllCards() {
    if (!state.templateImg || state.csvData.length === 0) {
        showToast('Please upload a template and CSV file first.', 'error');
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

        // Render card
        const canvas = document.createElement('canvas');
        renderCard(canvas, row);

        // Convert to blob
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const blob = await canvasToBlob(canvas, 'image/jpeg', 0.95);

        state.generatedCards.push({ name, id, dataUrl, blob });

        // Add to results grid
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <img src="${dataUrl}" alt="${escapeHtml(name)}">
            <div class="result-card-info">
                <span title="${escapeHtml(name)}">${escapeHtml(name)}</span>
                <button onclick="downloadCard(${i})">⬇ Download</button>
            </div>
        `;
        resultsGrid.appendChild(card);

        // Update progress
        const pct = Math.round(((i + 1) / total) * 100);
        progressFill.style.width = `${pct}%`;
        progressText.textContent = `${pct}%`;

        // Yield to the main thread periodically
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
    if (state.generatedCards.length === 0) {
        showToast('No cards to download. Generate cards first.', 'error');
        return;
    }

    const btn = document.getElementById('download-zip-btn');
    btn.disabled = true;
    btn.innerHTML = '<span>📦 Creating ZIP...</span>';

    try {
        const zip = new JSZip();
        const folder = zip.folder('ID_Cards');

        state.generatedCards.forEach((card, i) => {
            const filename = `${sanitizeFilename(card.id)}_${sanitizeFilename(card.name)}.jpg`;
            folder.file(filename, card.blob);
        });

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'ID_Cards.zip');

        showToast(`📦 Downloaded ${state.generatedCards.length} cards as ZIP!`, 'success');
    } catch (e) {
        showToast(`Failed to create ZIP: ${e.message}`, 'error');
    }

    btn.disabled = false;
    btn.innerHTML = '<span>📦 Download ZIP</span>';
}

// ==================== UTILITIES ====================
function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), type, quality);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function sanitizeFilename(name) {
    return String(name || 'unknown').replace(/[^a-zA-Z0-9_\-\.]/g, '_').substring(0, 50);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==================== SCROLL EFFECTS ====================
function setupScrollEffects() {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        const scroll = window.scrollY;

        if (scroll > 100) {
            nav.style.padding = '8px 0';
        } else {
            nav.style.padding = '16px 0';
        }
        lastScroll = scroll;
    });

    // Intersection Observer for animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.step-card, .upload-card, .config-section').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
}
