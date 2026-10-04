import math
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import av

WIDTH = 720
HEIGHT = 1280
FPS = 60
DURATION_SEC = 3.2
TOTAL_FRAMES = int(FPS * DURATION_SEC)  # 192 frames

OUTPUT_PATH = 'public/videos/yemunnai_intro_discovery.mp4'

print(f"Loading logo and assets for {TOTAL_FRAMES} frames @ {FPS}fps...")

# Load the base logo
logo_raw = Image.open('public/images/NewLogo.png').convert('RGBA')

# Crop to the active mascot and text region to eliminate empty outer margins
bbox = (120, 240, 1480, 1360)
logo_cropped = logo_raw.crop(bbox)

# Create an alpha mask from the orange background
logo_np = np.array(logo_cropped)
r, g, b, a = logo_np[:, :, 0], logo_np[:, :, 1], logo_np[:, :, 2], logo_np[:, :, 3]

bg_r, bg_g, bg_b = 253, 116, 2
dist = np.sqrt((r.astype(float) - bg_r)**2 + (g.astype(float) - bg_g)**2 + (b.astype(float) - bg_b)**2)

# Anti-aliased edge alpha
alpha = np.clip((dist - 12) / 16.0 * 255, 0, 255).astype(np.uint8)
logo_np[:, :, 3] = alpha
logo_clean = Image.fromarray(logo_np, 'RGBA')

# Font loading for crisp formal typography
font_path = "C:\\Windows\\Fonts\\segoeuib.ttf"
if not os.path.exists(font_path):
    font_path = "C:\\Windows\\Fonts\\arialbd.ttf"
try:
    tag_font = ImageFont.truetype(font_path, 25)
    tag_font_small = ImageFont.truetype(font_path, 11)
except Exception:
    tag_font = ImageFont.load_default()
    tag_font_small = tag_font

# Precompute the radiant luxury saffron gradient backdrop
def create_backdrop():
    y, x = np.ogrid[:HEIGHT, :WIDTH]
    cx, cy = WIDTH / 2, HEIGHT / 2 - 30
    dist = np.sqrt(((x - cx) / (WIDTH * 0.72))**2 + ((y - cy) / (HEIGHT * 0.58))**2)
    dist = np.clip(dist, 0.0, 1.0)

    # Smooth cubic step
    dist_smooth = dist * dist * (3 - 2 * dist)

    # Center #FF7F1A -> Outer #D44E00
    r = 255 * (1 - dist_smooth) + 210 * dist_smooth
    g = 127 * (1 - dist_smooth) + 72 * dist_smooth
    b = 26 * (1 - dist_smooth) + 0 * dist_smooth

    bg = np.stack([r, g, b], axis=-1).astype(np.uint8)
    return Image.fromarray(bg, 'RGB')

base_bg = create_backdrop()

def ease_out_cubic(x):
    return 1.0 - math.pow(1.0 - x, 3)

def ease_out_quad(x):
    return 1.0 - (1.0 - x) * (1.0 - x)

def render_frame_image(frame_idx):
    t_sec = frame_idx / float(FPS)

    # Base background
    frame = base_bg.copy().convert('RGBA')

    # Scale and opacity for entrance (0.0s to 0.7s)
    if t_sec < 0.7:
        p_in = ease_out_cubic(min(1.0, t_sec / 0.7))
        scale = 0.88 + 0.12 * p_in
        opacity = min(1.0, t_sec / 0.35)
    elif t_sec < 2.6:
        # Subtle living breathe
        p_breathe = math.sin((t_sec - 0.7) / 1.9 * math.pi)
        scale = 1.0 + 0.014 * p_breathe
        opacity = 1.0
    else:
        # Smooth handoff out
        p_out = (t_sec - 2.6) / 0.6
        scale = 1.0 + 0.035 * p_out
        opacity = max(0.0, 1.0 - 0.25 * p_out)

    # Target size of logo: 560px wide
    base_w = 560
    w = max(10, int(base_w * scale))
    h = max(10, int((logo_clean.height / float(logo_clean.width)) * w))

    logo_resized = logo_clean.resize((w, h), Image.Resampling.LANCZOS)

    # Apply Sleek Liquid Sheen Sweep (Frames 45 to 110, 0.75s to 1.83s)
    if 45 <= frame_idx <= 110:
        sheen_p = (frame_idx - 45) / 65.0  # 0.0 to 1.0
        # Smooth diagonal sweep
        sheen_x = -160 + sheen_p * (w + 320)

        lw, lh = logo_resized.size
        sheen_arr = np.zeros((lh, lw, 4), dtype=np.uint8)

        y_coords, x_coords = np.ogrid[:lh, :lw]
        diag = x_coords + (y_coords - lh/2) * 0.65

        dist_sheen = np.abs(diag - sheen_x)
        band_width = 52.0
        intensity = np.clip(1.0 - (dist_sheen / band_width), 0.0, 1.0)
        intensity = (intensity * intensity) * 0.38

        alpha_channel = np.array(logo_resized)[:, :, 3].astype(float) / 255.0
        sheen_alpha = (intensity * alpha_channel * 255).astype(np.uint8)

        sheen_arr[:, :, 0] = 255
        sheen_arr[:, :, 1] = 255
        sheen_arr[:, :, 2] = 255
        sheen_arr[:, :, 3] = sheen_alpha

        sheen_layer = Image.fromarray(sheen_arr, 'RGBA')
        logo_composite = Image.alpha_composite(logo_resized, sheen_layer)
    else:
        logo_composite = logo_resized

    # Overall opacity
    if opacity < 1.0:
        arr = np.array(logo_composite)
        arr[:, :, 3] = (arr[:, :, 3].astype(float) * opacity).astype(np.uint8)
        logo_composite = Image.fromarray(arr, 'RGBA')

    # Paste logo at center
    pos_x = (WIDTH - w) // 2
    pos_y = (HEIGHT - h) // 2 - 35
    frame.alpha_composite(logo_composite, (pos_x, pos_y))

    return frame.convert('RGB')

print("Setting up PyAV video container with libx264...")
container = av.open(OUTPUT_PATH, mode='w', options={'movflags': '+faststart'})
stream = container.add_stream('libx264', rate=FPS)
stream.width = WIDTH
stream.height = HEIGHT
stream.pix_fmt = 'yuv420p'
# High quality CRF 18
stream.options = {'crf': '18', 'preset': 'medium'}

for i in range(TOTAL_FRAMES):
    img = render_frame_image(i)
    frame = av.VideoFrame.from_image(img)
    for packet in stream.encode(frame):
        container.mux(packet)
    if (i + 1) % 30 == 0 or i == TOTAL_FRAMES - 1:
        print(f"Encoded {i + 1}/{TOTAL_FRAMES} frames ({int((i+1)/TOTAL_FRAMES*100)}%)...")

# Flush encoder
for packet in stream.encode():
    container.mux(packet)

container.close()

print(f"DONE! Ultra-premium intro video saved to {OUTPUT_PATH}")
print(f"Size: {os.path.getsize(OUTPUT_PATH)} bytes")
render_frame_image(100).save('public/videos/preview_intro_discovery.webp', quality=88)
