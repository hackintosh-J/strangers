import os
from PIL import Image
import sys

def resize_icon(input_path, output_path, size):
    try:
        if not os.path.exists(input_path):
            print(f"Error: {input_path} not found")
            return
        
        with Image.open(input_path) as img:
            img = img.resize((size, size), Image.Resampling.LANCZOS)
            img.save(output_path)
            print(f"Resized {input_path} to {size}x{size} at {output_path}")
    except Exception as e:
        print(f"Failed to resize {input_path}: {str(e)}")

# Define paths
base_dir = r"c:\Users\Luc\workspace\agy\strangers\public"
source_icon = r"C:\Users\Luc\.gemini\antigravity\brain\5be84431-2c4f-4ca4-9a8e-b1150933b59a\app_icon_no_text_1765634562957.png"

# Resize 192x192
resize_icon(source_icon, os.path.join(base_dir, "pwa-192x192.png"), 192)

# Resize 512x512
resize_icon(source_icon, os.path.join(base_dir, "pwa-512x512.png"), 512)
