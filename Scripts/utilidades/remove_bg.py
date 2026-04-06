from PIL import Image

def remove_white_bg(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    newData = []
    for item in datas:
        # White-ish pixels
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            avg = (item[0] + item[1] + item[2]) / 3
            if avg > 250:
                newData.append((255, 255, 255, 0))
            else:
                alpha = int(255 - ((avg - 230) / 20.0 * 255))
                newData.append((item[0], item[1], item[2], alpha))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")

try:
    remove_white_bg(
        r"C:\Users\USER\.gemini\antigravity\brain\bdaf828e-d06c-4826-ad8c-b1e43329cb68\torres_bianco_logo_3d_edited_1772301284903.png", 
        r"C:\Users\USER\.gemini\antigravity\brain\bdaf828e-d06c-4826-ad8c-b1e43329cb68\torres_bianco_logo_transparent.png"
    )
    print("SUCCESS")
except Exception as e:
    print(f"Error: {e}")
