# -*- coding: utf-8 -*-
import io
import json
import os
from datetime import datetime, timedelta

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data")
OUT = os.path.normpath(os.path.join(ROOT, "..", "Japanese_study_calendar.ics"))


def esc(text):
    return (
        text.replace("\\", "\\\\")
        .replace("\r\n", "\n")
        .replace("\n", "\\n")
        .replace(",", "\\,")
        .replace(";", "\\;")
    )


def fold(line):
    # RFC 5545: fold at 75 octets. Keep UTF-8 boundaries.
    raw = line.encode("utf-8")
    if len(raw) <= 75:
        return line
    parts = []
    start = 0
    limit = 75
    while start < len(raw):
        end = min(start + limit, len(raw))
        while end > start and (raw[end - 1] & 0xC0) == 0x80:
            end -= 1
        if end == start:
            end = min(start + limit, len(raw))
        parts.append(raw[start:end].decode("utf-8"))
        start = end
        limit = 74
    return "\r\n ".join(parts)


def main():
    course = json.loads(io.open(os.path.join(DATA, "course.json"), encoding="utf-8").read())
    progress = json.loads(io.open(os.path.join(DATA, "progress.json"), encoding="utf-8").read())
    start = datetime.strptime(progress.get("startDate") or "2026-10-15", "%Y-%m-%d")
    days = course.get("days") or []
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Japanese study//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Japanese study",
    ]
    body = (
        "Open the Japanese study app and click Today's lesson.\\n"
        "1. Study: 20 words, 3 grammar patterns, examples, 15 sentences, reading, writing.\\n"
        "2. Listening: dialogue, then vocabulary, examples, and sentences. Use Download if you want the file.\\n"
        "3. Practice.\\n"
        "4. Test.\\n"
        "5. Click Mark studied.\\n"
        "When the lesson is finished, tick this event Done in Google Calendar."
    )
    for index, day in enumerate(days):
        number = day.get("day") or (index + 1)
        when = start + timedelta(days=number - 1)
        end = when + timedelta(days=1)
        title = day.get("title") or ""
        summary = "Day %d · %s" % (number, title)
        uid = "japanese-study-day-%02d-%s@local" % (number, start.strftime("%Y%m%d"))
        lines.extend([
            "BEGIN:VEVENT",
            "UID:%s" % uid,
            "DTSTAMP:%sT000000Z" % datetime.utcnow().strftime("%Y%m%d"),
            "DTSTART;VALUE=DATE:%s" % when.strftime("%Y%m%d"),
            "DTEND;VALUE=DATE:%s" % end.strftime("%Y%m%d"),
            "SUMMARY:%s" % esc(summary),
            "DESCRIPTION:%s" % body,
            "END:VEVENT",
        ])
    lines.append("END:VCALENDAR")
    text = "\r\n".join(fold(line) for line in lines) + "\r\n"
    with io.open(OUT, "w", encoding="utf-8") as handle:
        handle.write(text)
    last = start + timedelta(days=len(days) - 1)
    print("days", len(days))
    print("start", start.strftime("%Y-%m-%d"))
    print("end", last.strftime("%Y-%m-%d"))
    print("bytes", os.path.getsize(OUT))


if __name__ == "__main__":
    main()
