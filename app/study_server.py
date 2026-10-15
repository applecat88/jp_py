# -*- coding: utf-8 -*-
"""Local study server for Windows.

Python 3.4 standard library only. The course itself is data/course.json,
so another language can load that file and ignore this server.
"""
from __future__ import print_function

import binascii
import datetime
import hashlib
import hmac
import io
import json
import os
import shutil
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

import native_voice

ROOT = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.normpath(os.path.join(ROOT, "web"))
DATA = os.path.join(ROOT, "data")
COURSE = os.path.join(DATA, "course.json")
PROGRESS = os.path.join(DATA, "progress.json")
USERS = os.path.join(DATA, "users.json")
ACCOUNTS = os.path.join(DATA, "accounts")
AUDIO = os.path.join(DATA, "audio")
CACHE = os.path.join(AUDIO, "cache")
PORT = 8765
SESSIONS = {}
_course_cache = None
TRACKS = ("dictation", "word", "grammar", "sentence", "reading", "extra")

TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
}

BINARY_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
}


def read_file(path):
    with io.open(path, "r", encoding="utf-8") as handle:
        return handle.read()


def load_course():
    global _course_cache
    if _course_cache is None:
        _course_cache = json.loads(read_file(COURSE))
    return _course_cache


def track_lines(day, track):
    if track == "dictation":
        listening = day.get("listening") or {}
        return listening.get("lines") or []
    if track == "word":
        lines = []
        for word in day.get("vocabulary") or []:
            en = word.get("en") or ""
            if word.get("hira"):
                en = en + " · " + word.get("hira")
            lines.append({"jp": word.get("jp") or ""})
        return lines
    if track == "grammar":
        lines = []
        for pattern in day.get("grammar") or []:
            lines.extend(pattern.get("examples") or [])
        return lines
    if track == "sentence":
        return day.get("sentences") or []
    if track == "reading":
        return day.get("readingLines") or []
    if track == "extra":
        return track_lines(day, "word") + track_lines(day, "grammar")
    return []


def find_day(number):
    for day in load_course().get("days") or []:
        if day.get("day") == number:
            return day
    return None


def audio_text(day_number, track, index, part):
    day = find_day(day_number)
    if day is None or track not in TRACKS:
        return ""
    lines = track_lines(day, track)
    if part == "all":
        chunks = []
        for line in lines:
            jp = (line.get("jp") or "").strip()
            if jp:
                chunks.append(jp)
        return "\n".join(chunks)
    if index < 0 or index >= len(lines):
        return ""
    return (lines[index].get("jp") or "").strip()


def clip_path(day_number, track, index, part):
    if track == "extra" and part != "all":
        day = find_day(day_number)
        words = track_lines(day, "word") if day else []
        if index < len(words):
            return clip_path(day_number, "word", index, "")
        return clip_path(day_number, "grammar", index - len(words), "")
    folder = os.path.join(AUDIO, "day-%02d" % day_number, track)
    name = "all.mp3" if part == "all" else "%02d.mp3" % (index + 1)
    return os.path.join(folder, name)


def _mp3_ready(path):
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


def _discard_broken(path):
    if not os.path.isfile(path) or _mp3_ready(path):
        return
    try:
        age = time.time() - os.path.getmtime(path)
    except OSError:
        return
    if age < 15:
        return
    try:
        os.remove(path)
    except OSError:
        pass


def cache_path(text):
    if not os.path.isdir(CACHE):
        os.makedirs(CACHE)
    digest = hashlib.sha1(text.encode("utf-8")).hexdigest()
    return os.path.join(CACHE, digest + ".mp3")


def cached_audio(text, allow_network=True):
    path = cache_path(text)
    if _mp3_ready(path):
        return path
    legacy = os.path.join(AUDIO, os.path.basename(path))
    if _mp3_ready(legacy):
        shutil.copyfile(legacy, path)
        return path
    if not allow_network:
        raise IOError("local recording missing")
    native_voice.save(text, path, timeout=12)
    if not _mp3_ready(path):
        raise IOError("recording not ready")
    return path


