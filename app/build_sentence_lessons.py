# -*- coding: utf-8 -*-
"""Build the Sentences mode pack, plus the root Markdown and Word files.

Each day gets a short grammar note and 8 example sentences from that day's
lesson. A sentence has Japanese, a hiragana pronunciation, a separate
katakana pronunciation, romaji, and a direct English translation.

Run from the app folder: py -3 build_sentence_lessons.py
"""
from __future__ import print_function

import io
import json
import os
import re
import zipfile

import grammar_plain

ROOT = os.path.dirname(os.path.abspath(__file__))
COURSE = os.path.join(ROOT, "data", "course.json")
PACK = os.path.join(ROOT, "data", "sentence_lessons.json")
PROJECT = os.path.normpath(os.path.join(ROOT, ".."))
MD_PATH = os.path.join(PROJECT, "Sentences.md")
DOCX_PATH = os.path.join(PROJECT, "Sentences.docx")
LITERAL_PATH = os.path.join(ROOT, "sentence_literal.tsv")

PICK = (0, 2, 4, 6, 8, 10, 12, 14)


def read_text(path):
    with io.open(path, "r", encoding="utf-8") as handle:
        return handle.read()


def clean_space(text):
    return re.sub(r"\s+", " ", text or "").strip()


def clean_markup(text):
    text = (text or "").replace("**", "")
    text = text.replace("`", "")
    return clean_space(text)


def shorten(text, limit):
    text = clean_markup(text)
    if len(text) <= limit:
        return text
    cut = text[:limit]
    period = max(cut.rfind(". "), cut.rfind("。"))
    if period > 60:
        return cut[:period + 1].strip()
    return cut.rstrip(" ,;:") + "…"


def to_katakana(hira):
    """Write the hiragana reading again, entirely in katakana."""
    chars = []
    for ch in hira or "":
        code = ord(ch)
        if 0x3041 <= code <= 0x3096:
            chars.append(chr(code + 0x60))
        else:
            chars.append(ch)
    return "".join(chars)


def load_literal():
    if not os.path.isfile(LITERAL_PATH):
        return {}
    table = {}
    for raw in read_text(LITERAL_PATH).splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "\t" not in line:
            continue
        jp, en = line.split("\t", 1)
        jp = jp.strip()
        en = en.strip()
        if jp and en:
            table[jp] = en
    return table


def polish(en):
    text = clean_space(en)
    text = re.sub(r"\s+\((?:slow|a machine|an app)\)", "", text)
    text = text.replace(" ,", ",")
    return text.strip()


def literal_english(jp, en, table):
    if jp in table and table[jp]:
        return polish(table[jp])
    return polish(en)


def pattern_note(pattern):
    title = clean_markup(pattern.get("title") or "")
    explanation = grammar_plain.PLAIN.get(title) or shorten(pattern.get("explanation") or "", 280)
    if not explanation:
        explanation = "This pattern is the sentence structure in the heading above."
    return {"title": title, "explanation": explanation}


def day_brief(goal, title):
    if goal:
        return goal
    return "This lesson is about " + title + "."


def pick_sentences(day, table):
    source = day.get("sentences") or []
    chosen = []
    for index in PICK:
        if index >= len(source):
            continue
        row = source[index]
        jp = (row.get("jp") or "").strip()
        if not jp:
            continue
        hira = row.get("hira") or ""
        chosen.append({
            "jp": jp,
            "hira": hira,
            "kata": to_katakana(hira),
            "romaji": (row.get("romaji") or "").strip(),
            "en": literal_english(jp, row.get("en") or "", table),
        })
    return chosen


def build_pack(course, table):
    days = []
    for day in course.get("days") or []:
        patterns = [pattern_note(item) for item in (day.get("grammar") or [])]
        sentences = pick_sentences(day, table)
        goal = day.get("goal") or ""
        days.append({
            "day": day.get("day"),
            "title": day.get("title") or "",
            "goal": goal,
            "brief": day_brief(goal, day.get("title") or ""),
            "grammar": patterns,
            "sentences": sentences,
        })
    return {
        "title": "Sentence learning",
        "description": (
            "Sentence-based study, one lesson a day. "
            "Each sentence is Japanese, a hiragana pronunciation, a katakana pronunciation, romaji, and a direct English translation."
        ),
        "days": days,
    }


