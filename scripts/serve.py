#!/usr/bin/env python3
"""Serve dist under the same project prefix used by GitHub Pages."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
CONFIG = json.loads((ROOT / 'site.config.json').read_text())
PREFIX = urlsplit(CONFIG['url']).path


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if path.startswith(PREFIX):
            path = '/' + path[len(PREFIX):]
        return super().translate_path(path)

    def route(self):
        path = urlsplit(self.path).path
        if path in ('/', PREFIX.rstrip('/')):
            self.send_response(302)
            self.send_header('Location', PREFIX)
            self.end_headers()
            return False
        if not path.startswith(PREFIX):
            self.send_error(404)
            return False
        return True

    def do_GET(self):
        if self.route():
            super().do_GET()

    def do_HEAD(self):
        if self.route():
            super().do_HEAD()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8766)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), partial(Handler, directory=str(DIST)))
    print(f'Local: http://{args.host}:{server.server_port}{PREFIX}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
