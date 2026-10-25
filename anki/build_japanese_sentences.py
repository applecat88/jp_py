# -*- coding: utf-8 -*-
"""Build an Anki package from course.json sample sentences.

Front: English. Back: Japanese/romaji. Same lesson decks as the word package, 15 notes each.
"""
import hashlib
import json
import os
import sqlite3
import tempfile
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COURSE = os.path.join(ROOT, "app", "data", "course.json")
OUT_DIR = os.path.dirname(os.path.abspath(__file__))
APKG = os.path.join(OUT_DIR, "japanese_sentences.apkg")
TXT = os.path.join(OUT_DIR, "japanese_sentences.txt")
AUDIO = os.path.join(ROOT, "app", "data", "audio")

MODEL_ID = 1607392402
MOD = 1761000000

SCHEMA = """
CREATE TABLE col (
    id integer primary key,
    crt integer not null,
    mod integer not null,
    scm integer not null,
    ver integer not null,
    dty integer not null,
    usn integer not null,
    ls integer not null,
    conf text not null,
    models text not null,
    decks text not null,
    dconf text not null,
    tags text not null
);
CREATE TABLE notes (
    id integer primary key,
    guid text not null,
    mid integer not null,
    mod integer not null,
    usn integer not null,
    tags text not null,
    flds text not null,
    sfld text not null,
    csum integer not null,
    flags integer not null,
    data text not null
);
CREATE TABLE cards (
    id integer primary key,
    nid integer not null,
    did integer not null,
    ord integer not null,
    mod integer not null,
    usn integer not null,
    type integer not null,
    queue integer not null,
    due integer not null,
    ivl integer not null,
    factor integer not null,
    reps integer not null,
    lapses integer not null,
    left integer not null,
    odue integer not null,
    odid integer not null,
    flags integer not null,
    data text not null
);
CREATE TABLE revlog (
    id integer primary key,
    cid integer not null,
    usn integer not null,
    ease integer not null,
    ivl integer not null,
    lastIvl integer not null,
    factor integer not null,
    time integer not null,
    type integer not null
);
CREATE TABLE graves (
    usn integer not null,
    oid integer not null,
    type integer not null
);
CREATE INDEX ix_notes_usn on notes (usn);
CREATE INDEX ix_cards_usn on cards (usn);
CREATE INDEX ix_revlog_usn on revlog (usn);
CREATE INDEX ix_cards_nid on cards (nid);
CREATE INDEX ix_cards_sched on cards (did, queue, due);
CREATE INDEX ix_revlog_cid on revlog (cid);
CREATE INDEX ix_notes_csum on notes (csum);
"""

LATEX_PRE = (
    "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n"
    "\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n"
    "\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n"
)
LATEX_POST = "\\end{document}"
CSS = (
    ".card {\n"
    "  font-family: \"Segoe UI\", \"Yu Gothic\", Meiryo, sans-serif;\n"
    "  font-size: 28px;\n"
    "  text-align: center;\n"
    "  color: #1a1a1a;\n"
    "  background-color: #f7f4ef;\n"
    "}\n"
    ".jp { font-size: 40px; }\n"
)


def display_en(en):
    en = " ".join(en.strip().split())
    if en and en[0].isalpha() and en[0].islower():
        en = en[0].upper() + en[1:]
    return en


def deck_name(day, title):
    title = " ".join(title.strip().split()).replace("::", " : ")
    return "japanese_sentences::{0:02d} {1}".format(day, title)


def stable_id(text, salt):
    digest = hashlib.sha1((salt + "\n" + text).encode("utf-8")).hexdigest()
    return int(digest[:15], 16)


def guid_for(day, jp, romaji):
    digest = hashlib.sha1(
        "jp-sentence|{0}|{1}|{2}".format(day, jp, romaji).encode("utf-8")
    ).hexdigest()
    alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    number = int(digest[:16], 16)
    chars = []
    for _ in range(10):
        chars.append(alphabet[number % 62])
        number //= 62
    return "".join(chars)


def checksum(text):
    return int(hashlib.sha1(text.encode("utf-8")).hexdigest()[:8], 16)


