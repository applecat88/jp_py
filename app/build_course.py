# -*- coding: utf-8 -*-
"""Build course.json from the lesson plan.

The JSON file is the portable course. A C#, JavaScript, or Python UI can
load the same file. Run: py -3 build_course.py
"""
from __future__ import print_function

import io
import json
import os
import re

import readings

ROOT = os.path.dirname(os.path.abspath(__file__))
PLANS = [
    os.path.normpath(os.path.join(ROOT, "..", "Japanese_Learning_Plan_Day4_onward.md")),
    os.path.normpath(os.path.join(ROOT, "..", "Japanese_Learning_Plan_Day48_onward.md")),
]
EARLY = os.path.join(ROOT, "early_days.json")
OUT = os.path.join(ROOT, "data", "course.json")


def read_text(path):
    with io.open(path, "r", encoding="utf-8") as handle:
        return handle.read()


def has_jp(text):
    for ch in text:
        code = ord(ch)
        if 0x3040 <= code <= 0x30FF or 0x4E00 <= code <= 0x9FFF:
            return True
    return False


def clean(text):
    return re.sub(r"\s+", " ", text).strip()


def split_numbered(block):
    items = []
    for match in re.finditer(r"(?m)^(\d+)\.\s+(.+)$", block):
        items.append({"n": int(match.group(1)), "text": clean(match.group(2))})
    return items


def split_answer_line(line):
    line = re.sub(r"^\*\*Answers:\*\*\s*", "", line).strip()
    parts = re.split(r"\s+(?=\d+\.\s)", line)
    out = []
    for part in parts:
        match = re.match(r"(\d+)\.\s*(.*)", part.strip())
        if match:
            out.append({"n": int(match.group(1)), "text": clean(match.group(2))})
    return out


def parse_table_rows(block, kind):
    rows = []
    for line in block.splitlines():
        if not line.startswith("|"):
            continue
        cells = [clean(c) for c in line.strip().strip("|").split("|")]
        if not cells or cells[0] in ("Japanese", "#", "---") or set(cells[0]) <= set("-: "):
            continue
        if kind == "vocab" and len(cells) >= 4:
            if cells[0] == "Japanese":
                continue
            rows.append({
                "jp": cells[0],
                "hira": cells[1],
                "romaji": cells[2],
                "en": cells[3],
            })
        elif kind == "sentence" and len(cells) >= 4 and cells[0].isdigit():
            rows.append({
                "jp": cells[1],
                "romaji": cells[2],
                "en": cells[3],
            })
    return rows


def parse_examples(body):
    lines = body.splitlines()
    examples = []
    index = 0
    while index < len(lines):
        line = lines[index].strip()
        if line.startswith("* "):
            jp = clean(line[2:])
            romaji = ""
            english = ""
            cursor = index + 1
            grabbed = []
            while cursor < len(lines) and len(grabbed) < 2:
                nxt = lines[cursor].strip()
                if not nxt or nxt.startswith("* ") or nxt.startswith("#") or nxt.startswith("|"):
                    break
                if nxt.startswith("- "):
                    cursor += 1
                    continue
                grabbed.append(clean(nxt))
                cursor += 1
            if grabbed:
                romaji = grabbed[0]
            if len(grabbed) > 1:
                english = grabbed[1]
            examples.append({"jp": jp, "romaji": romaji, "en": english})
            index = cursor
            continue
        index += 1
    return examples


def parse_grammar(block):
    chunks = re.split(r"\n#### ", block)
    patterns = []
    for chunk in chunks[1:]:
        lines = chunk.splitlines()
        title = clean(lines[0])
        title = re.sub(r"^Pattern\s+\d+:\s*", "", title)
        body = "\n".join(lines[1:])
        examples = parse_examples(body)
        explanation_lines = []
        for line in lines[1:]:
            stripped = line.strip()
            if stripped.startswith("* "):
                break
            if stripped.startswith("|") or stripped.startswith("---"):
                continue
            explanation_lines.append(stripped)
        explanation = clean(" ".join(explanation_lines))
        patterns.append({
            "title": title,
            "explanation": explanation,
            "examples": examples,
        })
    return patterns