def md_escape_line(text):
    return (text or "").replace("\r\n", "\n").replace("\r", "\n")


def render_markdown(pack):
    lines = []
    add = lines.append
    add("# Sentence learning")
    add("")
    add("Each day explains that day’s sentence patterns in short, plain English, then gives 8 example sentences. The sentences use that day’s vocabulary and show the grammar.")
    add("")
    add("Each example has five lines:")
    add("")
    add("1. Japanese")
    add("2. Hiragana")
    add("3. Katakana")
    add("4. Romaji")
    add("5. English")
    add("")
    add("The English is a direct translation of the Japanese sentence. It follows the Japanese wording. It is not a free translation or an idiomatic paraphrase. A word in parentheses is required by English and is not written in the Japanese.")
    add("")
    add("## Days")
    add("")
    for day in pack["days"]:
        add("- [Day %s — %s](#day-%s)" % (day["day"], day["title"], day["day"]))
    add("")
    for day in pack["days"]:
        add("---")
        add("")
        add('<a id="day-%s"></a>' % day["day"])
        add("")
        add("## Day %s — %s" % (day["day"], day["title"]))
        add("")
        if day.get("goal"):
            add("**Goal:** %s" % day["goal"])
            add("")
        add("### Grammar")
        add("")
        for index, pattern in enumerate(day.get("grammar") or [], 1):
            add("#### Pattern %s. %s" % (index, pattern.get("title") or ""))
            add("")
            add(pattern.get("explanation") or "")
            add("")
        add("### Example sentences")
        add("")
        for index, line in enumerate(day.get("sentences") or [], 1):
            add("#### Sentence %s" % index)
            add("")
            add("- **Japanese:** %s" % line.get("jp", ""))
            add("- **Hiragana:** %s" % line.get("hira", ""))
            add("- **Katakana:** %s" % line.get("kata", ""))
            add("- **Romaji:** %s" % line.get("romaji", ""))
            add("- **English:** %s" % line.get("en", ""))
            add("")
    return "\n".join(lines).rstrip() + "\n"


def xml_escape(text):
    return (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def docx_run(text, bold=False):
    fonts = (
        '<w:rPr>'
        '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Yu Gothic" w:cs="Yu Gothic"/>'
        + ("<w:b/>" if bold else "")
        + "</w:rPr>"
    )
    return "<w:r>%s<w:t xml:space=\"preserve\">%s</w:t></w:r>" % (fonts, xml_escape(text))


def docx_p(text, style=None, bold=False):
    style_xml = ""
    if style:
        style_xml = '<w:pPr><w:pStyle w:val="%s"/></w:pPr>' % style
    return "<w:p>%s%s</w:p>" % (style_xml, docx_run(text, bold=bold and not style))


def render_docx(pack):
    body = [docx_p("Sentence learning", "Heading1")]
    body.append(docx_p(
        "Each day explains that day’s sentence patterns in short, plain English, then gives 8 example sentences. "
        "The sentences use that day’s vocabulary and show the grammar."
    ))
    body.append(docx_p(
        "Each example has five lines: Japanese; hiragana; katakana; romaji; English. "
        "The English is a direct translation of the Japanese sentence. It follows the Japanese wording. "
        "It is not a free translation or an idiomatic paraphrase. "
        "A word in parentheses is required by English and is not written in the Japanese."
    ))
    for day in pack["days"]:
        body.append(docx_p("Day %s — %s" % (day["day"], day["title"]), "Heading2"))
        if day.get("goal"):
            body.append(docx_p("Goal: " + day["goal"], bold=True))
        body.append(docx_p("Grammar", "Heading3"))
        for index, pattern in enumerate(day.get("grammar") or [], 1):
            body.append(docx_p("Pattern %s. %s" % (index, pattern.get("title") or ""), bold=True))
            if pattern.get("explanation"):
                body.append(docx_p(pattern["explanation"]))
        body.append(docx_p("Example sentences", "Heading3"))
        for index, line in enumerate(day.get("sentences") or [], 1):
            body.append(docx_p("Sentence %s" % index, bold=True))
            body.append(docx_p("Japanese: " + (line.get("jp") or "")))
            body.append(docx_p("Hiragana: " + (line.get("hira") or "")))
            body.append(docx_p("Katakana: " + (line.get("kata") or "")))
            body.append(docx_p("Romaji: " + (line.get("romaji") or "")))
            body.append(docx_p("English: " + (line.get("en") or "")))
    body.append(
        "<w:sectPr>"
        '<w:pgSz w:w="12240" w:h="15840"/>'
        '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" '
        'w:header="720" w:footer="720" w:gutter="0"/>'
        "</w:sectPr>"
    )
    document = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        "<w:body>%s</w:body></w:document>" % "".join(body)
    )
    styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Yu Gothic" w:cs="Yu Gothic"/>
      <w:sz w:val="22"/><w:szCs w:val="22"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr><w:keepNext/><w:spacing w:before="360" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="36"/><w:szCs w:val="36"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr><w:keepNext/><w:spacing w:before="360" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr><w:keepNext/><w:spacing w:before="240" w:after="60"/><w:outlineLvl w:val="2"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
  </w:style>
