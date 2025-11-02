"""
Vercel Python Function for UI Element Detection

NOTE: This is a lightweight fallback. Full UIED detection requires heavy dependencies
(OpenCV, PaddleOCR, etc.) that exceed Vercel's 50MB function size limit.

For production, consider:
1. Deploying UIED service separately (Railway/Render)
2. Using GPT-4 Vision as primary method
3. Using this as a lightweight fallback
"""

from http.server import BaseHTTPRequestHandler
import json
import os


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Handle POST request for element detection"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            image_url = data.get('imageUrl')
            
            if not image_url:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'imageUrl is required'
                }).encode())
                return
            
            # For now, return a message indicating UIED is not available
            # In production, you could call an external UIED service here
            self.send_response(503)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': 'UIED detection not available in Vercel function',
                'message': 'UIED requires heavy dependencies that exceed Vercel limits. Please use GPT-4 Vision or deploy UIED separately.',
                'fallback': 'gpt4'
            }).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': str(e)
            }).encode())
    
    def do_GET(self):
        """Handle GET request for health check"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            'status': 'degraded',
            'message': 'Python function available but UIED not supported',
            'uied_available': False,
            'reason': 'UIED dependencies exceed Vercel function size limits'
        }).encode())

