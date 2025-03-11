import http.server
import socketserver
import ssl
import os

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

PORT = 8080

handler = Handler
httpd = socketserver.TCPServer(("", PORT), handler)

print(f"Serving at port {PORT}")
print("Access the app at http://localhost:8080")
httpd.serve_forever()