def section(part, start_pat, end_pat):
    match = re.search(start_pat + r"\n(.*?)(?=" + end_pat + r")", part, re.S)
    if not match:
        return ""
    return match.group(1)


def parse_reading(block):
    def grab(label, nxt):
        match = re.search(r"\*\*" + label + r"\*\*\s*\n+(.*?)(?=\*\*" + nxt + r"\*\*|\Z)", block, re.S)
        if not match:
            return ""
        text = match.group(1).strip()
        paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
        kept = []
        for index, para in enumerate(paras):
            stripped = para.strip()
            if stripped.startswith("**") or stripped.startswith("The phrase") or "**" in stripped[:12]:
                break
            if index > 0 and len(paras[0]) > 90:
                break
            if label == "Japanese" and not re.search(u"[。！？]$", stripped) and has_jp(stripped):
                stripped += u"。"
            if label != "Japanese" and not re.search(r"[.!?]$", stripped):
                stripped += "."
            kept.append(stripped)
        joiner = "" if label == "Japanese" else " "
        return joiner.join(kept)

    return {
        "jp": clean(grab("Japanese", "Romaji")),
        "romaji": clean(grab("Romaji", "English")),
        "en": clean(grab("English", "ZZZ")),
    }


def split_jp_sentences(text):
    text = (text or "").strip()
    note = re.search(u"。\\s*[^。]{0,40}（[^）]{0,80}）\\s*[A-Za-z]", text)
    if note:
        text = text[:note.start() + 1].strip()
    parts = re.split(u"([。！？])", text)
    lines = []
    buf = ""
    for part in parts:
        if part in (u"。", u"！", u"？"):
            buf += part
            if buf.strip():
                lines.append(buf.strip())
            buf = ""
        else:
            buf += part
    if buf.strip() and has_jp(buf):
        lines.append(buf.strip())
    return lines


def split_latin_sentences(text):
    text = text or ""
    text = re.sub(r"\ba\.m\.(?=\s+[A-Z])", "AM.", text)
    text = re.sub(r"\bp\.m\.(?=\s+[A-Z])", "PM.", text)
    text = text.replace("a.m.", "AM").replace("p.m.", "PM")
    text = text.replace("U.S.", "US").replace("e.g.", "EG")
    parts = re.split(u"([.!?]+[\"”']?)\\s+", text)
    lines = []
    buf = ""
    for part in parts:
        if re.match(u"^[.!?]+[\"”']?$", part or ""):
            buf += part
            line = buf.replace("AM", "a.m.").replace("PM", "p.m.").replace("US", "U.S.").replace("EG", "e.g.").strip()
            if line:
                lines.append(line)
            buf = ""
        else:
            buf += part
    if buf.strip():
        line = buf.replace("AM", "a.m.").replace("PM", "p.m.").replace("US", "U.S.").replace("EG", "e.g.").strip()
        lines.append(line)
    return lines


def align_passage(reading):
    jp_parts = split_jp_sentences(reading.get("jp", ""))
    romaji_parts = split_latin_sentences(reading.get("romaji", ""))
    en_parts = split_latin_sentences(reading.get("en", ""))
    lines = []
    if jp_parts and len(jp_parts) == len(romaji_parts) == len(en_parts):
        for index, jp in enumerate(jp_parts):
            lines.append({"jp": jp, "romaji": romaji_parts[index], "en": en_parts[index]})
        return lines
    if reading.get("jp"):
        return [{
            "jp": reading.get("jp", ""),
            "romaji": reading.get("romaji", ""),
            "en": reading.get("en", ""),
        }]
    return lines


def is_script_line(stripped):
    if not has_jp(stripped) or stripped.startswith("**"):
        return False
    latin = len(re.findall(r"[A-Za-z]", stripped))
    jp = 0
    for ch in stripped:
        code = ord(ch)
        if 0x3040 <= code <= 0x30FF or 0x4E00 <= code <= 0x9FFF:
            jp += 1
    if latin > jp:
        return False
    return True


