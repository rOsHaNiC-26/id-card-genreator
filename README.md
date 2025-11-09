# id-card-generator
Automated College ID Card Generator using Python and Excel

🧩 Project Description:

The College ID Card Generator is a Python-based desktop application that automatically creates professional-looking college ID cards for multiple students using data stored in an Excel sheet.

This system is built using Tkinter (for GUI), Pandas (for Excel handling), and Pillow (for image processing). The user simply uploads a college logo and an Excel file containing student details such as name, roll number, class, contact, photo path, and signature path.

The application then automatically reads the data and generates high-quality ID cards for all students in one go — saving time and ensuring design consistency.

⚙️ Key Features:

🎨 Interactive GUI (Graphical User Interface)
Built with Tkinter, providing a simple interface for users to browse files and generate IDs easily.

📊 Excel Integration (Batch Processing)
Reads all student data directly from an Excel sheet (using the Pandas library).

🖼️ Dynamic Image Placement
Automatically fetches student photos and signatures from the specified paths and inserts them into the ID template.

🏫 Customizable College Branding
Allows uploading of the college logo; supports custom text like college name, course label, academic year, and accreditation info.

⏳ Progress Bar Indicator
Displays real-time progress during the ID generation process.

💾 Automatic File Saving
Saves each student’s ID card image in an organized ID_Cards/ folder.

🚫 Error Handling
Detects missing images, incorrect Excel columns, or broken paths, and displays user-friendly error messages.


🚀 How It Works:

Run the Python script (id_card_generator.py).

Upload the college logo and Excel sheet.

Click “Generate All IDs”.

The program will:

Read all student records.

Insert photos and details into a predesigned ID card layout.

Save all generated ID cards inside the ID_Cards folder.


🎯 Project Outcome:

This project automates the time-consuming manual ID card creation process into a single-click operation. It’s particularly useful for:

Colleges, Schools, and Training Institutes

HR Departments for employee badges

Event Management (participant IDs)

The system demonstrates real-world applications of Python automation, GUI development, and image processing
