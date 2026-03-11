# module import
from PIL import Image, ImageDraw, ImageFont
from barcode import Code39
from barcode.writer import ImageWriter
import os
import csv

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

def barcode_generator(name, id):
    """Generate barcode for the ID card"""
    # Create directory if not exists
    os.makedirs(os.path.join(current_dir, "Barcodes"), exist_ok=True)
    
    my_code = Code39(str(id), writer=ImageWriter(), add_checksum=False)
    barcode_path = os.path.join(current_dir, "Barcodes", str(id))
    my_code.save(barcode_path)
    return barcode_path + ".png"


def generate_id_card(NAME, ID, BRANCH, DOB, Blood_group, Photo):
    """Generate ID card using PIL with high resolution"""
    try:
        # Load the front template (1050x660)
        template_path = os.path.join(current_dir, "front2.png")
        if not os.path.exists(template_path):
            print(f"Warning: Template image not found at {template_path}")
            # Create a blank template if front2.png doesn't exist
            card = Image.new('RGB', (1050, 660), color='white')
            draw = ImageDraw.Draw(card)
            draw.rectangle([10, 10, 1040, 650], outline='black', width=5)
        else:
            card = Image.open(template_path)
        
        draw = ImageDraw.Draw(card)
        
        # Scale factors (based on 336x212 being the "standard" pixel size)
        # Template is 1050x660. 1050/336 = 3.125
        sf = 3.125
        
        # Try to use a font. Scale font size: 14 * 3.125 approx 44
        try:
            font_size = int(14 * sf)
            font = ImageFont.truetype("arial.ttf", font_size)
            font_bold = ImageFont.truetype("arialbd.ttf", font_size)
        except:
            font = ImageFont.load_default()
            font_bold = ImageFont.load_default()
        
        # 1. Photo Placement
        # Original: top: 75px; left: 10px; height: 83px;
        p_x = int(10 * sf)
        p_y = int(75 * sf)
        p_h = int(83 * sf)
        p_w = int(p_h * 0.8) # Maintain aspect ratio roughly
        
        photo_path = os.path.join(current_dir, "photos", Photo)
        if os.path.exists(photo_path):
            try:
                photo = Image.open(photo_path)
                photo = photo.resize((p_w, p_h))
                card.paste(photo, (p_x, p_y))
                # Add border around photo
                draw.rectangle([p_x, p_y, p_x + p_w, p_y + p_h], outline='black', width=2)
            except Exception as e:
                print(f"Warning: Could not load photo {Photo}: {e}")
        else:
            draw.rectangle([p_x, p_y, p_x + p_w, p_y + p_h], outline='black', width=2)
            draw.text((p_x + 10, p_y + 30), "NO PHOTO", fill='black', font=font)
        
        # 2. Barcode Placement
        # Original: top: 169px; left: 18px; height: 32px;
        b_x = int(18 * sf)
        b_y = int(169 * sf)
        b_h = int(32 * sf)
        
        barcode_file = barcode_generator(NAME, ID)
        if os.path.exists(barcode_file):
            try:
                barcode_img = Image.open(barcode_file)
                # Resize barcode to match height but maintain its own aspect ratio
                bw, bh = barcode_img.size
                new_bw = int(bw * (b_h / bh))
                barcode_img = barcode_img.resize((new_bw, b_h))
                card.paste(barcode_img, (b_x, b_y))
            except Exception as e:
                print(f"Warning: Could not load barcode: {e}")
        
        # 3. Text Placement
        # Original: left: 115px; top: 56px; line-height: ~20px
        t_x = int(115 * sf)
        t_y = int(56 * sf)
        l_h = int(22 * sf) # line height
        
        labels = [
            f"Name : {NAME}",
            f"ID : {ID}",
            f"Branch : {BRANCH}",
            f"Dob : {DOB}",
            f"Blood Group : {Blood_group}"
        ]
        
        for i, text in enumerate(labels):
            draw.text((t_x, t_y + i * l_h), text, fill='black', font=font_bold if i==0 else font)
        
        # Save the ID card
        os.makedirs(os.path.join(current_dir, "Ids"), exist_ok=True)
        output_path = os.path.join(current_dir, "Ids", f"{ID}.jpg")
        card.save(output_path, quality=95)
        print(f"✓ Generated ID card for {NAME} (ID: {ID})")
        
    except Exception as e:
        print(f"✗ Error generating ID card for {NAME}: {e}")


# Main execution
if __name__ == "__main__":
    print("=" * 60)
    print("ID CARD GENERATOR - HIGH QUALITY PIL VERSION")
    print("=" * 60)
    
    csv_path = os.path.join(current_dir, 'data.csv')
    if not os.path.exists(csv_path):
        print(f"Error: data.csv not found at {csv_path}")
        exit(1)
    
    count = 0
    with open(csv_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            if row.get("Name") and row.get("Erp Number"):
                generate_id_card(
                    row["Name"],
                    row["Erp Number"],
                    row["Branch"],
                    row["Date of Birth"],
                    row["BLOOD GROUP"],
                    row['photo for id card']
                )
                count += 1
    
    print("=" * 60)
    print(f"✓ Successfully processed {count} ID card(s)")
    print(f"✓ ID cards saved in: {os.path.join(current_dir, 'Ids')}")
    print("=" * 60)
