# -*- coding: utf-8 -*-
"""Save every course clip under app/data/audio. Safe to run again."""
from __future__ import print_function

import io
import json
import os
import sys
import time

import ai_voice

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data")
COURSE = os.path.join(DATA, "course.json")
AUDIO = os.path.join(DATA, "audio")
CACHE = os.path.join(AUDIO, "cache")
STATUS = os.path.join(AUDIO, "save_status.txt")
TRACKS = ("word", "grammar", "sentence", "reading", "dictation")


def ready(path):
    if not os.path.isfile(path):
        return False
    try:
        if os.path.getsize(path) < 200:
            return False
        with open(path, "rb") as handle:
            head = handle.read(3)
    except OSError:
        return False
    if head.startswith(b"ID3"):
        return True
    return len(head) >= 2 and head[0] == 255 and (head[1] & 0xE0) == 0xE0


def write_bytes(path, data):
    folder = os.path.dirname(path)
    if folder and not os.path.isdir(folder):
        os.makedirs(folder)
    part = path + ".part"
    with open(part, "wb") as handle:
        handle.write(data)
    try:
        if os.path.isfile(path):
            os.remove(path)
        os.rename(part, path)
    except OSError:
        with open(path, "wb") as handle:
            handle.write(data)
        try:
            os.remove(part)
        except OSError:
            pass


def log(message):
    print(message)
    sys.stdout.flush()
    with io.open(STATUS, "w", encoding="utf-8") as handle:
        handle.write(message + u"\n")


def jobs():
    course = json.loads(io.open(COURSE, encoding="utf-8").read())
    grouped = {}
    order = []
    for day in course.get("days") or []:
        for item in day.get("audio") or []:
            text = (item.get("jp") or u"").strip()
            rel = item.get("file") or ""
            if not text or not rel:
                continue
            dest = os.path.join(AUDIO, rel.replace("/", os.sep))
            if text not in grouped:
                grouped[text] = []
                order.append(text)
            grouped[text].append(dest)
    pending = []
    for text in order:
        dests = grouped[text]
        cached = ai_voice.cache_path(text)
        fresh = ready(cached) and all(
            ready(path) and os.path.getmtime(path) + 1 >= os.path.getmtime(cached)
            for path in dests
        )
        if fresh:
            continue
        pending.append((text, dests))
    return course, pending


def place(data, dests):
    if not os.path.isdir(CACHE):
        os.makedirs(CACHE)
    for dest in dests:
        write_bytes(dest, data)


def write_all(course):
    made = 0
    for day in course.get("days") or []:
        number = int(day.get("day") or 0)
        buckets = {name: [] for name in TRACKS}
        for item in day.get("audio") or []:
            kind = item.get("kind")
            if kind in buckets:
                buckets[kind].append(os.path.join(AUDIO, (item.get("file") or "").replace("/", os.sep)))
        for kind, paths in buckets.items():
            if not paths or not all(ready(path) for path in paths):
                continue
            dest = os.path.join(AUDIO, "day-%02d" % number, kind, "all.mp3")
            newest = max(os.path.getmtime(path) for path in paths)
            if ready(dest) and os.path.getmtime(dest) + 1 >= newest:
                continue
            folder = os.path.dirname(dest)
            if not os.path.isdir(folder):
                os.makedirs(folder)
            with open(dest, "wb") as handle:
                for path in paths:
                    with open(path, "rb") as source:
                        handle.write(source.read())
            made += 1
        extra_paths = buckets["word"] + buckets["grammar"]
        extra = os.path.join(AUDIO, "day-%02d" % number, "extra", "all.mp3")
        extra_newest = max(os.path.getmtime(path) for path in extra_paths) if extra_paths else 0
        extra_stale = (not ready(extra)) or os.path.getmtime(extra) + 1 < extra_newest
        if extra_paths and all(ready(path) for path in extra_paths) and extra_stale:
            folder = os.path.dirname(extra)
            if not os.path.isdir(folder):
                os.makedirs(folder)
            with open(extra, "wb") as handle:
                for path in extra_paths:
                    with open(path, "rb") as source:
                        handle.write(source.read())
            made += 1
    return made


def report(done, total, fail, started):
    if done % 25 != 0 and done != total:
        return
    elapsed = time.time() - started
    rate = done / elapsed if elapsed else 0
    left = (total - done) / rate if rate else 0
    log("saved %d/%d fail %d left_min %.0f" % (done, total, fail, left / 60.0))


def main():
    course, pending = jobs()
    total = len(pending)
    log("pending %d" % total)
    if not total:
        made = write_all(course)
        log("done combined %d" % made)
        return
    started = time.time()
    done = 0
    fail = 0
    index = 0
    inflight = []
    while index < total or inflight:
        while index < total and len(inflight) < 8:
            text, dests = pending[index]
            index += 1
            cached = ai_voice.cache_path(text)
            if ready(cached):
                with open(cached, "rb") as handle:
                    place(handle.read(), dests)
                done += 1
                report(done, total, fail, started)
                continue
            try:
                payload = ai_voice.request_job(text, 50)
            except Exception as exc:
                fail += 1
                log("fail %d at %d %s" % (fail, index, type(exc).__name__))
                continue
            inflight.append({
                "text": text,
                "dests": dests,
                "payload": payload,
                "since": time.time(),
                "tries": 0,
            })
        waiting = []
        for job in inflight:
            if time.time() - job["since"] > 90:
                fail += 1
                log("fail %d at timeout %s" % (fail, type(IOError).__name__))
                continue
            try:
                data = ai_voice.fetch_if_ready(job["payload"], 20)
            except Exception as exc:
                job["tries"] += 1
                if job["tries"] > 5:
                    fail += 1
                    log("fail %d fetch %s" % (fail, type(exc).__name__))
                    continue
                waiting.append(job)
                continue
            if not data:
                waiting.append(job)
                continue
            write_bytes(ai_voice.cache_path(job["text"]), data)
            place(data, job["dests"])
            done += 1
            report(done, total, fail, started)
        inflight = waiting
        if inflight:
            time.sleep(0.4)
    made = write_all(course)
    log("finished saved %d fail %d combined %d" % (done, fail, made))


if __name__ == "__main__":
    main()
