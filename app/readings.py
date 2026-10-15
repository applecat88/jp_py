# -*- coding: utf-8 -*-
"""Hiragana pronunciation guides from the course romaji.

Vocabulary hiragana wins when a romaji word matches it. Other words are
converted with Hepburn rules used in this course: ō/ū are long vowels,
and the particles wa, e, and o are は, へ, and を.
"""
import re

_MACRON = {
    u"ā": u"aa", u"ī": u"ii", u"ū": u"uu", u"ē": u"ee", u"ō": u"ou",
    u"Ā": u"aa", u"Ī": u"ii", u"Ū": u"uu", u"Ē": u"ee", u"Ō": u"ou",
}
_PARTICLE = {u"wa": u"は", u"e": u"へ", u"o": u"を", u"wo": u"を"}
_DIGRAPH = [
    (u"kya", u"きゃ"), (u"kyu", u"きゅ"), (u"kyo", u"きょ"),
    (u"gya", u"ぎゃ"), (u"gyu", u"ぎゅ"), (u"gyo", u"ぎょ"),
    (u"sha", u"しゃ"), (u"shu", u"しゅ"), (u"sho", u"しょ"),
    (u"cha", u"ちゃ"), (u"chu", u"ちゅ"), (u"cho", u"ちょ"),
    (u"jya", u"じゃ"), (u"jyu", u"じゅ"), (u"jyo", u"じょ"),
    (u"ja", u"じゃ"), (u"ju", u"じゅ"), (u"jo", u"じょ"),
    (u"nya", u"にゃ"), (u"nyu", u"にゅ"), (u"nyo", u"にょ"),
    (u"hya", u"ひゃ"), (u"hyu", u"ひゅ"), (u"hyo", u"ひょ"),
    (u"bya", u"びゃ"), (u"byu", u"びゅ"), (u"byo", u"びょ"),
    (u"pya", u"ぴゃ"), (u"pyu", u"ぴゅ"), (u"pyo", u"ぴょ"),
    (u"mya", u"みゃ"), (u"myu", u"みゅ"), (u"myo", u"みょ"),
    (u"rya", u"りゃ"), (u"ryu", u"りゅ"), (u"ryo", u"りょ"),
    (u"che", u"ちぇ"), (u"she", u"しぇ"), (u"je", u"じぇ"),
    (u"tsa", u"つぁ"), (u"tsi", u"つぃ"), (u"tse", u"つぇ"), (u"tso", u"つぉ"),
    (u"fa", u"ふぁ"), (u"fi", u"ふぃ"), (u"fe", u"ふぇ"), (u"fo", u"ふぉ"),
    (u"shi", u"し"), (u"chi", u"ち"), (u"tsu", u"つ"), (u"fu", u"ふ"),
    (u"ji", u"じ"), (u"zi", u"じ"),
]
_SYLLABLE = {
    u"ka": u"か", u"ki": u"き", u"ku": u"く", u"ke": u"け", u"ko": u"こ",
    u"ga": u"が", u"gi": u"ぎ", u"gu": u"ぐ", u"ge": u"げ", u"go": u"ご",
    u"sa": u"さ", u"si": u"し", u"su": u"す", u"se": u"せ", u"so": u"そ",
    u"za": u"ざ", u"zu": u"ず", u"ze": u"ぜ", u"zo": u"ぞ",
    u"ta": u"た", u"ti": u"ち", u"tu": u"つ", u"te": u"て", u"to": u"と",
    u"da": u"だ", u"di": u"ぢ", u"du": u"づ", u"de": u"で", u"do": u"ど",
    u"na": u"な", u"ni": u"に", u"nu": u"ぬ", u"ne": u"ね", u"no": u"の",
    u"ha": u"は", u"hi": u"ひ", u"hu": u"ふ", u"he": u"へ", u"ho": u"ほ",
    u"ba": u"ば", u"bi": u"び", u"bu": u"ぶ", u"be": u"べ", u"bo": u"ぼ",
    u"pa": u"ぱ", u"pi": u"ぴ", u"pu": u"ぷ", u"pe": u"ぺ", u"po": u"ぽ",
    u"ma": u"ま", u"mi": u"み", u"mu": u"む", u"me": u"め", u"mo": u"も",
    u"ya": u"や", u"yu": u"ゆ", u"yo": u"よ",
    u"ra": u"ら", u"ri": u"り", u"ru": u"る", u"re": u"れ", u"ro": u"ろ",
    u"wa": u"わ", u"wi": u"うぃ", u"we": u"うぇ", u"wo": u"を",
    u"a": u"あ", u"i": u"い", u"u": u"う", u"e": u"え", u"o": u"お",
    u"n": u"ん",
}
_PUNCT = {
    u".": u"。", u",": u"、", u"?": u"？", u"!": u"！",
    u";": u"。", u":": u"：",
}
_TOKEN = re.compile(u"[A-Za-z\u00c0-\u024f\u2019']+|[.,!?;:]+")