def parse_listening(block):
    lines = block.strip().splitlines()
    script_lines = []
    questions = []
    answer_blob = ""
    mode = "script"
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("**Answers:**"):
            answer_blob = stripped
            mode = "done"
            continue
        if mode == "done":
            continue
        if re.match(r"^\d+\.\s+", stripped) and not has_jp(stripped[:8]):
            mode = "questions"
        if mode == "script":
            if is_script_line(stripped):
                script_lines.append(stripped)
        elif mode == "questions":
            match = re.match(r"^(\d+)\.\s+(.+)$", stripped)
            if match:
                questions.append({"n": int(match.group(1)), "q": clean(match.group(2)), "a": ""})
    answers = split_answer_line(answer_blob)
    by_n = {}
    for item in answers:
        by_n[item["n"]] = item["text"]
    for question in questions:
        question["a"] = by_n.get(question["n"], "")
    script = "".join(script_lines)
    spoken = split_jp_sentences(script)
    spoken_lines = [{"jp": item, "romaji": "", "en": ""} for item in spoken]
    return {
        "script": script,
        "lines": spoken_lines,
        "questions": [{"q": q["q"], "a": q["a"]} for q in questions],
    }


def parse_quiz(block):
    questions = []
    answer_blob = ""
    for line in block.splitlines():
        stripped = line.strip()
        if stripped.startswith("**Answers:**"):
            answer_blob = stripped
            break
        match = re.match(r"^(\d+)\.\s+(.+)$", stripped)
        if match:
            questions.append({"n": int(match.group(1)), "q": clean(match.group(2)), "a": ""})
    for item in split_answer_line(answer_blob):
        for question in questions:
            if question["n"] == item["n"]:
                question["a"] = item["text"]
    return [{"q": q["q"], "a": q["a"]} for q in questions]


def parse_writing(block):
    if "**Model answers**" in block:
        prompt_block, answer_block = block.split("**Model answers**", 1)
    else:
        prompt_block, answer_block = block, ""
    prompts = split_numbered(prompt_block)
    answers = split_numbered(answer_block)
    by_n = {}
    for item in answers:
        by_n[item["n"]] = item["text"]
    rows = []
    for item in prompts:
        rows.append({"prompt": item["text"], "answer": by_n.get(item["n"], "")})
    return rows


def parse_day(part):
    header = part.splitlines()[0]
    match = re.match(r"(\d+)\s+[—–-]\s+(.*)", header.strip())
    if not match:
        return None
    day_num = int(match.group(1))
    title = clean(match.group(2))
    goal_match = re.search(r"\*\*Goal:\*\*\s*(.+)", part)
    goal = clean(goal_match.group(1)) if goal_match else ""
    vocab_block = section(part, r"### 1\. Vocabulary[^\n]*", r"### 2\.")
    grammar_block = section(part, r"### 2\. Grammar[^\n]*", r"### 3\.")
    sentence_block = section(part, r"### 3\. Fifteen sample sentences", r"### 4\.")
    reading_block = section(part, r"### 4\. Reading practice", r"### 5\.")
    writing_block = section(part, r"### 5\. Writing practice", r"### 6\.")
    listening_block = section(part, r"### 6\. Listening practice", r"### 7\.")
    quiz_block = section(part, r"### 7\. Five-question check", r"\n---\n|\n# ")
    reading = parse_reading(reading_block)
    listening = parse_listening(listening_block)
    return {
        "day": day_num,
        "title": title,
        "goal": goal,
        "vocabulary": parse_table_rows(vocab_block, "vocab"),
        "grammar": parse_grammar(grammar_block),
        "sentences": parse_table_rows(sentence_block, "sentence"),
        "reading": reading,
        "readingLines": align_passage(reading),
        "writing": parse_writing(writing_block),
        "listening": listening,
        "quiz": parse_quiz(quiz_block),
    }


