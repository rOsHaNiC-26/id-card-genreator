/* ============================================================
   ID CARD GENERATOR — BUILT-IN TEMPLATE DEFINITIONS
   Each template draws a complete ID card using Canvas API
   ============================================================ */

// ==================== HELPERS ====================
function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawCardBorder(ctx, w, h, radius) {
    roundedRect(ctx, 0, 0, w, h, radius);
    ctx.clip();
}

function drawBarcode(ctx, value, x, y, height) {
    if (!value) return;
    try {
        const bc = document.createElement('canvas');
        JsBarcode(bc, String(value), {
            format: 'CODE128',
            width: 2,
            height: height || 50,
            displayValue: true,
            fontSize: 16,
            margin: 0,
            background: 'transparent',
            lineColor: '#222222'
        });
        ctx.drawImage(bc, x, y);
    } catch (e) {
        ctx.fillStyle = '#888';
        ctx.font = '14px Arial';
        ctx.fillText(`ID: ${value}`, x, y + 20);
    }
}

function drawPhoto(ctx, photoImg, x, y, w, h, borderColor, borderWidth) {
    if (photoImg) {
        ctx.save();
        roundedRect(ctx, x, y, w, h, 6);
        ctx.clip();
        ctx.drawImage(photoImg, x, y, w, h);
        ctx.restore();
    } else {
        ctx.fillStyle = '#e8e8ee';
        roundedRect(ctx, x, y, w, h, 6);
        ctx.fill();
        ctx.fillStyle = '#aaaabb';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PHOTO', x + w / 2, y + h / 2 - 6);
        ctx.font = '12px Arial';
        ctx.fillText('Not Found', x + w / 2, y + h / 2 + 14);
        ctx.textAlign = 'start';
    }
    // Border
    ctx.strokeStyle = borderColor || '#333';
    ctx.lineWidth = borderWidth || 3;
    roundedRect(ctx, x, y, w, h, 6);
    ctx.stroke();
}


