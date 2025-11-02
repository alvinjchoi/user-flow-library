"""
ScreenCoder Wrapper
Properly integrates ScreenCoder's block parsing + HTML generation approach
"""

import os
import sys
import json
import tempfile
import re
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
import requests
from PIL import Image
import cv2

# Add ScreenCoder to path
SCREENCODER_PATH = Path(__file__).parent / "ScreenCoder"
if SCREENCODER_PATH.exists() and str(SCREENCODER_PATH) not in sys.path:
    sys.path.insert(0, str(SCREENCODER_PATH))


class ScreenCoderGenerator:
    """
    Wrapper for ScreenCoder's layout generation
    Uses the actual ScreenCoder implementation: block parsing + HTML generation
    """
    
    def __init__(self, openai_api_key: Optional[str] = None):
        self.openai_api_key = openai_api_key or os.getenv('OPENAI_API_KEY')
        self.screencoder_available = SCREENCODER_PATH.exists()
        
        if not self.screencoder_available:
            raise RuntimeError("ScreenCoder not available")
        
        if not self.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY required for layout generation")
        
        # Import ScreenCoder encode_image utility
        try:
            from utils import encode_image
            self.encode_image = encode_image
            print("✅ ScreenCoder utilities imported")
        except ImportError as e:
            raise RuntimeError(f"Failed to import ScreenCoder utilities: {e}")
        
        # Create GPT client wrapper (simplified version of ScreenCoder's GPT class)
        from openai import OpenAI
        self.gpt_client = OpenAI(api_key=self.openai_api_key)
        self.gpt_model = "gpt-4o"
    
    def _call_gpt_vision(self, base64_image: str, prompt: str) -> str:
        """Call GPT-4 Vision API (ScreenCoder-compatible wrapper)"""
        content = {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{base64_image}",
                    },
                },
            ],
        }
        
        response = self.gpt_client.chat.completions.create(
            model=self.gpt_model,
            messages=[content],
            max_tokens=4096,
            temperature=0,
            seed=42,
        )
        
        return response.choices[0].message.content
    
    def _download_image(self, image_url: str, save_path: Path) -> Path:
        """Download image from URL"""
        response = requests.get(image_url, stream=True, timeout=30)
        response.raise_for_status()
        
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return save_path
    
    def _parse_blocks(self, image_path: str) -> Dict[str, Tuple[int, int, int, int]]:
        """
        Step 1: Block Parsing
        Use GPT-4 Vision to identify major layout blocks
        """
        print("🔍 Step 1: Parsing layout blocks...")
        
        # Read image dimensions
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Failed to load image: {image_path}")
        h, w = image.shape[:2]
        
        # Encode image
        base64_image = self.encode_image(image_path)
        
        # ScreenCoder's block parsing prompt
        prompt = """Return the bounding boxes of the sidebar, main content, header, and navigation in this webpage screenshot. 
Please only return the corresponding bounding boxes. Note: 
1. The areas should not overlap
2. All text information and other content should be framed inside
3. Try to keep it compact without leaving blank space
4. Output a label and the corresponding bounding box for each line in the format: <bbox>x1 y1 x2 y2</bbox>"""
        
        # Call GPT-4 Vision
        response = self._call_gpt_vision(base64_image, prompt)
        
        # Parse bounding boxes from response
        bboxes = self._parse_bbox_response(response, w, h)
        
        print(f"✅ Parsed {len(bboxes)} layout blocks: {list(bboxes.keys())}")
        return bboxes
    
    def _parse_bbox_response(
        self,
        response: str,
        width: int,
        height: int
    ) -> Dict[str, Tuple[int, int, int, int]]:
        """Parse GPT's bbox response into coordinates"""
        bboxes = {}
        
        # Find all <bbox>x1 y1 x2 y2</bbox> patterns
        pattern = r'<bbox>([\d\s]+)</bbox>'
        matches = re.findall(pattern, response)
        
        # Also extract component names
        lines = response.strip().split('\n')
        component_idx = 0
        
        for line in lines:
            line = line.strip().lower()
            if not line:
                continue
            
            # Find component name
            component_name = None
            if 'header' in line:
                component_name = 'header'
            elif 'sidebar' in line:
                component_name = 'sidebar'
            elif 'navigation' in line or 'nav' in line:
                component_name = 'navigation'
            elif 'main content' in line or 'main' in line:
                component_name = 'main content'
            
            # Find bbox in this line
            if '<bbox>' in line and '</bbox>' in line and component_name:
                start_idx = line.find('<bbox>') + 6
                end_idx = line.find('</bbox>')
                coords_str = line[start_idx:end_idx].strip()
                
                try:
                    coords = list(map(int, coords_str.split()))
                    if len(coords) == 4:
                        x_min, y_min, x_max, y_max = coords
                        # Clamp to image bounds
                        x_min = max(0, min(x_min, width))
                        y_min = max(0, min(y_min, height))
                        x_max = max(0, min(x_max, width))
                        y_max = max(0, min(y_max, height))
                        
                        bboxes[component_name] = (x_min, y_min, x_max, y_max)
                        print(f"  - {component_name}: ({x_min}, {y_min}, {x_max}, {y_max})")
                except (ValueError, IndexError) as e:
                    print(f"Warning: Failed to parse bbox for {component_name}: {e}")
                    continue
        
        return bboxes
    
    def _generate_block_html(
        self,
        image_path: str,
        block_name: str,
        bbox: Tuple[int, int, int, int]
    ) -> str:
        """
        Step 2: HTML Generation
        Generate HTML/CSS for a specific block
        """
        print(f"🎨 Generating HTML for {block_name}...")
        
        # Crop block from image
        img = Image.open(image_path)
        cropped = img.crop(bbox)
        
        # Save cropped block temporarily
        temp_block_path = f"/tmp/block_{block_name.replace(' ', '_')}.png"
        cropped.save(temp_block_path)
        
        # Encode cropped image
        base64_image = self.encode_image(temp_block_path)
        
        # ScreenCoder's HTML generation prompt (English version)
        prompt = f"""This is a screenshot of a {block_name} container.
Please fill in complete HTML and Tailwind CSS code to accurately reproduce this container.
Ensure all elements' positions, layout, text, and colors match the original screenshot.

<div>
your code here
</div>

Only return the code within the <div> and </div> tags."""
        
        # Call GPT-4 Vision
        response = self._call_gpt_vision(base64_image, prompt)
        
        # Extract HTML from response
        html = self._extract_html_from_response(response)
        
        # Clean up temp file
        try:
            os.remove(temp_block_path)
        except:
            pass
        
        return html
    
    def _extract_html_from_response(self, response: str) -> str:
        """Extract HTML code from GPT response"""
        # Try to find code blocks
        if '```html' in response:
            start = response.find('```html') + 7
            end = response.find('```', start)
            return response[start:end].strip()
        elif '```' in response:
            start = response.find('```') + 3
            end = response.find('```', start)
            return response[start:end].strip()
        else:
            # Return raw response if no code blocks
            return response.strip()
    
    def generate_layout(
        self,
        image_url: str,
        include_full_page: bool = True
    ) -> Dict[str, Any]:
        """
        Generate complete HTML layout using ScreenCoder's approach
        
        Args:
            image_url: URL of the screenshot
            include_full_page: Whether to include full HTML page wrapper
            
        Returns:
            dict with html, blocks, metadata
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Download image
            input_path = temp_path / "screenshot.png"
            self._download_image(image_url, input_path)
            
            # Get image dimensions
            img = Image.open(input_path)
            width, height = img.size
            
            # Step 1: Parse layout blocks
            bboxes = self._parse_blocks(str(input_path))
            
            if not bboxes:
                raise RuntimeError("Failed to parse any layout blocks")
            
            # Step 2: Generate HTML for each block
            block_html = {}
            for block_name, bbox in bboxes.items():
                try:
                    html = self._generate_block_html(str(input_path), block_name, bbox)
                    block_html[block_name] = html
                except Exception as e:
                    print(f"Warning: Failed to generate HTML for {block_name}: {e}")
                    block_html[block_name] = f"<div><!-- {block_name}: generation failed --></div>"
            
            # Step 3: Combine blocks into full HTML
            full_html = self._combine_blocks(block_html, width, height)
            
            return {
                "html": full_html,
                "blocks": block_html,
                "bboxes": {name: list(bbox) for name, bbox in bboxes.items()},
                "metadata": {
                    "imageWidth": width,
                    "imageHeight": height,
                    "method": "ScreenCoder",
                    "blocks_detected": list(bboxes.keys())
                }
            }
    
    def _combine_blocks(
        self,
        block_html: Dict[str, str],
        width: int,
        height: int
    ) -> str:
        """Combine block HTML into full page layout"""
        
        # Create full HTML structure
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Layout</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gray-50">
"""
        
        # Add header if present
        if 'header' in block_html:
            html += f"""
    <!-- Header -->
    <header class="w-full">
        {block_html['header']}
    </header>
"""
        
        # Add navigation if present
        if 'navigation' in block_html:
            html += f"""
    <!-- Navigation -->
    <nav class="w-full">
        {block_html['navigation']}
    </nav>
"""
        
        # Main content area with sidebar
        html += """
    <!-- Main Container -->
    <div class="flex flex-1">
"""
        
        # Add sidebar if present
        if 'sidebar' in block_html:
            html += f"""
        <!-- Sidebar -->
        <aside class="w-64">
            {block_html['sidebar']}
        </aside>
"""
        
        # Add main content if present
        if 'main content' in block_html:
            html += f"""
        <!-- Main Content -->
        <main class="flex-1">
            {block_html['main content']}
        </main>
"""
        
        html += """
    </div>
</body>
</html>"""
        
        return html


_generator_instance = None


def get_generator(openai_api_key: Optional[str] = None):
    """Get or create the ScreenCoder generator singleton"""
    global _generator_instance
    if _generator_instance is None:
        _generator_instance = ScreenCoderGenerator(openai_api_key)
    return _generator_instance