def _norm_key(text):
    lowered = (text or u"").strip().lower()
    for src, dst in _MACRON.items():
        lowered = lowered.replace(src, dst)
    return lowered


def _latin_tokens(text):
    return [match.group(0) for match in _TOKEN.finditer(text or u"") if match.group(0)[:1] not in u".,!?;:"]


def _chouon_source(token):
    text = (token or u"").lower()
    for src, vowel in ((u"ā", u"a"), (u"ī", u"i"), (u"ū", u"u"), (u"ē", u"e"), (u"ō", u"o")):
        text = text.replace(src, vowel + u"\u30fc")
    return text


def _convert_token(token, chouon=False):
    if chouon:
        src = _chouon_source(token)
    else:
        src = _norm_key(token)
    src = src.replace(u"n'", u"ん").replace(u"n\u2019", u"ん").replace(u"'", u"")
    out = []
    i = 0
    while i < len(src):
        if src[i] == u"ん":
            out.append(u"ん")
            i += 1
            continue
        if src[i] == u"\u30fc":
            out.append(u"ー")
            i += 1
            continue
        if i + 1 < len(src) and src[i] == src[i + 1] and src[i] not in u"aeioun'":
            out.append(u"っ")
            i += 1
            continue
        if src.startswith(u"tch", i) or src.startswith(u"cch", i):
            out.append(u"っ")
            i += 1
            continue
        matched = False
        for roma, kana in _DIGRAPH:
            if src.startswith(roma, i):
                out.append(kana)
                i += len(roma)
                matched = True
                break
        if matched:
            continue
        if src[i] == u"n":
            nxt = src[i + 1] if i + 1 < len(src) else u""
            if not nxt or nxt not in u"aeiouy":
                out.append(u"ん")
                i += 1
                continue
        pair = src[i:i + 2]
        if pair in _SYLLABLE and len(pair) == 2 and pair[1:] in u"aeiou":
            out.append(_SYLLABLE[pair])
            i += 2
            continue
        one = src[i:i + 1]
        if one in _SYLLABLE:
            out.append(_SYLLABLE[one])
            i += 1
            continue
        i += 1
    return u"".join(out)


def _store(table, key, hira):
    if not key or not hira:
        return
    current = table.get(key)
    if current and current != hira:
        return
    table[key] = hira


