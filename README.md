# 🪪 Advanced ID Card Generator (V6)

> **Professional, batch-processed ID cards instantly — 100% in your browser.**

An advanced web application for batch-generating high-quality ID cards. Features built-in premium templates, Excel/CSV support, real-time data editing, and smart photo matching. All processing happens 100% client-side for maximum privacy.

🔗 **Live Demo:** [id-card-generator.vercel.app](https://id-card-genreator.vercel.app)

---

## ✨ Key Features (Latest Updates)

| Feature | Description |
|---------|-------------|
| 🎨 **Premium Templates** | 3 built-in high-quality templates: **Corporate Blue**, **Academic Green**, and **Event Vertical**. |
| 📊 **Excel & CSV Support** | Directly upload `.xlsx`, `.xls`, or `.csv` files using SheetJS integration. |
| 📸 **Smart Photo Linker** | Fuzzy matching matches photos by ID, exact filename, or Student Name (case-insensitive). |
| ✍️ **Live Data Editor** | Edit student/employee details directly in the preview panel before generating. |
| 📄 **PDF Batch Export** | Generate a single print-ready PDF containing all ID cards in one click. |
| 🖼️ **Dynamic Branding** | Upload your own organization logo, principal/MD signatures, and titles dynamically. |
| 🔍 **Diagnostic Panel** | Real-time "Photo Found" status with explicit error messages for missing images. |
| 🔒 **Privacy First** | No server, no database — your data and photos never leave your computer. |

---

## 🚀 The V6 Workflow

1. **Pick a Template:** Choose from Corporate, School, or Event themes.
2. **Customize Branding:** Upload your school logo and principal signature.
3. **Upload Data:** Drop your Excel or CSV file. The app auto-maps your columns.
4. **Upload Photos:** Drag & drop your folder of images. The app links them automatically.
5. **Preview & Edit:** Check each card. Fix typos directly in the app.
6. **Download:** Export everything as a **ZIP (PNGs)** or a **Single PDF**.

---

## 🛠️ Tech Stack

- **Canvas API** — High-precision programmatic rendering.
- **JavaScript (ES6+)** — Core application and template logic.
- **[SheetJS (XLSX)](https://sheetjs.com/)** — Industry-standard Excel parsing.
- **[Papa Parse](https://www.papaparse.com/)** — Robust CSV handling.
- **[jsPDF](https://github.com/parallax/jsPDF)** — Clean PDF generation.
- **[JsBarcode](https://github.com/lindell/JsBarcode)** — Dynamic barcode creation.
- **[JSZip](https://stuk.github.io/jszip/)** — Client-side ZIP compression.
- **CSS3 (Custom)** — Glassmorphism UI with smooth animations and dark theme.

---

## 📁 Updated Structure

```
id-card-generator/
├── index.html           # Main UI with V6 Cache-Busting
├── css/
│   └── style.css        # Premium dark theme and layout
├── js/
│   ├── templates_v6.js  # Programmatic Template Definitions
│   └── app_v6.js        # Core Logic, Photo Matching, Exporting
├── vercel.json          # Deployment config
└── assets/              # Icons and sample assets
```

---

## 📊 Sample Data Format

The app auto-detects columns from Excel/CSV:

| Name | ID | Branch | DOB | Photo |
|------|----|--------|-----|-------|
| Shivani More | 6543 | Computer Sci | 20/03/2003 | shivani.jpg |

**Auto-detected keywords:**
- **Name:** `Full Name`, `Student Name`, `Employee Name`
- **ID:** `Roll No`, `ERP`, `Enrollment`, `Emp ID`
- **Photo:** `Photograph`, `Img`, `ID Photo`, `Profile`

---

## 👩‍💻 Author

**Roshani Chaudhari** — [@rOsHaNiC-26](https://github.com/rOsHaNiC-26)

---

<p align="center">
  Made with ❤️ | 100% Client-Side Processing
</p>