// ==================== TEMPLATE DEFINITIONS ====================
const CARD_TEMPLATES = {

    // ──────────────────── CORPORATE BLUE ────────────────────
    corporate_blue: {
        name: 'Corporate Blue',
        tag: 'Professional',
        width: 1050,
        height: 660,
        render(ctx, w, h, data, photoImg) {
            // --- Card background ---
            ctx.fillStyle = '#ffffff';
            roundedRect(ctx, 0, 0, w, h, 20);
            ctx.fill();
            ctx.save();
            drawCardBorder(ctx, w, h, 20);

            // --- Header bar ---
            const hdrH = 125;
            const hdrGrad = ctx.createLinearGradient(0, 0, w, 0);
            hdrGrad.addColorStop(0, '#0a1e4a');
            hdrGrad.addColorStop(0.6, '#122d6e');
            hdrGrad.addColorStop(1, '#1a3a8a');
            ctx.fillStyle = hdrGrad;
            ctx.fillRect(0, 0, w, hdrH);

            // Decorative diagonal
            ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
            ctx.beginPath();
            ctx.moveTo(w * 0.55, 0);
            ctx.lineTo(w, 0);
            ctx.lineTo(w, hdrH);
            ctx.lineTo(w * 0.42, hdrH);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
            ctx.beginPath();
            ctx.moveTo(w * 0.65, 0);
            ctx.lineTo(w, 0);
            ctx.lineTo(w, hdrH * 0.6);
            ctx.closePath();
            ctx.fill();

            // Header text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 38px Arial, sans-serif';
            ctx.fillText('EMPLOYEE ID CARD', 40, 55);
            ctx.font = '20px Arial, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            ctx.fillText('Organization Name', 40, 90);

            // Accent line below header
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(0, hdrH, w, 5);

            // --- Photo ---
            const pX = 50, pY = 165, pW = 225, pH = 275;
            drawPhoto(ctx, photoImg, pX, pY, pW, pH, '#0a1e4a', 3);

            // --- Text Fields ---
            const tX = 320, startY = 185;
            const lH = 75;
            const fields = [
                { label: 'NAME', value: data.name },
                { label: 'ID NUMBER', value: data.id },
                { label: 'DEPARTMENT', value: data.branch },
                { label: 'DATE OF BIRTH', value: data.dob },
                { label: 'BLOOD GROUP', value: data.bloodGroup }
            ];

            fields.forEach((f, i) => {
                const y = startY + i * lH;
                // Label
                ctx.fillStyle = '#6b7280';
                ctx.font = '600 15px Arial, sans-serif';
                ctx.letterSpacing = '1px';
                ctx.fillText(f.label, tX, y);
                // Value
                ctx.fillStyle = '#111827';
                ctx.font = 'bold 24px Arial, sans-serif';
                ctx.fillText(f.value || '—', tX, y + 30);
                // Separator line
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(tX, y + 42);
                ctx.lineTo(w - 50, y + 42);
                ctx.stroke();
            });

            // --- Barcode ---
            drawBarcode(ctx, data.id, 55, 470, 50);

            // --- Footer bar ---
            ctx.fillStyle = '#0a1e4a';
            ctx.fillRect(0, h - 55, w, 55);
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '13px Arial, sans-serif';
            ctx.fillText('This card is the property of the organization. If found, please return.', 40, h - 22);

            ctx.restore();
        }
    },

    // ──────────────────── COLLEGE GREEN ────────────────────
    college_green: {
        name: 'College Green',
        tag: 'Academic',
        width: 1050,
        height: 660,
        render(ctx, w, h, data, photoImg) {
            // --- Background ---
            ctx.fillStyle = '#fafdf7';
            roundedRect(ctx, 0, 0, w, h, 20);
            ctx.fill();
            ctx.save();
            drawCardBorder(ctx, w, h, 20);

            // --- Header ---
            const hdrH = 130;
            const hGrad = ctx.createLinearGradient(0, 0, w, 0);
            hGrad.addColorStop(0, '#064e3b');
            hGrad.addColorStop(1, '#047857');
            ctx.fillStyle = hGrad;
            ctx.fillRect(0, 0, w, hdrH);

            // Gold border lines
            ctx.strokeStyle = '#d4a837';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, hdrH - 4);
            ctx.lineTo(w, hdrH - 4);
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, hdrH - 10);
            ctx.lineTo(w, hdrH - 10);
            ctx.stroke();

            // Header text - centered
            ctx.textAlign = 'center';
            ctx.fillStyle = '#d4a837';
            ctx.font = 'bold 18px Arial, sans-serif';
            ctx.fillText('★  STUDENT IDENTITY CARD  ★', w / 2, 35);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Georgia, serif';
            ctx.fillText('COLLEGE OF ENGINEERING', w / 2, 78);
            ctx.font = '18px Arial, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillText('Accredited Institution • Established 2000', w / 2, 108);
            ctx.textAlign = 'start';

            // --- Photo with green border ---
            const pX = 55, pY = 170, pW = 220, pH = 270;
            drawPhoto(ctx, photoImg, pX, pY, pW, pH, '#064e3b', 4);

            // Decorative frame around photo
            ctx.strokeStyle = '#d4a837';
            ctx.lineWidth = 1;
            roundedRect(ctx, pX - 6, pY - 6, pW + 12, pH + 12, 8);
            ctx.stroke();

            // --- Fields ---
            const tX = 320, startY = 190;
            const lH = 72;
            const fields = [
                { label: 'Student Name', value: data.name },
                { label: 'Roll Number', value: data.id },
                { label: 'Branch', value: data.branch },
                { label: 'Date of Birth', value: data.dob },
                { label: 'Blood Group', value: data.bloodGroup }
            ];

            fields.forEach((f, i) => {
                const y = startY + i * lH;
                ctx.fillStyle = '#374151';
                ctx.font = '600 16px Arial, sans-serif';
                ctx.fillText(f.label + ':', tX, y);
                ctx.fillStyle = '#064e3b';
                ctx.font = 'bold 25px Georgia, serif';
                ctx.fillText(f.value || '—', tX + 8, y + 32);
                // Dotted separator
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = '#c0d0c0';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(tX, y + 45);
                ctx.lineTo(w - 50, y + 45);
                ctx.stroke();
                ctx.setLineDash([]);
            });

            // --- Barcode ---
            drawBarcode(ctx, data.id, 60, 475, 45);

            // --- Footer ---
            const fGrad = ctx.createLinearGradient(0, h - 55, w, h - 55);
            fGrad.addColorStop(0, '#064e3b');
            fGrad.addColorStop(1, '#047857');
            ctx.fillStyle = fGrad;
            ctx.fillRect(0, h - 55, w, 55);
            ctx.strokeStyle = '#d4a837';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, h - 55); ctx.lineTo(w, h - 55); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '13px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Valid for the current academic year only. Not transferable.', w / 2, h - 22);
            ctx.textAlign = 'start';

            ctx.restore();
        }
    },

    // ──────────────────── MODERN PURPLE ────────────────────
    modern_purple: {
        name: 'Modern Purple',
        tag: 'Trendy',
        width: 1050,
        height: 660,
        render(ctx, w, h, data, photoImg) {
            // --- Gradient background ---
            ctx.save();
            roundedRect(ctx, 0, 0, w, h, 24);
            ctx.clip();

            const bgGrad = ctx.createLinearGradient(0, 0, w, h);
            bgGrad.addColorStop(0, '#1e1145');
            bgGrad.addColorStop(0.5, '#2d1b69');
            bgGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            // Decorative circles
            ctx.fillStyle = 'rgba(139, 92, 246, 0.08)';
            ctx.beginPath(); ctx.arc(w * 0.85, h * 0.15, 200, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(99, 102, 241, 0.06)';
            ctx.beginPath(); ctx.arc(w * 0.1, h * 0.9, 180, 0, Math.PI * 2); ctx.fill();

            // Wave decoration
            ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
            ctx.beginPath();
            ctx.moveTo(0, h * 0.7);
            ctx.quadraticCurveTo(w * 0.3, h * 0.55, w * 0.5, h * 0.7);
            ctx.quadraticCurveTo(w * 0.7, h * 0.85, w, h * 0.65);
            ctx.lineTo(w, h); ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fill();

            // --- Header ---
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = 'bold 34px Arial, sans-serif';
            ctx.fillText('IDENTITY CARD', 50, 60);
            ctx.fillStyle = 'rgba(167, 139, 250, 0.8)';
            ctx.font = '17px Arial, sans-serif';
            ctx.fillText('ORGANIZATION NAME', 50, 90);

            // Accent line
            const acGrad = ctx.createLinearGradient(50, 0, 350, 0);
            acGrad.addColorStop(0, '#8b5cf6');
            acGrad.addColorStop(1, 'rgba(139,92,246,0)');
            ctx.strokeStyle = acGrad;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(50, 105); ctx.lineTo(350, 105); ctx.stroke();

            // --- Photo - rounded square ---
            const pX = 55, pY = 140, pW = 230, pH = 275;
            if (photoImg) {
                ctx.save();
                roundedRect(ctx, pX, pY, pW, pH, 16);
                ctx.clip();
                ctx.drawImage(photoImg, pX, pY, pW, pH);
                ctx.restore();
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                roundedRect(ctx, pX, pY, pW, pH, 16);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('PHOTO', pX + pW / 2, pY + pH / 2);
                ctx.textAlign = 'start';
            }
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
            ctx.lineWidth = 3;
            roundedRect(ctx, pX, pY, pW, pH, 16);
            ctx.stroke();

            // --- Fields ---
            const tX = 330, startY = 155;
            const lH = 78;
            const fields = [
                { label: 'FULL NAME', value: data.name },
                { label: 'ID NUMBER', value: data.id },
                { label: 'DEPARTMENT', value: data.branch },
                { label: 'DATE OF BIRTH', value: data.dob },
                { label: 'BLOOD GROUP', value: data.bloodGroup }
            ];

            fields.forEach((f, i) => {
                const y = startY + i * lH;
                // Glass-like field background
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                roundedRect(ctx, tX - 10, y - 8, w - tX - 30, 62, 8);
                ctx.fill();

                ctx.fillStyle = 'rgba(167, 139, 250, 0.8)';
                ctx.font = '600 13px Arial, sans-serif';
                ctx.fillText(f.label, tX, y + 8);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px Arial, sans-serif';
                ctx.fillText(f.value || '—', tX, y + 40);
            });

            // --- Barcode ---
            drawBarcode(ctx, data.id, 60, 450, 45);
            // White barcode label
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '12px Arial';

            // --- Footer accent ---
            ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
            ctx.fillRect(0, h - 40, w, 40);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '12px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('All data is confidential. Unauthorized use is prohibited.', w / 2, h - 14);
            ctx.textAlign = 'start';

            ctx.restore();
        }
    },

    // ──────────────────── MINIMAL RED ────────────────────
    minimal_red: {
        name: 'Minimal Red',
        tag: 'Clean',
        width: 1050,
        height: 660,
        render(ctx, w, h, data, photoImg) {
            // --- White background ---
            ctx.save();
            roundedRect(ctx, 0, 0, w, h, 16);
            ctx.clip();
            ctx.fillStyle = '#fcfcfd';
            ctx.fillRect(0, 0, w, h);

            // Subtle grid watermark
            ctx.strokeStyle = 'rgba(0,0,0,0.02)';
            ctx.lineWidth = 1;
            for (let i = 0; i < w; i += 30) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
            }
            for (let j = 0; j < h; j += 30) {
                ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke();
            }

            // --- Red accent bar at top ---
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(0, 0, w, 8);

            // --- Header area ---
            ctx.fillStyle = '#f9fafb';
            ctx.fillRect(0, 8, w, 105);
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, 113); ctx.lineTo(w, 113); ctx.stroke();

            // Header text
            ctx.fillStyle = '#dc2626';
            ctx.font = 'bold 14px Arial, sans-serif';
            ctx.fillText('IDENTIFICATION CARD', 40, 42);
            ctx.fillStyle = '#111827';
            ctx.font = 'bold 32px Arial, sans-serif';
            ctx.fillText('Organization Name', 40, 82);
            ctx.fillStyle = '#9ca3af';
            ctx.font = '14px Arial, sans-serif';
            ctx.fillText('Department of Administration', 40, 104);

            // Red circle accent top-right
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(w - 60, 60, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ID', w - 60, 67);
            ctx.textAlign = 'start';

            // --- Photo ---
            const pX = 50, pY = 145, pW = 210, pH = 260;
            drawPhoto(ctx, photoImg, pX, pY, pW, pH, '#dc2626', 2);

            // --- Fields ---
            const tX = 310, startY = 158;
            const lH = 70;
            const fields = [
                { label: 'Full Name', value: data.name },
                { label: 'ID Number', value: data.id },
                { label: 'Department', value: data.branch },
                { label: 'Date of Birth', value: data.dob },
                { label: 'Blood Group', value: data.bloodGroup }
            ];

            fields.forEach((f, i) => {
                const y = startY + i * lH;
                ctx.fillStyle = '#9ca3af';
                ctx.font = '500 14px Arial, sans-serif';
                ctx.fillText(f.label, tX, y);
                ctx.fillStyle = '#111827';
                ctx.font = '600 24px Arial, sans-serif';
                ctx.fillText(f.value || '—', tX, y + 30);
                // Clean separator
                ctx.strokeStyle = '#f3f4f6';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(tX, y + 42);
                ctx.lineTo(w - 50, y + 42);
                ctx.stroke();
            });

            // --- Barcode ---
            drawBarcode(ctx, data.id, 55, 440, 45);

            // --- Footer ---
            ctx.fillStyle = '#f9fafb';
            ctx.fillRect(0, h - 50, w, 50);
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, h - 50); ctx.lineTo(w, h - 50); ctx.stroke();
            // Red bottom line
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(0, h - 6, w, 6);
            ctx.fillStyle = '#9ca3af';
            ctx.font = '12px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('This card remains the property of the issuing organization.', w / 2, h - 22);
            ctx.textAlign = 'start';

            // Outer border
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 2;
            roundedRect(ctx, 1, 1, w - 2, h - 2, 16);
            ctx.stroke();

            ctx.restore();
        }
    }
};

// ==================== THUMBNAIL GENERATION ====================
function generateTemplateThumbnails() {
    const sampleData = {
        name: 'Roshani Chaudhari',
        id: '19011011',
        branch: 'Computer Science',
        dob: '15/08/2001',
        bloodGroup: 'B+'
    };

    Object.keys(CARD_TEMPLATES).forEach(id => {
        const tmpl = CARD_TEMPLATES[id];
        const canvas = document.createElement('canvas');
        canvas.width = tmpl.width;
        canvas.height = tmpl.height;
        const ctx = canvas.getContext('2d');
        tmpl.render(ctx, tmpl.width, tmpl.height, sampleData, null);

        // Set the thumbnail image
        const thumbImg = document.getElementById(`thumb-${id}`);
        if (thumbImg) {
            thumbImg.src = canvas.toDataURL('image/png');
        }
    });
}
