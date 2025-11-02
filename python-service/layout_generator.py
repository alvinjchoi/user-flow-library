"""
Layout Generator using ScreenCoder
Converts UI screenshots into HTML/CSS layout code
"""

import os
import sys
import json
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any
import requests
from PIL import Image
from io import BytesIO

# Add ScreenCoder to path
SCREENCODER_PATH = Path(__file__).parent / "ScreenCoder"
if SCREENCODER_PATH.exists() and str(SCREENCODER_PATH) not in sys.path:
    sys.path.insert(0, str(SCREENCODER_PATH))

# Add UIED to path (ScreenCoder depends on it)
UIED_PATH = Path(__file__).parent / "UIED"
if UIED_PATH.exists() and str(UIED_PATH) not in sys.path:
    sys.path.insert(0, str(UIED_PATH))


class LayoutGenerator:
    """Generate HTML/CSS layout from screenshots using ScreenCoder"""
    
    def __init__(self, openai_api_key: Optional[str] = None):
        """
        Initialize the layout generator
        
        Args:
            openai_api_key: OpenAI API key for GPT-based layout generation
        """
        self.openai_api_key = openai_api_key or os.getenv('OPENAI_API_KEY')
        self.screencoder_available = SCREENCODER_PATH.exists()
        
        if not self.openai_api_key:
            print("⚠️  Warning: OPENAI_API_KEY not set. Layout generation will be limited.")
    
    def _download_image(self, image_url: str, save_path: Path) -> Path:
        """Download image from URL and save to disk"""
        response = requests.get(image_url, stream=True, timeout=30)
        response.raise_for_status()
        
        # Save image
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return save_path
    
    def generate_layout(
        self,
        image_url: str,
        model: str = "gpt-4o",
        include_css: bool = True,
        output_format: str = "html"
    ) -> Dict[str, Any]:
        """
        Generate HTML/CSS layout from a screenshot
        
        Args:
            image_url: URL of the screenshot
            model: LLM model to use (gpt-4o, gpt-4-vision-preview, etc.)
            include_css: Whether to include CSS styling
            output_format: Output format (html, react, vue, etc.)
            
        Returns:
            dict with keys: html, css, metadata
        """
        if not self.screencoder_available:
            raise RuntimeError("ScreenCoder is not available")
        
        if not self.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required for layout generation")
        
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Download image
            image_name = "screenshot.png"
            input_path = temp_path / image_name
            self._download_image(image_url, input_path)
            
            # Load image to get dimensions
            img = Image.open(input_path)
            width, height = img.size
            
            try:
                # Import ScreenCoder modules
                sys.path.insert(0, str(SCREENCODER_PATH))
                
                # TODO: Integrate ScreenCoder's block_parser and html_generator
                # For now, use a simplified approach with GPT-4 Vision
                layout_code = self._generate_with_gpt_vision(
                    str(input_path),
                    model,
                    include_css,
                    output_format
                )
                
                return {
                    "html": layout_code.get("html", ""),
                    "css": layout_code.get("css", "") if include_css else "",
                    "metadata": {
                        "imageWidth": width,
                        "imageHeight": height,
                        "model": model,
                        "format": output_format
                    }
                }
                
            except Exception as e:
                raise RuntimeError(f"Layout generation failed: {str(e)}")
    
    def _generate_with_gpt_vision(
        self,
        image_path: str,
        model: str,
        include_css: bool,
        output_format: str
    ) -> Dict[str, str]:
        """
        Generate layout using GPT-4 Vision API
        
        Args:
            image_path: Path to the screenshot
            model: GPT model to use
            include_css: Whether to include CSS
            output_format: Output format
            
        Returns:
            dict with html and css keys
        """
        import base64
        from openai import OpenAI
        
        # Initialize OpenAI client
        client = OpenAI(api_key=self.openai_api_key)
        
        # Encode image as base64
        with open(image_path, "rb") as image_file:
            image_data = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Create prompt based on output format
        if output_format == "react":
            prompt = """Analyze this UI screenshot and generate clean, production-ready React JSX code.

Requirements:
1. Use semantic HTML5 elements
2. Use Tailwind CSS classes for styling
3. Make it responsive
4. Include proper component structure
5. Add meaningful class names and IDs

Output ONLY the JSX code, no explanations."""
        
        elif output_format == "html":
            prompt = """Analyze this UI screenshot and generate clean, semantic HTML5 code with Tailwind CSS classes.

Requirements:
1. Use semantic HTML5 elements (header, nav, main, section, article, footer)
2. Use Tailwind CSS utility classes for styling
3. Make it responsive (use md:, lg: breakpoints)
4. Maintain proper spacing and layout hierarchy
5. Add meaningful class names and IDs

Output format:
```html
<!-- HTML code here -->
```

"""
            if include_css:
                prompt += """
Also provide custom CSS if needed:
```css
/* Custom CSS here */
```
"""
        else:
            prompt = f"Generate {output_format} code from this UI screenshot. Use semantic HTML and modern CSS practices."
        
        # Call GPT-4 Vision API
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_data}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens=4000,
            temperature=0.1
        )
        
        # Parse response
        content = response.choices[0].message.content
        
        # Extract HTML and CSS from markdown code blocks
        html_code = ""
        css_code = ""
        
        # Extract HTML
        if "```html" in content:
            html_start = content.find("```html") + 7
            html_end = content.find("```", html_start)
            html_code = content[html_start:html_end].strip()
        elif "```jsx" in content:
            html_start = content.find("```jsx") + 6
            html_end = content.find("```", html_start)
            html_code = content[html_start:html_end].strip()
        else:
            # If no code blocks, assume entire content is HTML
            html_code = content.strip()
        
        # Extract CSS if requested
        if include_css and "```css" in content:
            css_start = content.find("```css") + 6
            css_end = content.find("```", css_start)
            css_code = content[css_start:css_end].strip()
        
        return {
            "html": html_code,
            "css": css_code
        }


_generator_instance = None


def get_generator(openai_api_key: Optional[str] = None):
    """Get or create the layout generator singleton"""
    global _generator_instance
    if _generator_instance is None:
        _generator_instance = LayoutGenerator(openai_api_key)
    return _generator_instance