</w:styles>
"""
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>
"""
    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
"""
    doc_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
"""
    if os.path.isfile(DOCX_PATH):
        os.remove(DOCX_PATH)
    with zipfile.ZipFile(DOCX_PATH, "w", compression=zipfile.ZIP_DEFLATED) as handle:
        handle.writestr("[Content_Types].xml", content_types.encode("utf-8"))
        handle.writestr("_rels/.rels", rels.encode("utf-8"))
        handle.writestr("word/document.xml", document.encode("utf-8"))
        handle.writestr("word/styles.xml", styles.encode("utf-8"))
        handle.writestr("word/_rels/document.xml.rels", doc_rels.encode("utf-8"))


def write_text(path, text):
    with io.open(path, "w", encoding="utf-8") as handle:
        handle.write(text)


def script_mix(text, kind):
    for ch in text or "":
        code = ord(ch)
        if kind == "hira" and 0x30A0 <= code <= 0x30FF:
            return True
        if kind == "kata" and 0x3040 <= code <= 0x309F:
            return True
    return False


def report(pack):
    mixed = 0
    short = 0
    for day in pack["days"]:
        count = len(day["sentences"])
        if count < 5 or count > 10:
            short += 1
            print("count", day["day"], count)
        for line in day["sentences"]:
            if script_mix(line.get("hira"), "hira") or script_mix(line.get("kata"), "kata"):
                mixed += 1
    print("days", len(pack["days"]), "bad_counts", short, "mixed_readings", mixed)
    sample = pack["days"][0]["sentences"][4]
    print("sample", sample["jp"])
    print("hira  ", sample["hira"])
    print("kata  ", sample["kata"])


def write_plain_js():
    path = os.path.join(ROOT, "web", "grammar_plain.js")
    text = "window.JapaneseStudyGrammarPlain = " + json.dumps(
        grammar_plain.PLAIN, ensure_ascii=False, indent=1, sort_keys=True
    ) + ";\n"
    write_text(path, text)
    print("wrote", path)


def main():
    course = json.loads(read_text(COURSE))
    missing = []
    for day in course.get("days") or []:
        for pattern in day.get("grammar") or []:
            title = pattern.get("title") or ""
            if title not in grammar_plain.PLAIN:
                missing.append("day %s %s" % (day.get("day"), title))
    if missing:
        print("missing English explanations", len(missing))
        for line in missing:
            print(line)
    write_plain_js()
    table = load_literal()
    pack = build_pack(course, table)
    write_text(PACK, json.dumps(pack, ensure_ascii=False, indent=1))
    write_text(MD_PATH, render_markdown(pack))
    render_docx(pack)
    report(pack)
    print("wrote", PACK)
    print("wrote", MD_PATH)
    print("wrote", DOCX_PATH)


if __name__ == "__main__":
    main()
