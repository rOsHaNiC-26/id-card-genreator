# module import
import imgkit
import cv2 as cv
from barcode import Code39
from barcode.writer import ImageWriter
import os

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# confrigrations - Note: wkhtmltopdf needs to be installed separately
# For now, we'll try without specifying the path (if wkhtmltopdf is in PATH)
# If this fails, you'll need to download wkhtmltopdf and specify the path
try:
    config = imgkit.config()
except:
    # If wkhtmltopdf is not found in PATH, try to use it without config
    config = None

options = {'enable-local-file-access': None, "--quality": 100}

def barcode(name,id):
    my_code = Code39(name, writer=ImageWriter())
    my_code.save(os.path.join(current_dir, "Barcodes", str(id)))


def htmler(NAME, ID, BRANCH, DOB, Blood_group, Photo, Bar):
    # Build absolute paths for images
    front_image_path = os.path.join(current_dir, "front2.png").replace("\\", "/")
    photo_path = os.path.join(current_dir, "photos", Photo).replace("\\", "/")
    barcode_path = os.path.join(current_dir, "Barcodes", Bar).replace("\\", "/")
    
    html = f"""<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>pccoe_id</title>
    <style>
            html {{
    /* off-white, so body edge is visible in browser */
    background: #eee;
    }}

    body {{
    height: 56mm;
    width: 90mm;

    margin: 0;
    }}

    /* fill half the height with each face */
    .face {{
    height: 100%;
    width: 100%;
    position: relative;
    }}

    /* an image that fills the whole of the front face */
    .face-front img {{
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100%;
    z-index:-1;
    }}
    #name{{
    position: absolute;
    left: 115px;
    top: 56px;
    }}

    </style>
    </head>
    <body>
        <div class="face face-front" style="z-index:-1;"><img src="file:///{front_image_path}"></div>
    
    <div class="photo"><img src="file:///{photo_path}" style="height: 83px;position: absolute;top: 75px;left: 10px;border: 1px solid #000;"></div>
    <div class="barcode"><img src="file:///{barcode_path}" style="height: 32px;position: absolute;top: 169px;left: 18px;"></div>
    <p id="name">Name :{NAME}<br>
        ID : {ID} <br>
        Branch : {BRANCH}<br>
        Dob : {DOB}<br>
        Blood Group : {Blood_group}
    </p>
    </body>
    </html>"""
    
    output_path = os.path.join(current_dir, 'out.jpg')
    imgkit.from_string(html, output_path, config=config, options=options)
    image = cv.imread(output_path)

    y = 0
    x = 0
    h = 336
    w = 212
    crop_image = image[x:w, y:h]
    cv.imwrite(os.path.join(current_dir, "Ids", f"{ID}.jpg"), crop_image)


# barcode("Harsh Baheti","1339769")
# htmler("Harsh Baheti", "1339769", "Computer Science", "22/09/2001", "AB+","photo.jpg","1339769"+".png")

# output


import csv
with open('data.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        barcode(row["Name"],row["Erp Number"])
        htmler(row["Name"],row["Erp Number"],row["Branch"],row["Date of Birth"],row["BLOOD GROUP"],row['photo for id card'],row["Erp Number"]+".png")