def stored_audio(day_number, track, index, part, text, allow_network=True, rebuild=False):
    path = clip_path(day_number, track, index, part)
    if rebuild:
        _discard_broken(path)
    if _mp3_ready(path):
        return path
    if os.path.isfile(path):
        time.sleep(0.4)
        if _mp3_ready(path):
            return path
    folder = os.path.dirname(path)
    if folder and not os.path.isdir(folder):
        os.makedirs(folder)
    cached = cache_path(text) if text else ""
    legacy = os.path.join(AUDIO, os.path.basename(cached)) if cached else ""
    for source in (cached, legacy):
        if source and _mp3_ready(source):
            shutil.copyfile(source, path)
            if _mp3_ready(path):
                return path
    if not allow_network:
        raise IOError("local recording missing")
    native_voice.save(text, path, timeout=12)
    if not _mp3_ready(path):
        raise IOError("recording not ready")
    if cached and not _mp3_ready(cached):
        try:
            shutil.copyfile(path, cached)
        except OSError:
            pass
    return path


def write_file(path, text):
    folder = os.path.dirname(path)
    if not os.path.isdir(folder):
        os.makedirs(folder)
    with io.open(path, "w", encoding="utf-8") as handle:
        handle.write(text)


def clean_text(value, limit):
    text = value.strip() if isinstance(value, str) else ""
    if not text or len(text) > limit:
        return ""
    for ch in text:
        if ord(ch) < 32:
            return ""
    return text


def valid_birth(text):
    parts = text.split("-")
    if len(parts) != 3:
        return False
    try:
        year = int(parts[0])
        month = int(parts[1])
        day = int(parts[2])
        born = datetime.date(year, month, day)
    except ValueError:
        return False
    if born.year < 1900 or born > datetime.date.today():
        return False
    return True


def hash_password(password, salt_hex=None):
    salt = None
    if salt_hex:
        try:
            salt = binascii.unhexlify(salt_hex.encode("ascii"))
        except (TypeError, binascii.Error):
            salt = None
    if not salt:
        salt = os.urandom(16)
        salt_hex = binascii.hexlify(salt).decode("ascii")
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 80000)
    return salt_hex, binascii.hexlify(digest).decode("ascii")


def load_users():
    if not os.path.isfile(USERS):
        return []
    try:
        data = json.loads(read_file(USERS))
    except Exception:
        return []
    if isinstance(data, dict) and isinstance(data.get("users"), list):
        return data.get("users")
    return []


def save_users(users):
    write_file(USERS, json.dumps({"users": users}, ensure_ascii=False, indent=1))


def find_user(identifier):
    key = identifier.lower()
    for user in load_users():
        if str(user.get("identifier") or "").lower() == key:
            return user
    return None


def public_user(user):
    return {
        "name": user.get("name") or "",
        "identifier": user.get("identifier") or "",
        "gender": user.get("gender") or "",
        "birth": user.get("birth") or "",
    }


def account_progress_path(identifier):
    digest = hashlib.sha1(identifier.lower().encode("utf-8")).hexdigest()
    return os.path.join(ACCOUNTS, digest + ".json")


def empty_progress():
    return {
        "startDate": "2026-10-15",
        "selectedDay": 1,
        "mode": "calendar",
        "hideRomaji": False,
        "hidePronunciation": False,
        "rate": 0.9,
        "repeats": 1,
        "volume": 1,
        "days": {},
    }


def read_account_progress(identifier):
    path = account_progress_path(identifier)
    if not os.path.isfile(path):
        return empty_progress()
    try:
        data = json.loads(read_file(path))
    except Exception:
        return empty_progress()
    return data if isinstance(data, dict) else empty_progress()


def write_account_progress(identifier, data):
    write_file(account_progress_path(identifier), json.dumps(data, ensure_ascii=False, indent=1))


def create_account_progress(identifier, first):
    path = account_progress_path(identifier)
    if not os.path.isdir(ACCOUNTS):
        os.makedirs(ACCOUNTS)
    if first and os.path.isfile(PROGRESS):
        shutil.copyfile(PROGRESS, path)
        return
    write_file(path, json.dumps(empty_progress(), ensure_ascii=False, indent=1))


