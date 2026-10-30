#!/usr/bin/env python3
"""Validate the published directory, links, metadata and JavaScript syntax."""
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
CONFIG = json.loads((ROOT / 'site.config.json').read_text())
URL = CONFIG['url']
BASE = urlsplit(URL)
ERRORS = []


def require(condition, message):
    if not condition:
        ERRORS.append(message)


def local_asset(reference, parent=DIST):
    parsed = urlsplit(reference)
    if reference.startswith(('data:', '#')) or parsed.scheme in ('mailto', 'tel'):
        return None
    if parsed.netloc:
        if parsed.netloc != BASE.netloc:
            return None
        require(parsed.path.startswith(BASE.path), f'URL fuera del proyecto: {reference}')
        return DIST / unquote(parsed.path.removeprefix(BASE.path))
    if parsed.path.startswith('/'):
        require(parsed.path.startswith(BASE.path), f'Ruta absoluta incompatible con Pages: {reference}')
        return DIST / unquote(parsed.path.removeprefix(BASE.path))
    return (parent / unquote(parsed.path)).resolve()


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.assets = []
        self.anchors = []
        self.canonical = []
        self.og_url = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'a':
            self.anchors.append(attrs.get('href', ''))
        if tag in ('img', 'script') and attrs.get('src'):
            self.assets.append(attrs['src'])
        if tag == 'link':
            rel = attrs.get('rel')
            if rel in ('stylesheet', 'icon', 'preload', 'manifest', 'apple-touch-icon'):
                self.assets.append(attrs.get('href', ''))
            if rel == 'canonical':
                self.canonical.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('property') == 'og:url':
            self.og_url.append(attrs.get('content'))


require(BASE.scheme == 'https' and URL.endswith('/'), 'La URL pública debe usar HTTPS y terminar en /')
page = Page()
page.feed((DIST / 'index.html').read_text())
require(len(page.ids) == len(set(page.ids)), 'Hay IDs duplicados en index.html')
require(page.canonical == [URL], 'Canonical distinto de site.config.json')
require(page.og_url == [URL], 'og:url distinto de site.config.json')
for reference in page.assets:
    path = local_asset(reference)
    if path is not None:
        require(path.is_file(), f'Asset inexistente: {reference}')
for reference in page.anchors:
    if reference.startswith('#') and len(reference) > 1:
        require(reference[1:] in page.ids, f'Ancla inexistente: {reference}')

for file in DIST.rglob('*.css'):
    for _, reference in re.findall(r'url\(\s*([\'"]?)(.*?)\1\s*\)', file.read_text()):
        path = local_asset(reference, file.parent)
        if path is not None:
            require(path.is_file(), f'Asset CSS inexistente en {file.name}: {reference}')

manifest = json.loads((DIST / 'site.webmanifest').read_text())
require(manifest.get('start_url') == './' and manifest.get('scope') == './', 'Manifest incompatible con el prefijo de Pages')
for icon in manifest.get('icons', []):
    path = local_asset(icon['src'])
    require(path is not None and path.is_file(), f'Ícono inexistente: {icon["src"]}')

tree = ET.parse(DIST / 'sitemap.xml')
locations = [node.text for node in tree.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
require(locations == [URL], 'Sitemap distinto de la URL pública')
require(URL + 'sitemap.xml' in (DIST / 'robots.txt').read_text(), 'Sitemap incorrecto en robots.txt')
require((DIST / '404.html').is_file(), 'Falta la página 404')
require((DIST / '.nojekyll').is_file(), 'Falta .nojekyll')
for license in ('OFL-Manrope.txt', 'OFL-MartianMono.txt'):
    require((DIST / 'assets/fonts' / license).is_file(), f'Falta licencia de fuente: {license}')

for file in DIST.rglob('*'):
    if file.suffix in ('.html', '.js', '.css', '.json', '.webmanifest', '.xml', '.txt'):
        text = file.read_text()
        require('wiz-sunshine.vtsec.chatgpt.site' not in text, f'URL de vista previa privada en {file.relative_to(DIST)}')

for file in DIST.rglob('*.js'):
    result = subprocess.run(['node', '--check', str(file)], capture_output=True, text=True)
    require(result.returncode == 0, f'JavaScript inválido en {file.name}: {result.stderr}')

if ERRORS:
    print('\n'.join('ERROR: ' + message for message in ERRORS), file=sys.stderr)
    sys.exit(1)
print(f'OK: {len(page.ids)} IDs únicos, {len(page.assets)} assets HTML, anclas, CSS, fuentes, metadata y JavaScript.')
