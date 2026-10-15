# -*- coding: utf-8 -*-
"""Save every course clip under app/data/audio. Safe to run again."""
from __future__ import print_function

import io
import json
import os
import sys
import threading
import time

import native_voice

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data")
COURSE = os.path.join(DATA, "course.json")
AUDIO = os.path.join(DATA, "audio")
CACHE = os.path.join(AUDIO, "cache")
STATUS = os.path.join(AUDIO, "save_status.txt")
WORKERS = 4
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
        if all(ready(path) for path in dests):
            continue
        pending.append((text, dests))
    return course, pending


def place(data, dests):
    if not os.path.isdir(CACHE):
        os.makedirs(CACHE)
    for dest in dests:
        if ready(dest):
            continue
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
            if ready(dest):
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
        if extra_paths and all(ready(path) for path in extra_paths) and not ready(extra):
            folder = os.path.dirname(extra)
            if not os.path.isdir(folder):
                os.makedirs(folder)
            with open(extra, "wb") as handle:
                for path in extra_paths:
                    with open(path, "rb") as source:
                        handle.write(source.read())
            made += 1
    return made


def main():
    course, pending = jobs()
    total = len(pending)
    log("pending %d" % total)
    if not total:
        made = write_all(course)
        log("done combined %d" % made)
        return
    lock = threading.Lock()
    state = {"done": 0, "fail": 0, "started": time.time()}

    def work(text, dests):
        import hashlib
        digest = hashlib.sha1(text.encode("utf-8")).hexdigest()
        cached = os.path.join(CACHE, digest + ".mp3")
        data = None
        if ready(cached):
            with open(cached, "rb") as handle:
                data = handle.read()
        else:
            data = native_voice.synthesize(text)
            write_bytes(cached, data)
        place(data, dests)

    queue = list(pending)
    index = {"n": 0}

    def worker():
        while True:
            with lock:
                if index["n"] >= len(queue):
                    return
                text, dests = queue[index["n"]]
                index["n"] += 1
                current = index["n"]
            tries = 0
            while tries < 4:
                try:
                    work(text, dests)
                    with lock:
                        state["done"] += 1
                        done = state["done"]
                        fail = state["fail"]
                        elapsed = time.time() - state["started"]
                    if done % 25 == 0 or done == total:
                        rate = done / elapsed if elapsed else 0
                        left = (total - done) / rate if rate else 0
                        log("saved %d/%d fail %d left_min %.0f" % (done, total, fail, left / 60.0))
                    break
                except Exception as exc:
                    tries += 1
                    if tries >= 4:
                        with lock:
                            state["fail"] += 1
                            fail = state["fail"]
                        log("fail %d at %d %s" % (fail, current, type(exc).__name__))
                    else:
                        time.sleep(1.5 * tries)

    threads = []
    for _ in range(WORKERS):
        thread = threading.Thread(target=worker)
        thread.daemon = True
        thread.start()
        threads.append(thread)
    for thread in threads:
        thread.join()
    made = write_all(course)
    log("finished saved %d fail %d combined %d" % (state["done"], state["fail"], made))


if __name__ == "__main__":
    main()
