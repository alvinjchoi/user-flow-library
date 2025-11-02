import os
import sys
from pathlib import Path
import requests
from PIL import Image
from io import BytesIO
import numpy as np
import cv2
import json

# Add UIED directory to Python path
UIED_PATH = Path(__file__).parent / "UIED"
if UIED_PATH.exists() and str(UIED_PATH) not in sys.path:
    sys.path.insert(0, str(UIED_PATH))

try:
    import detect_compo.ip_region_proposal as ip
    import detect_merge.merge as merge
    UIED_IMPORTED = True
    # OCR module removed - use /generate-layout for text recognition
except ImportError as e:
    print(f"Warning: UIED modules could not be imported. Error: {e}")
    UIED_IMPORTED = False


class UIEDDetector:
    """Singleton detector for UI elements using UIED"""
    
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(UIEDDetector, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        if not UIED_IMPORTED:
            raise ImportError("UIED modules are not available. Please ensure UIED is correctly installed.")

        self.key_params = {
            'min-grad': 10,
            'ffl-block': 5,
            'min-ele-area': 50,
            'merge-contained-ele': True,
            'merge-line-to-paragraph': False,
            'remove-bar': True
        }
        self.output_root = Path('/tmp/uied_output')
        self.output_root.mkdir(parents=True, exist_ok=True)
        self._initialized = True
        print("✅ UIEDDetector initialized")

    def _download_image(self, image_url: str, save_path: Path) -> Path:
        """Download image from URL and save to disk"""
        response = requests.get(image_url, stream=True, timeout=30)
        response.raise_for_status()
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return save_path

    def _map_element_type(self, uied_class: str, text_content: str) -> str:
        """Map UIED class to our element types"""
        uied_class_lower = uied_class.lower()
        text_lower = text_content.lower()
        
        # Button detection
        if 'button' in uied_class_lower or 'btn' in uied_class_lower:
            return 'button'
        if any(keyword in text_lower for keyword in ['sign in', 'log in', 'submit', 'continue', 'next', 'back']):
            return 'button'
        
        # Input detection
        if 'input' in uied_class_lower or 'text_input' in uied_class_lower:
            return 'input'
        
        # Icon detection
        if 'icon' in uied_class_lower:
            return 'icon'
        
        # Link detection
        if 'link' in uied_class_lower:
            return 'link'
        
        # Tab detection
        if 'tab' in uied_class_lower:
            return 'tab'
        
        # Card detection
        if 'card' in uied_class_lower:
            return 'card'
        
        # Default to 'other' for interactive elements
        return 'other'

    def detect(self, image_url: str, include_labels: bool = True) -> dict:
        """
        Detect UI elements from a screenshot URL
        
        Args:
            image_url: URL of the screenshot
            include_labels: Whether to run OCR for text labels
            
        Returns:
            dict with keys: elements, imageWidth, imageHeight
        """
        if not UIED_IMPORTED:
            raise RuntimeError("UIED is not available.")

        # Create temporary directory for this detection
        temp_dir = self.output_root / f"temp_{os.getpid()}"
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            # Download image with proper extension
            image_name = Path(image_url).name.split('?')[0] or 'screenshot'
            # Ensure proper extension for PaddleOCR
            if not any(image_name.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.bmp']):
                image_name = f"{image_name}.png"
            input_path = temp_dir / image_name
            
            print(f"📥 Downloading image from {image_url}")
            self._download_image(image_url, input_path)

            # Load image and get dimensions
            org_img = cv2.imread(str(input_path))
            if org_img is None:
                raise ValueError(f"Could not load image from {input_path}")
            
            height, width = org_img.shape[:2]
            print(f"📐 Image dimensions: {width}x{height}")
            
            # OCR disabled - PaddleOCR removed for performance
            # Use GPT-4 Vision in /generate-layout for text recognition
            ocr_result_path = None
            if include_labels:
                print("ℹ️  OCR disabled (use /generate-layout for text recognition)")

            # Run component detection
            print("🔍 Running component detection...")
            # Create IP output directory
            ip_dir = temp_dir / "ip"
            ip_dir.mkdir(parents=True, exist_ok=True)
            ip.compo_detection(
                str(input_path),
                str(temp_dir),
                self.key_params,
                classifier=None,
                resize_by_height=None,
                show=False
            )
            compo_result_path = ip_dir / f"{input_path.stem}.json"
            print(f"✅ Component detection completed: {compo_result_path}")

            # Merge components and OCR results (or use components only if no OCR)
            merge_dir = temp_dir / "merge"
            merge_dir.mkdir(parents=True, exist_ok=True)
            
            if ocr_result_path and ocr_result_path.exists():
                print("🔗 Merging components with OCR results...")
                merge.merge(
                    str(input_path),
                    str(compo_result_path),
                    str(ocr_result_path),
                    str(merge_dir),
                    is_remove_bar=self.key_params['remove-bar'],
                    is_paragraph=self.key_params['merge-line-to-paragraph'],
                    show=False
                )
                merged_json_path = merge_dir / f"{input_path.stem}.json"
                print(f"✅ Merge completed: {merged_json_path}")
            else:
                print("ℹ️  No OCR results, using component detection only...")
                # Copy component results to merge directory
                import shutil
                merged_json_path = merge_dir / f"{input_path.stem}.json"
                shutil.copy(str(compo_result_path), str(merged_json_path))
                print(f"✅ Using components only: {merged_json_path}")

            # Load and process the merged JSON
            with open(merged_json_path, 'r') as f:
                merged_data = json.load(f)

            elements = []
            for idx, compo in enumerate(merged_data.get('compos', [])):
                # Get bounding box in pixels
                x = compo.get('column_min', 0)
                y = compo.get('row_min', 0)
                w = compo.get('width', 0)
                h = compo.get('height', 0)
                
                # Skip invalid bounding boxes
                if w <= 0 or h <= 0:
                    continue
                
                # Convert pixel coordinates to percentages
                x_percent = (x / width) * 100
                y_percent = (y / height) * 100
                width_percent = (w / width) * 100
                height_percent = (h / height) * 100

                # Determine element type and label
                uied_class = compo.get('class', 'other')
                text_content = compo.get('text_content', '')
                element_type = self._map_element_type(uied_class, text_content)
                
                # Skip non-interactive text elements
                if element_type == 'other' and not text_content:
                    continue

                elements.append({
                    'type': element_type,
                    'label': text_content,
                    'description': f"Detected {element_type}",
                    'boundingBox': {
                        'x': round(x_percent, 2),
                        'y': round(y_percent, 2),
                        'width': round(width_percent, 2),
                        'height': round(height_percent, 2)
                    },
                    'confidence': 1.0,  # UIED doesn't provide per-element confidence
                    'is_ai_generated': True,
                    'order_index': idx
                })
            
            print(f"✅ Detected {len(elements)} UI elements")
            
            return {
                "elements": elements,
                "imageWidth": width,
                "imageHeight": height
            }
            
        finally:
            # Clean up temporary files
            import shutil
            if temp_dir.exists():
                shutil.rmtree(temp_dir, ignore_errors=True)


# Singleton instance getter
_detector_instance = None

def get_detector() -> UIEDDetector:
    """Get or create the singleton UIEDDetector instance"""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = UIEDDetector()
    return _detector_instance
