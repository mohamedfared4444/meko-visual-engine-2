#!/usr/bin/env python3
"""Merge cover + body into the final report PDF (normalized to A4)."""
from pypdf import PdfReader, PdfWriter

A4_W, A4_H = 595.28, 841.89
COVER = '/home/z/my-project/visual-engine-2/report/cover.pdf'
BODY = '/home/z/my-project/visual-engine-2/report/body.pdf'
OUT = '/home/z/my-project/visual-engine-2/report/meko-visual-engine-2-test-report.pdf'


def normalize(page):
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    if abs(w - A4_W) > 0.3 or abs(h - A4_H) > 0.3:
        page.scale_to(A4_W, A4_H)
    return page


writer = PdfWriter()
writer.add_page(normalize(PdfReader(COVER).pages[0]))
for page in PdfReader(BODY).pages:
    writer.add_page(normalize(page))
writer.add_metadata({
    '/Title': 'Meko Visual Engine 2.0 - Isolated Prototype Test Report',
    '/Author': 'Z.ai',
    '/Creator': 'Z.ai',
    '/Subject': 'Technical evaluation of the Motion Canvas visual engine prototype',
})
with open(OUT, 'wb') as f:
    writer.write(f)
print('final:', OUT, len(writer.pages), 'pages')