def audio_index(day):
    items = []
    for word in day["vocabulary"]:
        items.append({
            "kind": "word",
            "jp": word["jp"],
            "romaji": word["romaji"],
            "en": word["en"],
            "hira": word.get("hira", ""),
        })
    for pattern in day["grammar"]:
        for example in pattern["examples"]:
            if example.get("jp"):
                items.append({
                    "kind": "grammar",
                    "jp": example["jp"],
                    "romaji": example.get("romaji", ""),
                    "en": example.get("en", ""),
                })
    for sentence in day["sentences"]:
        items.append({
            "kind": "sentence",
            "jp": sentence["jp"],
            "romaji": sentence["romaji"],
            "en": sentence["en"],
        })
    for line in day.get("readingLines") or []:
        items.append({
            "kind": "reading",
            "jp": line["jp"],
            "romaji": line.get("romaji", ""),
            "en": line.get("en", ""),
        })
    for line in day["listening"]["lines"]:
        items.append({
            "kind": "dictation",
            "jp": line["jp"],
            "romaji": line.get("romaji", ""),
            "en": line.get("en", ""),
        })
    return items


def days_from_plan(path):
    plan = "\n" + read_text(path).replace("\r\n", "\n")
    if "\n## Day " not in plan:
        return []
    body = plan.split("\n## Day ", 1)[1]
    days = []
    for part in body.split("\n## Day "):
        day = parse_day(part)
        if day:
            days.append(day)
    return days


def main():
    days = []
    for path in PLANS:
        days.extend(days_from_plan(path))
    early = json.loads(read_text(EARLY))
    days = early + days
    days.sort(key=lambda item: item["day"])
    glosses = {}
    for name in ("listening_gloss.json", "listening_gloss_client.json"):
        gloss_path = os.path.join(ROOT, name)
        if os.path.isfile(gloss_path):
            glosses.update(json.loads(read_text(gloss_path)))
    for day in days:
        if not day.get("readingLines"):
            day["readingLines"] = align_passage(day.get("reading") or {})
        gloss = glosses.get(str(day["day"])) or glosses.get(day["day"])
        if gloss:
            lines = day["listening"]["lines"]
            for index, line in enumerate(lines):
                if index < len(gloss):
                    line["romaji"] = gloss[index].get("romaji", "")
                    line["en"] = gloss[index].get("en", "")
        day["audio"] = audio_index(day)
    readings.apply_readings({"days": days})
    report = []
    for day in days:
        missing_gloss = 0
        for line in day["listening"]["lines"]:
            if not line.get("en"):
                missing_gloss += 1
        gloss_row = glosses.get(str(day["day"])) or []
        gloss_n = len(gloss_row)
        if gloss_row and gloss_n != len(day["listening"]["lines"]):
            report.append("  GLOSS COUNT day {0}: lines={1} gloss={2}".format(
                day["day"], len(day["listening"]["lines"]), gloss_n))
        report.append(
            "Day {day}: vocab={v} grammar={g} ex={ex} sentences={s} writing={w} listen={ls}/{q} quiz={z} read={r} audio={a} gloss_missing={m}".format(
                day=day["day"],
                v=len(day["vocabulary"]),
                g=len(day["grammar"]),
                ex=sum(len(p["examples"]) for p in day["grammar"]),
                s=len(day["sentences"]),
                w=len(day["writing"]),
                ls=len(day["listening"]["lines"]),
                q=len(day["listening"]["questions"]),
                z=len(day["quiz"]),
                r=len(day.get("readingLines") or []),
                a=len(day["audio"]),
                m=missing_gloss,
            )
        )
    course = {
        "schema": 1,
        "title": "Japanese for building a program with a client",
        "language": "ja",
        "description": "Portable course file. Fields: day, title, goal, vocabulary, grammar, sentences, reading, readingLines, writing, listening, quiz, audio. Japanese lines include hira (pronunciation) and romaji. audio[].file is the clip path under data/audio/.",
        "days": days,
    }
    folder = os.path.dirname(OUT)
    if not os.path.isdir(folder):
        os.makedirs(folder)
    with io.open(OUT, "w", encoding="utf-8") as handle:
        text = json.dumps(course, ensure_ascii=False, indent=1)
        handle.write(text)
    print("\n".join(report))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