def issue_token(identifier):
    token = binascii.hexlify(os.urandom(24)).decode("ascii")
    SESSIONS[token] = identifier
    return token


def session_identifier(handler):
    token = handler.headers.get("X-Session") or ""
    identifier = SESSIONS.get(token)
    if not identifier or not find_user(identifier):
        if token:
            SESSIONS.pop(token, None)
        return ""
    return identifier


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

    def _json(self, code, data):
        self._send(code, json.dumps(data, ensure_ascii=False), "application/json; charset=utf-8")

    def _read_json(self):
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length < 0 or length > 1000000:
            return None
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw.decode("utf-8"))
        except Exception:
            return None
        if not isinstance(data, dict):
            return None
        return data

    def _auth_payload(self, user):
        return {
            "ok": True,
            "token": issue_token(user.get("identifier") or ""),
            "user": public_user(user),
            "progress": read_account_progress(user.get("identifier") or ""),
        }

    def _send(self, code, payload, content_type):
        if not isinstance(payload, bytes):
            payload = payload.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def _send_mp3(self, path, download_name):
        with open(path, "rb") as handle:
            payload = handle.read()
        self.send_response(200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "public, max-age=86400")
        if download_name:
            self.send_header("Content-Disposition", 'attachment; filename="%s"' % download_name)
        self.end_headers()
        self.wfile.write(payload)

    def _audio_from_text(self, text, download_name, stored_path=None, allow_network=True, rebuild=False):
        text = (text or "").strip()
        if not text or len(text) > 8000:
            self._send(400, "bad audio request", "text/plain; charset=utf-8")
            return
        try:
            if stored_path:
                path = stored_audio(
                    stored_path[0], stored_path[1], stored_path[2], stored_path[3],
                    text, allow_network, rebuild
                )
            else:
                path = cached_audio(text, allow_network)
        except Exception:
            self._send(404, "recording not ready", "text/plain; charset=utf-8")
            return
        if not _mp3_ready(path):
            self._send(404, "recording not ready", "text/plain; charset=utf-8")
            return
        self._send_mp3(path, download_name)

    def _inside_web(self, full):
        full = os.path.normpath(full)
        base = WEB
        return full == base or full.startswith(base + os.sep)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if path == "/api/audio":
            query = parse_qs(parsed.query)
            try:
                day_number = int((query.get("day") or ["0"])[0])
                index = int((query.get("i") or ["0"])[0])
            except ValueError:
                self._send(400, "bad audio request", "text/plain; charset=utf-8")
                return
            track = (query.get("track") or ["dictation"])[0]
            part = (query.get("part") or [""])[0]
            download = (query.get("dl") or [""])[0] == "1"
            allow_network = (query.get("local") or ["0"])[0] != "1"
            rebuild = (query.get("rebuild") or [""])[0] == "1"
            text = audio_text(day_number, track, index, part)
            if part == "all":
                name = "day-%02d-%s.mp3" % (day_number, track)
            else:
                name = "day-%02d-%s-%02d.mp3" % (day_number, track, index + 1)
            self._audio_from_text(
                text,
                name if download else "",
                (day_number, track, index, part),
                allow_network,
                rebuild,
            )
            return
        if path == "/api/course":
            self._send(200, read_file(COURSE), "application/json; charset=utf-8")
            return
        if path == "/api/session":
            identifier = session_identifier(self)
            user = find_user(identifier) if identifier else None
            if not user:
                self._json(401, {"ok": False})
                return
            self._json(200, {
                "ok": True,
                "user": public_user(user),
                "progress": read_account_progress(identifier),
            })
            return
        if path == "/api/progress":
            identifier = session_identifier(self)
            if not identifier:
                self._json(401, {"ok": False})
                return
            self._json(200, read_account_progress(identifier))
            return
        if path == "/":
            path = "/index.html"
        rel = path.lstrip("/").replace("/", os.sep)
        full = os.path.normpath(os.path.join(WEB, rel))
        if not self._inside_web(full) or not os.path.isfile(full):
            self._send(404, "not found", "text/plain; charset=utf-8")
            return
        ext = os.path.splitext(full)[1].lower()
        if ext in BINARY_TYPES:
            with open(full, "rb") as handle:
                self._send(200, handle.read(), BINARY_TYPES[ext])
            return
        self._send(200, read_file(full), TYPES.get(ext, "text/plain; charset=utf-8"))

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if path == "/api/audio":
            query = parse_qs(parsed.query)
            allow_network = (query.get("local") or ["0"])[0] != "1"
            length = int(self.headers.get("Content-Length", "0") or "0")
            if length < 0 or length > 1000000:
                self._send(413, "too large", "text/plain; charset=utf-8")
                return
            raw = self.rfile.read(length)
            try:
                data = json.loads(raw.decode("utf-8"))
            except Exception:
                self._send(400, "bad json", "text/plain; charset=utf-8")
                return
            text = data.get("text") if isinstance(data, dict) else ""
            self._audio_from_text(text if isinstance(text, str) else "", "", None, allow_network, False)
            return
        if path == "/api/logout":
            length = int(self.headers.get("Content-Length", "0") or "0")
            if 0 < length <= 1000000:
                self.rfile.read(length)
            token = self.headers.get("X-Session") or ""
            SESSIONS.pop(token, None)
            self._json(200, {"ok": True})
            return
        data = self._read_json()
        if data is None:
            self._send(400, "bad json", "text/plain; charset=utf-8")
            return
        if path == "/api/login":
            identifier = clean_text(data.get("identifier"), 40)
            password = data.get("password") if isinstance(data.get("password"), str) else ""
            if not identifier or not password:
                self._json(400, {"ok": False, "error": "Enter an identifier and a password."})
                return
            user = find_user(identifier)
            if not user:
                self._json(200, {"ok": False, "registered": False})
                return
            salt_hex, digest = hash_password(password, user.get("salt") or "")
            stored = user.get("password") or ""
            if len(stored) != len(digest) or not hmac.compare_digest(digest, stored):
                self._json(200, {
                    "ok": False,
                    "registered": True,
                    "error": "That identifier is registered. The password does not match.",
                })
                return
            self._json(200, self._auth_payload(user))
            return
        if path == "/api/register":
            name = clean_text(data.get("name"), 60)
            identifier = clean_text(data.get("identifier"), 40)
            gender = data.get("gender") if isinstance(data.get("gender"), str) else ""
            birth = data.get("birth") if isinstance(data.get("birth"), str) else ""
            password = data.get("password") if isinstance(data.get("password"), str) else ""
            if not name or not identifier or gender not in ("female", "male", "other") or not valid_birth(birth):
                self._json(400, {"ok": False, "error": "Name, identifier, gender, date of birth, and password are required."})
                return
            if len(password) < 4 or len(password) > 80:
                self._json(400, {"ok": False, "error": "Use at least 4 characters for the password."})
                return
            if find_user(identifier):
                self._json(200, {"ok": False, "registered": True, "error": "That identifier is already registered. Sign in with its password."})
                return
            users = load_users()
            salt_hex, digest = hash_password(password)
            create_account_progress(identifier, not users)
            users.append({
                "name": name,
                "identifier": identifier,
                "gender": gender,
                "birth": birth,
                "salt": salt_hex,
                "password": digest,
            })
            save_users(users)
            self._json(200, self._auth_payload(users[-1]))
            return
        if path != "/api/progress":
            self._send(404, "not found", "text/plain; charset=utf-8")
            return
        identifier = session_identifier(self)
        if not identifier:
            self._json(401, {"ok": False})
            return
        write_account_progress(identifier, data)
        self._json(200, {"ok": True})


def main():
    if not os.path.isfile(COURSE):
        import build_course
        build_course.main()
    server = HTTPServer(("127.0.0.1", PORT), Handler)
    url = "http://127.0.0.1:{0}/".format(PORT)
    print("Japanese study is running at " + url)
    print("The course file is app\\data\\course.json")
    print("Close this window to stop.")

    def open_browser():
        time.sleep(0.4)
        webbrowser.open(url)

    threading.Thread(target=open_browser).start()
    server.serve_forever()


if __name__ == "__main__":
    main()
