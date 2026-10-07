"""Restore the existing menu crops; never generate or replace a food photograph.

Requires OpenCV and NumPy. Then run extract_menu_photos.mjs --superres.
FSRCNN model: Saafke/FSRCNN_Tensorflow, Apache-2.0.
"""
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

import cv2
import numpy as np

MODEL_URL = 'https://raw.githubusercontent.com/Saafke/FSRCNN_Tensorflow/master/models/FSRCNN_x4.pb'
MODEL_SHA = '5c68d18db561aed8ead4ffedf1b897ea615baaf60ebf6c35f8e641f8fa4a21bf'
output_root = Path('.tmp/menu-upscale')
output_root.mkdir(parents=True, exist_ok=True)
model_path = output_root / 'FSRCNN_x4.pb'
if not model_path.exists():
    with urlopen(MODEL_URL, timeout=30) as response:
        model_path.write_bytes(response.read())
assert hashlib.sha256(model_path.read_bytes()).hexdigest() == MODEL_SHA, 'Unexpected model weights'

# TensorFlow pixel shuffle, matching OpenCV's dnn_superres DepthToSpace layer.
# Base OpenCV already provides DNN inference; a second OpenCV install is unnecessary.
class DepthToSpace:
    def __init__(self, params, blobs):
        pass

    def getMemoryShapes(self, inputs):
        n, c, h, w = inputs[0]
        return [[n, c // 16, h * 4, w * 4]]

    def forward(self, inputs):
        source = inputs[0]
        n, c, h, w = source.shape
        return [source.reshape(n, 4, 4, c // 16, h, w)
                .transpose(0, 3, 4, 1, 5, 2).reshape(n, c // 16, h * 4, w * 4)]


cv2.dnn_registerLayer('DepthToSpace', DepthToSpace)
cv2.setNumThreads(2)
network = cv2.dnn.readNetFromTensorflow(str(model_path))
records = []
for hotel, expected in [('hotel1', 89), ('hotel2', 53)]:
    manifest = json.loads(Path(f'menu_assets/{hotel}/manifest.json').read_text(encoding='utf-8'))
    report = json.loads(Path(f'menu_assets/{hotel}/extraction_report.json').read_text(encoding='utf-8'))
    assert len(manifest['items']) == expected and manifest['hotel_id'] == hotel
    source_bytes = Path(report['selected_source']).read_bytes()
    source_sha = hashlib.sha256(source_bytes).hexdigest()
    assert source_sha == report['source_sha256'], 'Source page changed; review crop coordinates first'
    page = cv2.imdecode(np.frombuffer(source_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    assert page is not None
    directory = output_root / hotel
    directory.mkdir(exist_ok=True)
    for item in manifest['items']:
        b = item['source_bbox']
        assert item['source_image'] == report['selected_source']
        assert 0 <= b['x'] < b['x'] + b['width'] <= page.shape[1]
        assert 0 <= b['y'] < b['y'] + b['height'] <= page.shape[0]
        crop = page[b['y']:b['y'] + b['height'], b['x']:b['x'] + b['width']]
        ycc = cv2.cvtColor(crop, cv2.COLOR_BGR2YCrCb).astype(np.float32) / 255
        network.setInput(cv2.dnn.blobFromImage(ycc[:, :, 0]))
        restored_y = network.forward()[0, 0]
        assert restored_y.shape == (b['height'] * 4, b['width'] * 4)
        assert np.isfinite(restored_y).all()
        restored = cv2.resize(ycc, (b['width'] * 4, b['height'] * 4), interpolation=cv2.INTER_LANCZOS4)
        # Keep source chroma and blend luminance with interpolation to restrain ringing.
        restored[:, :, 0] = .8 * restored_y + .2 * restored[:, :, 0]
        restored = cv2.cvtColor(np.clip(np.round(restored * 255), 0, 255).astype(np.uint8), cv2.COLOR_YCrCb2BGR)
        reduced = cv2.resize(restored, (b['width'], b['height']), interpolation=cv2.INTER_AREA)
        rmse = float(np.sqrt(np.mean((crop.astype(float) - reduced.astype(float)) ** 2)))
        assert rmse < 12, f"Restoration changed source appearance: {item['item_id']} ({rmse})"
        filename = directory / (item['item_id'] + '.png')
        assert cv2.imwrite(str(filename), restored)
        records.append({'item_id': item['item_id'], 'hotel': hotel, 'source_image': item['source_image'],
                        'source_bbox': b, 'source_sha256': source_sha, 'image_path': filename.as_posix(),
                        'sha256': hashlib.sha256(filename.read_bytes()).hexdigest(), 'source_pixel_rmse': round(rmse, 4)})
    print(f'{hotel}: {expected} original photos restored', flush=True)
assert len(records) == 142 and len({i['item_id'] for i in records}) == 142
(output_root / 'restoration.json').write_text(json.dumps({'model': 'FSRCNN_x4', 'model_url': MODEL_URL,
    'model_sha256': MODEL_SHA, 'luminance_model_blend': .8, 'items': records}, indent=2), encoding='utf-8')
print('PASS: 142 source crops restored with unchanged crop boundaries and food ownership.', flush=True)
