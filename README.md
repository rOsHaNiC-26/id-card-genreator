# 🪪 ID Card Generator

> **Generate professional, print-ready ID cards instantly — right in your browser.**

A powerful web application that lets you batch-generate college/employee ID cards by uploading a template image, CSV data, and student photos. Zero server needed — all processing happens 100% client-side.

🔗 **Live Demo:** [id-card-generator.vercel.app](https://id-card-genreator.vercel.app)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🖼️ **Template Upload** | Use any custom ID card background image (PNG, JPG, WEBP) |
| 📊 **CSV Batch Processing** | Upload a CSV file with student/employee data for bulk generation |
| 📸 **Photo Integration** | Drag & drop passport-size photos, auto-matched by filename from CSV |
| 📋 **Smart Column Mapping** | Auto-detects CSV columns (Name, ID, Branch, DOB, Blood Group, Photo) |
| ⚙️ **Configurable Layout** | Position photo, text, and barcode anywhere on the template with live controls |
| 👁️ **Live Preview** | See cards update in real time as you adjust settings |
| 📊 **Barcode Generation** | Supports Code 39, Code 128, and EAN-13 barcode formats |
| 📦 **Batch Download** | Download individual cards or all at once as a ZIP file |
| 🔒 **Privacy First** | 100% client-side — your data never leaves your browser |
| 📱 **Responsive Design** | Works on desktop, tablet, and mobile devices |

---

## 🚀 How It Works

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────┐
│  1. Upload   │ ──► │  2. Configure    │ ──► │  3. Download   │
│  Template,   │     │  Layout, map     │     │  Individual or │
│  CSV, Photos │     │  columns, preview│     │  batch as ZIP  │
└──────────────┘     └──────────────────┘     └────────────────┘
```

1. **Upload** your ID card template image, student data CSV, and passport photos
2. **Configure** the layout — position text, photos, and barcodes on the template
3. **Generate & Download** — preview cards, then download individually or as a ZIP

---

## 📁 Project Structure

```
id-card-generator/
├── index.html          # Main web application page
├── css/
│   └── style.css       # Premium dark theme styling
├── js/
│   └── app.js          # Core application logic (canvas rendering, file handling)
├── vercel.json         # Vercel deployment config
├── main.py             # Original Python CLI version (imgkit + OpenCV)
├── main_simple.py      # Simplified Python version (Pillow-based)
├── data.csv            # Sample CSV data
├── front2.png          # Sample ID card template
├── photos/             # Student photo directory
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

---

## 🛠️ Tech Stack

### Web App (Primary)
- **HTML5 Canvas** — Client-side image composition and rendering
- **JavaScript (ES6+)** — Application logic, file handling, state management
- **CSS3** — Premium dark theme with glassmorphism and animations
- **[Papa Parse](https://www.papaparse.com/)** — CSV parsing
- **[JsBarcode](https://github.com/lindell/JsBarcode)** — Barcode generation
- **[JSZip](https://stuk.github.io/jszip/)** — ZIP file creation for batch download
- **[FileSaver.js](https://github.com/eligrey/FileSaver.js/)** — File download handling

### Python CLI (Legacy)
- **Pillow (PIL)** — Image processing
- **python-barcode** — Barcode generation
- **OpenCV** — Image cropping (original version)
- **imgkit + wkhtmltopdf** — HTML-to-image conversion (original version)

---

## 📊 CSV Format

Your CSV file should contain columns for student/employee details. The app auto-detects common column names:

```csv
Name,Erp Number,Branch,Date of Birth,BLOOD GROUP,photo for id card
Roshani Chaudhari,19011011C01962,Computer Science,15/08/2001,B+,photo.jpg
Om Patil,19011011C04836,Mechanical,22/09/2000,AB+,om.png
```

**Supported column names** (auto-detected):
- **Name**: `Name`, `Full Name`, `Student Name`
- **ID**: `Erp Number`, `ID`, `Roll Number`, `Enrollment`
- **Branch**: `Branch`, `Department`, `Course`, `Program`
- **DOB**: `Date of Birth`, `DOB`, `Birth Date`
- **Blood Group**: `Blood Group`, `Blood Type`
- **Photo**: `photo for id card`, `Photo`, `Image`, `Picture`

---

## 🖥️ Run Locally

### Web App
```bash
# Using any static file server
npx serve .

# Or simply open index.html in your browser
```

### Python CLI (Legacy)
```bash
# Create virtual environment
python -m venv .venv
.venv\Scripts\activate    # Windows
source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirement.txt

# Run
python main_simple.py
```

---

## 🌐 Deploy on Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import the `id-card-genreator` repository
4. Click **Deploy** — Vercel auto-detects the static site
5. Your app will be live at `your-project.vercel.app` 🎉

---

## 🎯 Use Cases

- 🏫 **Colleges & Schools** — Batch-generate student ID cards
- 🏢 **HR Departments** — Employee badge creation
- 🎪 **Event Management** — Participant/volunteer ID badges
- 🏥 **Hospitals** — Staff identification cards
- 🏋️ **Gyms & Clubs** — Member cards

---

## 👩‍💻 Author

**Roshani Chaudhari** — [@rOsHaNiC-26](https://github.com/rOsHaNiC-26)

---

## 📄 License

This project is open source and available for educational and personal use.

---

<p align="center">
  Made with ❤️ | All processing happens in your browser — your data never leaves your device.
</p>
