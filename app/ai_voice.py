# -*- coding: utf-8 -*-
"""Japanese AI voice files from VOICEVOX, saved as mp3.

Python 3.4 standard library only. Speaker 2 is Shikoku Metan, normal.
"""
from __future__ import print_function

import hashlib
import json
import os
import socket
import ssl
import threading
import time
from urllib.parse import quote

ROOT = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(ROOT, "data", "audio", "cache")
SPEAKER = 2
API = "api.tts.quest"
_PACE = threading.Lock()
_NEXT = [0.0]


def cache_path(text):
    if not os.path.isdir(CACHE):
        os.makedirs(CACHE)
    digest = hashlib.sha1(("voicevox:%d\n%s" % (SPEAKER, text)).encode("utf-8")).hexdigest()
    return os.path.join(CACHE, digest + ".mp3")


def _mp3(data):
    if not data or len(data) < 200:
        return False
    if data.startswith(b"ID3"):
        return True
    return data[0] == 255 and (data[1] & 0xE0) == 0xE0


def _read_http(host, path, timeout):
    request = (
        "GET %s HTTP/1.1\r\nHost: %s\r\nConnection: close\r\n"
        "User-Agent: JapaneseStudy/1.0\r\nAccept: */*\r\n\r\n"
    ) % (path, host)
    raw = socket.create_connection((host, 443), timeout)
    context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
    context.verify_mode = ssl.CERT_NONE
    sock = context.wrap_socket(raw, server_hostname=host)
    sock.settimeout(timeout)
    try:
        sock.sendall(request.encode("ascii"))
        data = b""
        while True:
            try:
                chunk = sock.recv(65536)
            except socket.timeout:
                break
            if not chunk:
                break
            data += chunk
    finally:
        try:
            sock.close()
        except Exception:
            pass
    head, _, body = data.partition(b"\r\n\r\n")
    status = head.split(b"\r\n", 1)[0]
    if b"chunked" in head.lower():
        parts = []
        rest = body
        while rest:
            line, _, rest = rest.partition(b"\r\n")
            if not line:
                continue
            try:
                size = int(line.strip(), 16)
            except ValueError:
                break
            if size == 0:
                break
            parts.append(rest[:size])
            rest = rest[size:]
            if rest.startswith(b"\r\n"):
                rest = rest[2:]
        body = b"".join(parts)
    code = 0
    parts = status.split()
    if len(parts) >= 2:
        try:
            code = int(parts[1])
        except ValueError:
            code = 0
    return code, body


def _json_url(url, timeout):
    host, path = _split(url)
    code, body = _read_http(host, path, timeout)
    if code != 200:
        raise IOError("http %s" % code)
    return json.loads(body.decode("utf-8"))


def _split(url):
    rest = url[len("https://"):] if url.startswith("https://") else url
    host, _, path = rest.partition("/")
    return host, "/" + path


def _api_get(path, timeout=20):
    with _PACE:
        wait = _NEXT[0] - time.time()
        if wait > 0:
            time.sleep(wait)
        code, raw = _read_http(API, path, timeout)
        gap = 1.6
        if code == 429:
            try:
                gap = float(json.loads(raw.decode("utf-8")).get("retryAfter") or 4)
            except Exception:
                gap = 4
        _NEXT[0] = time.time() + min(max(gap, 1.6), 20)
        return code, raw


def request_job(text, timeout=40):
    text = (text or "").strip()
    if not text:
        raise ValueError("empty text")
    path = "/v3/voicevox/synthesis?speaker=%d&text=%s" % (SPEAKER, quote(text, safe=""))
    deadline = time.time() + timeout
    while time.time() < deadline:
        code, raw = _api_get(path, 20)
        if code == 200:
            payload = json.loads(raw.decode("utf-8"))
            if payload.get("success") and payload.get("mp3DownloadUrl"):
                return payload
        if code not in (200, 429) and code < 500:
            raise IOError("http %s" % code)
        time.sleep(1)
    raise IOError("busy")


def fetch_if_ready(payload, timeout=20):
    status_url = payload.get("audioStatusUrl") or ""
    state = _json_url(status_url, timeout)
    if state.get("isAudioError"):
        raise IOError("audio error")
    if not state.get("isAudioReady"):
        return None
    host, mp3_path = _split(payload.get("mp3DownloadUrl") or "")
    code, data = _read_http(host, mp3_path, 30)
    if code != 200 or not _mp3(data):
        raise IOError("bad mp3")
    return data


def synthesize(text, timeout=45):
    payload = request_job(text, timeout)
    deadline = time.time() + timeout
    while time.time() < deadline:
        data = fetch_if_ready(payload, 20)
        if data:
            return data
        time.sleep(0.45)
    raise IOError("audio not ready")


def save(text, path, timeout=45):
    folder = os.path.dirname(path)
    if folder and not os.path.isdir(folder):
        os.makedirs(folder)
    data = synthesize(text, timeout)
    if not _mp3(data):
        raise IOError("no audio")
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
    cached = cache_path(text)
    if cached != path and not (os.path.isfile(cached) and os.path.getsize(cached) >= 200):
        try:
            if not os.path.isdir(CACHE):
                os.makedirs(CACHE)
            with open(cached, "wb") as handle:
                handle.write(data)
        except OSError:
            pass
    return len(data)