def lexicon_from_course(course):
    table = {}
    for day in course.get("days") or []:
        for word in day.get("vocabulary") or []:
            romaji = word.get("romaji") or u""
            hira = word.get("hira") or u""
            tokens = _latin_tokens(romaji)
            if len(tokens) == 1:
                _store(table, _norm_key(tokens[0]), hira)
                continue
            choices = []
            for token in tokens:
                rule = _convert_token(token, False)
                cho = _convert_token(token, True)
                pair = [rule] if rule == cho else [rule, cho]
                choices.append(pair)
            picked = None
            if len(choices) <= 6:
                count = 1
                for pair in choices:
                    count *= len(pair)
                for mask in range(count):
                    parts = []
                    rest = mask
                    for pair in choices:
                        parts.append(pair[rest % len(pair)])
                        rest //= len(pair)
                    if u"".join(parts) == hira.replace(u" ", u"").replace(u"/", u""):
                        picked = parts
                        break
            if not picked:
                _store(table, _norm_key(romaji), hira)
                continue
            for token, part in zip(tokens, picked):
                _store(table, _norm_key(token), part)
    return table


def pronunciation(romaji, lexicon=None):
    if not romaji:
        return u""
    lexicon = lexicon or {}
    parts = []
    for match in _TOKEN.finditer(romaji):
        piece = match.group(0)
        if piece[:1] in u".,!?;:":
            parts.append(_PUNCT.get(piece[:1], piece[:1]))
            continue
        key = _norm_key(piece)
        if key in lexicon:
            parts.append(lexicon[key])
        elif key in _PARTICLE:
            parts.append(_PARTICLE[key])
        else:
            parts.append(_convert_token(piece))
    return u"".join(parts)


def _bare(text):
    return (text or u"").strip().strip(u" 。．.！？!?")


def _remember(bank, jp, romaji, hira):
    jp = (jp or u"").strip()
    if not jp or not (romaji or hira):
        return
    reading = {"romaji": romaji or u"", "hira": hira or u""}
    if jp not in bank:
        bank[jp] = reading
    bare = _bare(jp)
    if bare and bare not in bank:
        bank[bare] = reading


def apply_readings(course):
    lexicon = lexicon_from_course(course)
    bank = {}
    for day in course.get("days") or []:
        for word in day.get("vocabulary") or []:
            _remember(bank, word.get("jp"), word.get("romaji"), word.get("hira"))
        groups = []
        for pattern in day.get("grammar") or []:
            groups.append(pattern.get("examples") or [])
        groups.append(day.get("sentences") or [])
        groups.append(day.get("readingLines") or [])
        listening = day.get("listening") or {}
        groups.append(listening.get("lines") or [])
        for group in groups:
            for line in group:
                if not line.get("hira"):
                    line["hira"] = pronunciation(line.get("romaji") or u"", lexicon)
                _remember(bank, line.get("jp"), line.get("romaji"), line.get("hira"))
        for item in day.get("writing") or []:
            answer = (item.get("answer") or u"").strip()
            known = bank.get(answer) or bank.get(_bare(answer))
            if known:
                if not item.get("romaji"):
                    item["romaji"] = known["romaji"]
                if not item.get("hira"):
                    item["hira"] = known["hira"]
            elif not item.get("hira") and item.get("romaji"):
                item["hira"] = pronunciation(item.get("romaji"), lexicon)
        _refresh_audio(day)
    return course


def _refresh_audio(day):
    number = int(day.get("day") or 0)
    items = []

    def add(kind, line, index):
        items.append({
            "kind": kind,
            "file": "day-%02d/%s/%02d.mp3" % (number, kind, index + 1),
            "jp": line.get("jp") or u"",
            "hira": line.get("hira") or u"",
            "romaji": line.get("romaji") or u"",
            "en": line.get("en") or u"",
        })

    for index, word in enumerate(day.get("vocabulary") or []):
        add("word", word, index)
    grammar_index = 0
    for pattern in day.get("grammar") or []:
        for example in pattern.get("examples") or []:
            if example.get("jp"):
                add("grammar", example, grammar_index)
                grammar_index += 1
    for index, sentence in enumerate(day.get("sentences") or []):
        add("sentence", sentence, index)
    for index, line in enumerate(day.get("readingLines") or []):
        add("reading", line, index)
    for index, line in enumerate((day.get("listening") or {}).get("lines") or []):
        add("dictation", line, index)
    day["audio"] = items
