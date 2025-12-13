import os
from PIL import Image
import sys

def resize_image(input_path, output_path, size):
    try:
        if not os.path.exists(input_path):
            print(f"Error: {input_path} not found")
            return
        
        with Image.open(input_path) as img:
            # If size is an integer, make it a square tuple
            target_size = (size, size) if isinstance(size, int) else size
            
            # Resize using LANCZOS for high quality
            img = img.resize(target_size, Image.Resampling.LANCZOS)
            img.save(output_path)
            print(f"Resized {input_path} to {target_size} at {output_path}")
    except Exception as e:
        print(f"Failed to resize {input_path}: {str(e)}")

# Define paths
base_dir = r"c:\Users\Luc\workspace\agy\strangers\public"
source_icon = r"C:\Users\Luc\.gemini\antigravity\brain\5be84431-2c4f-4ca4-9a8e-b1150933b59a\app_icon_no_text_1765634562957.png"
source_mobile = r"C:\Users\Luc\.gemini\antigravity\brain\5be84431-2c4f-4ca4-9a8e-b1150933b59a\screenshot_mobile_1765635052265.png"
source_desktop = r"C:\Users\Luc\.gemini\antigravity\brain\5be84431-2c4f-4ca4-9a8e-b1150933b59a\screenshot_desktop_1765635069786.png"

# Resize Icons (Square)
resize_image(source_icon, os.path.join(base_dir, "pwa-192x192.png"), 192)
resize_image(source_icon, os.path.join(base_dir, "pwa-512x512.png"), 512)

# Resize Screenshots (Rectangular)
resize_image(source_mobile, os.path.join(base_dir, "screenshot-mobile.png"), (1080, 1920))
resize_image(source_desktop, os.path.join(base_dir, "screenshot-desktop.png"), (1920, 1080))