def deck_json(deck_id, name):
    return {
        "id": deck_id,
        "name": name,
        "mod": MOD,
        "usn": -1,
        "collapsed": False,
        "desc": "",
        "dyn": 0,
        "conf": 1,
        "extendNew": 10,
        "extendRev": 50,
        "lrnToday": [0, 0],
        "newToday": [0, 0],
        "revToday": [0, 0],
        "timeToday": [0, 0],
    }


def model_json():
    return {
        "id": MODEL_ID,
        "name": "Japanese Sentence",
        "type": 0,
        "mod": MOD,
        "usn": -1,
        "sortf": 0,
        "did": 1,
        "tmpls": [
            {
                "name": "Card 1",
                "ord": 0,
                "qfmt": "{{Front}}",
                "afmt": '{{FrontSide}}\n\n<hr id=answer>\n\n<div class="jp">{{Back}}</div>',
                "did": None,
                "bqfmt": "",
                "bafmt": "",
                "bfont": "",
                "bsize": 0,
            }
        ],
        "flds": [
            {
                "name": "Front",
                "ord": 0,
                "sticky": False,
                "rtl": False,
                "font": "Segoe UI",
                "size": 28,
                "media": [],
            },
            {
                "name": "Back",
                "ord": 1,
                "sticky": False,
                "rtl": False,
                "font": "Yu Gothic",
                "size": 40,
                "media": [],
            },
        ],
        "css": CSS,
        "req": [[0, "any", [0]]],
        "tags": [],
        "vers": [],
        "latexPre": LATEX_PRE,
        "latexPost": LATEX_POST,
        "latexsvg": False,
    }


def dconf_json():
    return {
        "1": {
            "id": 1,
            "name": "Default",
            "mod": 0,
            "usn": 0,
            "maxTaken": 60,
            "autoplay": True,
            "timer": 0,
            "replayq": True,
            "new": {
                "bury": True,
                "delays": [1, 10],
                "initialFactor": 2500,
                "ints": [1, 4, 7],
                "order": 1,
                "perDay": 20,
                "separate": True,
            },
            "rev": {
                "bury": True,
                "ease4": 1.3,
                "fuzz": 0.05,
                "ivlFct": 1,
                "maxIvl": 36500,
                "minSpace": 1,
                "perDay": 200,
            },
            "lapse": {
                "delays": [10],
                "leechAction": 0,
                "leechFails": 8,
                "minInt": 1,
                "mult": 0,
            },
        }
    }


def conf_json():
    return {
        "activeDecks": [1],
        "addToCur": True,
        "collapseTime": 1200,
        "curDeck": 1,
        "curModel": str(MODEL_ID),
        "dueCounts": True,
        "estTimes": True,
        "newBury": True,
        "newSpread": 0,
        "nextPos": 2000,
        "sortBackwards": False,
        "sortType": "noteFld",
        "timeLim": 0,
    }


def load_decks():
    with open(COURSE, "r", encoding="utf-8") as handle:
        course = json.load(handle)
    decks = []
    for day in course["days"]:
        audio_by_jp = {}
        for clip in day.get("audio") or []:
            if clip.get("kind") == "sentence":
                audio_by_jp[clip["jp"].strip()] = clip["file"]
        sentences = []
        for index, item in enumerate(day["sentences"], start=1):
            en = display_en(item["en"])
            jp = item["jp"].strip()
            romaji = item["romaji"].strip()
            rel = audio_by_jp.get(jp)
            if not en or not jp or not romaji or not rel:
                raise SystemExit("empty field on day {0}".format(day["day"]))
            src = os.path.join(AUDIO, rel.replace("/", os.sep))
            if not os.path.exists(src):
                raise SystemExit("missing audio " + src)
            sound = "d{0:02d}s{1:02d}.mp3".format(day["day"], index)
            sentences.append(
                {
                    "front": en,
                    "back": jp + "/" + romaji + "<br>[sound:" + sound + "]",
                    "jp": jp,
                    "romaji": romaji,
                    "audio": src,
                    "sound": sound,
                }
            )
        if len(sentences) != 15:
            raise SystemExit(
                "day {0} has {1} sentences".format(day["day"], len(sentences))
            )
        decks.append(
            {
                "day": day["day"],
                "title": day["title"],
                "name": deck_name(day["day"], day["title"]),
                "sentences": sentences,
            }
        )
    return decks


