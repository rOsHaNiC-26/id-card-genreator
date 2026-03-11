/* ============================================================
   ID CARD GENERATOR — ADVANCED TEMPLATE SYSTEM
   Each template defines its own background, fields, and 
   dynamic assets (Logo, Signature, Org Name).
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

function drawBarcode(ctx, value, x, y, height) {
    if (!value) return;
    try {
        const bc = document.createElement('canvas');
        JsBarcode(bc, String(value), {
            format: 'CODE128',
            width: 2,
            height: height || 40,
            displayValue: true,
            fontSize: 14,
            margin: 0,
            background: 'transparent',
            lineColor: '#222222'
        });
        ctx.drawImage(bc, x, y);
    } catch (e) {
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.fillText(`ID: ${value}`, x, y + 20);
    }
}

function drawImg(ctx, img, x, y, w, h, radius = 0) {
    if (!img) return;
    if (radius > 0) {
        ctx.save();
        roundedRect(ctx, x, y, w, h, radius);
        ctx.clip();
        ctx.drawImage(img, x, y, w, h);
        ctx.restore();
    } else {
        ctx.drawImage(img, x, y, w, h);
    }
}

// ==================== TEMPLATE DEFINITIONS ====================
const CARD_TEMPLATES = {

    corporate_blue: {
        id: 'corporate_blue',
        name: 'Corporate Professional',
        tag: 'Corporate',
        width: 1000,
        height: 600,
        assets: [
            { id: 'logo', label: 'Company Logo', type: 'image' },
            { id: 'orgName', label: 'Company Name', type: 'text', default: 'TECH SOLUTIONS INC.' },
            { id: 'signature', label: 'MD Signature', type: 'image' }
        ],
        render(ctx, w, h, data, photoImg, assets) {
            // Background
            ctx.fillStyle = '#ffffff';
            roundedRect(ctx, 0, 0, w, h, 20);
            ctx.fill();
            
            // Header bar
            const hdrGrad = ctx.createLinearGradient(0, 0, w, 0);
            hdrGrad.addColorStop(0, '#0f172a');
            hdrGrad.addColorStop(1, '#1e293b');
            ctx.fillStyle = hdrGrad;
            ctx.fillRect(0, 0, w, 110);
            
            // Logo
            if (assets.logo) drawImg(ctx, assets.logo, 40, 25, 60, 60);
            
            // Org Name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px Inter, Arial';
            ctx.fillText(assets.orgName || 'COMPANY NAME', assets.logo ? 120 : 40, 65);
            
            // Professional decorative lines
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(0, 110, w, 4);
            
            // Photo
            const pX = 60, pY = 160, pW = 220, pH = 260;
            if (photoImg) {
                drawImg(ctx, photoImg, pX, pY, pW, pH, 12);
            } else {
                ctx.fillStyle = '#f1f5f9';
                roundedRect(ctx, pX, pY, pW, pH, 12); ctx.fill();
                ctx.fillStyle = '#94a3b8'; ctx.font = '14px Inter'; ctx.textAlign = 'center';
                ctx.fillText('PHOTO', pX + pW/2, pY + pH/2); ctx.textAlign = 'start';
            }
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2; roundedRect(ctx, pX, pY, pW, pH, 12); ctx.stroke();
            
            // Data Fields
            const tX = 330, startY = 190, gap = 65;
            const fields = [
                { label: 'NAME', val: data.name },
                { label: 'EMPLOYEE ID', val: data.id },
                { label: 'DEPARTMENT', val: data.branch },
                { label: 'BLOOD GROUP', val: data.bloodGroup }
            ];
            
            fields.forEach((f, i) => {
                const y = startY + (i * gap);
                ctx.fillStyle = '#64748b'; ctx.font = 'bold 12px Inter'; ctx.fillText(f.label, tX, y);
                ctx.fillStyle = '#1e293b'; ctx.font = 'bold 24px Inter'; ctx.fillText(f.val || '—', tX, y + 30);
                ctx.strokeStyle = '#f1f5f9'; ctx.beginPath(); ctx.moveTo(tX, y + 42); ctx.lineTo(w - 60, y + 42); ctx.stroke();
            });
            
            // Signature
            if (assets.signature) {
                drawImg(ctx, assets.signature, w - 220, h - 140, 160, 60);
                ctx.fillStyle = '#64748b'; ctx.font = 'italic 12px Inter'; ctx.fillText('Authorized Signatory', w - 190, h - 65);
            }
            
            // Barcode
            drawBarcode(ctx, data.id, 60, 480, 40);
            
            // ID Badge Label
            ctx.fillStyle = '#3b82f6';
            ctx.font = '800 14px Inter';
            ctx.fillText('OFFICIAL IDENTITY', w - 180, 40);
        }
    },

    school_classic: {
        id: 'school_classic',
        name: 'School / College',
        tag: 'Academic',
        width: 1000,
        height: 600,
        assets: [
            { id: 'logo', label: 'School Logo', type: 'image' },
            { id: 'orgName', label: 'School Name', type: 'text', default: 'GREEN VALLEY HIGH SCHOOL' },
            { id: 'address', label: 'School Address', type: 'text', default: 'Mumbai, Maharashtra, India' },
            { id: 'signature', label: 'Principal Signature', type: 'image' }
        ],
        render(ctx, w, h, data, photoImg, assets) {
            // Background
            ctx.fillStyle = '#ffffff'; roundedRect(ctx, 0, 0, w, h, 15); ctx.fill();
            
            // Top Accent
            ctx.fillStyle = '#059669'; ctx.fillRect(0, 0, w, 15);
            
            // Header
            ctx.textAlign = 'center';
            if (assets.logo) drawImg(ctx, assets.logo, (w/2) - 180, 35, 70, 70);
            ctx.fillStyle = '#064e3b'; ctx.font = 'bold 42px Georgia';
            ctx.fillText(assets.orgName || 'SCHOOL NAME', w/2 + 40, 75);
            ctx.fillStyle = '#6b7280'; ctx.font = '16px Inter';
            ctx.fillText(assets.address || 'Address Line', w/2 + 40, 105);
            ctx.textAlign = 'start';
            
            // Student Title
            ctx.fillStyle = '#059669'; ctx.fillRect(0, 130, w, 40);
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px Inter'; ctx.textAlign = 'center';
            ctx.fillText('STUDENT IDENTITY CARD', w/2, 157); ctx.textAlign = 'start';
            
            // Photo with decorative frame
            const pX = 60, pY = 200, pW = 210, pH = 260;
            ctx.fillStyle = '#f9fafb'; roundedRect(ctx, pX - 8, pY - 8, pW + 16, pH + 16, 5); ctx.fill();
            ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1; roundedRect(ctx, pX - 8, pY - 8, pW + 16, pH + 16, 5); ctx.stroke();
            if (photoImg) drawImg(ctx, photoImg, pX, pY, pW, pH, 2);
            else { ctx.fillStyle = '#e5e7eb'; ctx.fillRect(pX, pY, pW, pH); }
            
            // Data
            const tX = 330, startY = 230, gap = 70;
            const fields = [
                { lbl: 'STUDENT NAME', val: data.name },
                { lbl: 'ROLL NUMBER', val: data.id },
                { lbl: 'CLASS / BRANCH', val: data.branch },
                { lbl: 'BLOOD GROUP', val: data.bloodGroup }
            ];
            fields.forEach((f, i) => {
                const y = startY + (i * gap);
                ctx.fillStyle = '#064e3b'; ctx.font = 'bold 14px Inter'; ctx.fillText(f.lbl + ':', tX, y);
                ctx.fillStyle = '#111827'; ctx.font = 'bold 28px Georgia'; ctx.fillText(f.val || '—', tX + 10, y + 35);
            });
            
            // Barcode
            drawBarcode(ctx, data.id, 60, 490, 45);
            
            // Principal Sign
            if (assets.signature) {
                drawImg(ctx, assets.signature, w - 240, h - 160, 180, 70);
                ctx.fillStyle = '#111827'; ctx.font = 'bold 14px Inter'; ctx.fillText('PRINCIPAL', w - 180, h - 60);
            }
            
            ctx.restore();
        }
    },

    modern_event: {
        id: 'modern_event',
        name: 'Event / Visitor',
        tag: 'Events',
        width: 600,
        height: 1000,
        assets: [
            { id: 'logo', label: 'Event Logo', type: 'image' },
            { id: 'orgName', label: 'Event Name', type: 'text', default: 'TECH CONF 2026' },
        ],
        render(ctx, w, h, data, photoImg, assets) {
            // Vertical card
            ctx.fillStyle = '#ffffff'; roundedRect(ctx, 0, 0, w, h, 30); ctx.fill();
            
            // Top design
            const bgGrad = ctx.createLinearGradient(0,0,w,h*0.4);
            bgGrad.addColorStop(0, '#7c3aed'); bgGrad.addColorStop(1, '#4f46e5');
            ctx.fillStyle = bgGrad; roundedRect(ctx, 0, 0, w, h*0.42, 30); ctx.fill();
            
            // Event Details
            ctx.textAlign = 'center';
            if (assets.logo) drawImg(ctx, assets.logo, (w/2) - 40, 40, 80, 80);
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 36px Inter';
            ctx.fillText(assets.orgName || 'EVENT NAME', w/2, 160);
            ctx.font = '16px Inter'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText('VISITOR PASS', w/2, 190);
            
            // Photo - Circular
            const pR = 110, pX = w/2, pY = 360;
            ctx.save();
            ctx.beginPath(); ctx.arc(pX, pY, pR, 0, Math.PI * 2); ctx.clip();
            if (photoImg) ctx.drawImage(photoImg, pX - pR, pY - pR, pR*2, pR*2);
            else { ctx.fillStyle = '#e5e7eb'; ctx.fill(); }
            ctx.restore();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(pX, pY, pR, 0, Math.PI * 2); ctx.stroke();
            
            // User Data
            ctx.fillStyle = '#111827'; ctx.font = 'bold 42px Inter';
            ctx.fillText(data.name || 'GUEST NAME', w/2, 550);
            ctx.fillStyle = '#4f46e5'; ctx.font = '800 24px Inter';
            ctx.fillText(data.branch || 'ATTENDEE', w/2, 600);
            
            // Sub data
            ctx.fillStyle = '#6b7280'; ctx.font = 'bold 16px Inter';
            ctx.fillText('ID: ' + (data.id || '0000'), w/2, 650);
            
            // Separator
            ctx.strokeStyle = '#f3f4f6'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(100, 700); ctx.lineTo(w-100, 700); ctx.stroke();
            
            // Large QR placeholder / Barcode
            drawBarcode(ctx, data.id, (w/2) - 100, 750, 80);
            
            // Valid tag
            ctx.fillStyle = '#7c3aed'; roundedRect(ctx, (w/2) - 80, h - 80, 160, 40, 20); ctx.fill();
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px Inter';
            ctx.fillText('VALID ACCESS', w/2, h - 55);
            
            ctx.textAlign = 'start';
        }
    }
};

// ==================== THUMBNAIL GENERATION ====================
function generateTemplateThumbnails() {
    const sampleData = {
        name: 'Roshani Chaudhari',
        id: '12345678',
        branch: 'Computer Science',
        dob: '15/08/2001',
        bloodGroup: 'B+',
        address: 'Mumbai, India'
    };

    Object.keys(CARD_TEMPLATES).forEach(id => {
        const tmpl = CARD_TEMPLATES[id];
        const canvas = document.createElement('canvas');
        canvas.width = tmpl.width; canvas.height = tmpl.height;
        const ctx = canvas.getContext('2d');
        
        // Render with sample data and no extra assets
        tmpl.render(ctx, tmpl.width, tmpl.height, sampleData, null, {});

        const thumbImg = document.getElementById(`thumb-${id}`);
        if (thumbImg) thumbImg.src = canvas.toDataURL('image/png');
    });
}
