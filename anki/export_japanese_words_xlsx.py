# -*- coding: utf-8 -*-
"""Write vocabulary Excel files from course.json."""
from __future__ import print_function

import json
import os
import re
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COURSE = os.path.join(ROOT, "app", "data", "course.json")
OUT_DIR = os.path.join(ROOT, "xlsx", "japanese_words")
ALL_PATH = os.path.join(ROOT, "xlsx", "japanese_words_all.xlsx")
ZIP_PATH = os.path.join(ROOT, "xlsx", "japanese_words.zip")

CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>
"""

RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>
"""

WB_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
"""

WORKBOOK = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Words" sheetId="1" r:id="rId1"/></sheets>
</workbook>
"""

STYLES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF2F4F6F"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
</cellXfs>
</styleSheet>
"""


def xml_text(value):
    if value is None:
        value = ""
    text = str(value)
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def col_letter(index):
    letters = ""
    n = index
    while n:
        n, rem = divmod(n - 1, 26)
        letters = chr(65 + rem) + letters
    return letters


def cell_xml(row, col, value, header=False):
    ref = col_letter(col) + str(row)
    style = ' s="1"' if header else ""
    return (
        '<c r="{0}" t="inlineStr"{1}><is><t xml:space="preserve">{2}</t></is></c>'.format(
            ref, style, xml_text(value)
        )
    )


def sheet_xml(headers, rows, widths):
    last_col = col_letter(len(headers))
    last_row = 1 + len(rows)
    cols = []
    for index, width in enumerate(widths, start=1):
        cols.append(
            '<col min="{0}" max="{0}" width="{1}" customWidth="1"/>'.format(
                index, width
            )
        )
    out = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
        "<dimension ref=\"A1:{0}{1}\"/>".format(last_col, last_row),
        "<sheetViews><sheetView tabSelected=\"1\" workbookViewId=\"0\">",
        '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>',
        "</sheetView></sheetViews>",
        "<cols>" + "".join(cols) + "</cols>",
        "<sheetData>",
        "<row r=\"1\">"
        + "".join(cell_xml(1, i, h, True) for i, h in enumerate(headers, start=1))
        + "</row>",
    ]
    for row_index, row in enumerate(rows, start=2):
        cells = "".join(
            cell_xml(row_index, i, value) for i, value in enumerate(row, start=1)
        )
        out.append('<row r="{0}">{1}</row>'.format(row_index, cells))
    out.append("</sheetData></worksheet>")
    return "".join(out)


def write_xlsx(path, headers, rows, widths):
    folder = os.path.dirname(path)
    if folder and not os.path.isdir(folder):
        os.makedirs(folder)
    sheet = sheet_xml(headers, rows, widths)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as package:
        package.writestr("[Content_Types].xml", CONTENT_TYPES)
        package.writestr("_rels/.rels", RELS)
        package.writestr("xl/workbook.xml", WORKBOOK)
        package.writestr("xl/_rels/workbook.xml.rels", WB_RELS)
        package.writestr("xl/styles.xml", STYLES)
        package.writestr("xl/worksheets/sheet1.xml", sheet.encode("utf-8"))


def safe_name(text):
    text = re.sub(r'[<>:"/\\|?*]', " ", text)
    text = " ".join(text.split())
    return text[:80]


def display_en(en):
    en = " ".join((en or "").strip().split())
    if en and en[0].isalpha() and en[0].islower():
        en = en[0].upper() + en[1:]
    return en


def load_days():
    with open(COURSE, "r", encoding="utf-8") as handle:
        course = json.load(handle)
    days = []
    for day in course["days"]:
        words = []
        for index, item in enumerate(day["vocabulary"], start=1):
            words.append(
                {
                    "no": index,
                    "jp": item.get("jp", "").strip(),
                    "hira": item.get("hira", "").strip(),
                    "romaji": item.get("romaji", "").strip(),
                    "en": display_en(item.get("en", "")),
                }
            )
        days.append(
            {
                "day": day["day"],
                "title": day["title"],
                "words": words,
            }
        )
    return days


def main():
    days = load_days()
    day_headers = ["No", "Japanese", "Hiragana", "Romaji", "English"]
    day_widths = [6, 22, 22, 22, 36]
    all_headers = ["Day", "Lesson", "No", "Japanese", "Hiragana", "Romaji", "English"]
    all_widths = [8, 42, 6, 22, 22, 22, 36]
    all_rows = []
    if os.path.isdir(OUT_DIR):
        for name in os.listdir(OUT_DIR):
            os.remove(os.path.join(OUT_DIR, name))
    else:
        os.makedirs(OUT_DIR)
    files = []
    for day in days:
        rows = [
            [word["no"], word["jp"], word["hira"], word["romaji"], word["en"]]
            for word in day["words"]
        ]
        filename = "day-{0:02d} {1}.xlsx".format(day["day"], safe_name(day["title"]))
        path = os.path.join(OUT_DIR, filename)
        write_xlsx(path, day_headers, rows, day_widths)
        files.append(path)
        for word in day["words"]:
            all_rows.append(
                [
                    day["day"],
                    day["title"],
                    word["no"],
                    word["jp"],
                    word["hira"],
                    word["romaji"],
                    word["en"],
                ]
            )
    write_xlsx(ALL_PATH, all_headers, all_rows, all_widths)
    if os.path.isfile(ZIP_PATH):
        os.remove(ZIP_PATH)
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as package:
        for path in files:
            package.write(path, os.path.join("japanese_words", os.path.basename(path)))
        package.write(ALL_PATH, os.path.basename(ALL_PATH))
    print("days", len(days))
    print("words", len(all_rows))
    print("files", len(files))
    print("folder", OUT_DIR)
    print("all", ALL_PATH)
    print("zip", ZIP_PATH)


if __name__ == "__main__":
    main()