def write_text(decks):
    lines = [
        "#separator:tab",
        "#html:true",
        "#notetype:Basic",
        "#deck column:3",
        "#tags column:4",
        "Front\tBack\tDeck\tTags",
    ]
    for deck in decks:
        tag = "day{0:02d} japanese sentence".format(deck["day"])
        for sentence in deck["sentences"]:
            front = sentence["front"].replace("\t", " ")
            back = sentence["back"].replace("\t", " ")
            lines.append(
                "{0}\t{1}\t{2}\t{3}".format(front, back, deck["name"], tag)
            )
    with open(TXT, "w", encoding="utf-8", newline="\n") as handle:
        handle.write("\n".join(lines) + "\n")


def write_apkg(decks):
    decks_map = {}
    used_ids = set([1])
    parent_id = stable_id("japanese_sentences", "deck")
    while parent_id in used_ids:
        parent_id += 1
    used_ids.add(parent_id)
    decks_map[str(parent_id)] = deck_json(parent_id, "japanese_sentences")

    note_rows = []
    card_rows = []
    media_map = {}
    media_sources = []
    note_seq = 1762000000000
    for deck in decks:
        deck_id = stable_id(deck["name"], "deck")
        while deck_id in used_ids:
            deck_id += 1
        used_ids.add(deck_id)
        decks_map[str(deck_id)] = deck_json(deck_id, deck["name"])
        for index, sentence in enumerate(deck["sentences"], start=1):
            note_seq += 1
            note_id = note_seq
            card_id = note_seq + 500000
            tags = " day{0:02d} japanese sentence ".format(deck["day"])
            flds = sentence["front"] + "\x1f" + sentence["back"]
            note_rows.append(
                (
                    note_id,
                    guid_for(deck["day"], sentence["jp"], sentence["romaji"]),
                    MODEL_ID,
                    MOD,
                    -1,
                    tags,
                    flds,
                    sentence["front"],
                    checksum(sentence["front"]),
                    0,
                    "",
                )
            )
            card_rows.append(
                (
                    card_id,
                    note_id,
                    deck_id,
                    0,
                    MOD,
                    -1,
                    0,
                    0,
                    index,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    "",
                )
            )
            arc = str(len(media_sources))
            media_map[arc] = sentence["sound"]
            media_sources.append((arc, sentence["audio"]))

    fd, db_path = tempfile.mkstemp(suffix=".anki2")
    os.close(fd)
    try:
        conn = sqlite3.connect(db_path)
        conn.executescript(SCHEMA)
        conn.execute(
            "INSERT INTO col VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (
                1,
                1411124400,
                MOD * 1000,
                MOD * 1000,
                11,
                0,
                0,
                0,
                json.dumps(conf_json()),
                json.dumps({str(MODEL_ID): model_json()}),
                json.dumps(decks_map, ensure_ascii=False),
                json.dumps(dconf_json()),
                "{}",
            ),
        )
        conn.executemany(
            "INSERT INTO notes VALUES (?,?,?,?,?,?,?,?,?,?,?)", note_rows
        )
        conn.executemany(
            "INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            card_rows,
        )
        conn.commit()
        conn.close()
        if os.path.exists(APKG):
            os.remove(APKG)
        with zipfile.ZipFile(APKG, "w", zipfile.ZIP_DEFLATED) as package:
            package.write(db_path, "collection.anki2")
            package.writestr("media", json.dumps(media_map))
            for arc, src in media_sources:
                package.write(src, arc, compress_type=zipfile.ZIP_STORED)
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)


def main():
    decks = load_decks()
    write_text(decks)
    write_apkg(decks)
    print("decks", len(decks))
    print("notes", sum(len(deck["sentences"]) for deck in decks))
    print("txt", TXT)
    print("apkg", APKG)
    first = decks[0]["sentences"][0]
    print("sample", first["front"], first["back"])
    print("audio", len(decks[0]["sentences"]), "on day 1")


if __name__ == "__main__":
    main()
