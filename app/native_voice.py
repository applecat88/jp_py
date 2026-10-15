# -*- coding: utf-8 -*-
"""Japanese neural voice (Nanami) via the Edge read-aloud service.

Python 3.4 standard library only. Saves 24 kHz mp3 files.
"""
from __future__ import print_function

import binascii
import os
import socket
import ssl
import struct
import time
import uuid

TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4"
WIN_EPOCH = 11644473600
S_TO_NS = 1e9
VOICE = "ja-JP-NanamiNeural"
SEC_MS_GEC_VERSION = "2-143.0.3650.75"
HOST = "speech.platform.bing.com"

_U32_MASK = 0xFFFFFFFF
_SHA256_INITIAL = (
    0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
    0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19,
)
_SHA256_STATE = (
    0xFD9FBEA2, 0x91243CE7, 0xBE499094, 0xCD2E1E0A,
    0x6C006F49, 0x04BD35AB, 0xFEB0A7E4, 0x03EFFBD2,
)
_SHA256_SCHEDULE = (
    0xEB24BF9E, 0x1558691F, 0xA0C09EE2, 0x0CFA32BA, 0xA622EE8C,
    0xD1DD9491, 0xC0DD25A0, 0xF9E70AB6, 0xF0C31573, 0x7058CE4E,
    0x7188E606, 0x00E5AB33, 0xD258B060, 0x72766564,
)
_SHA256_ROUND_CONSTANTS = (
    0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1,
    0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
    0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786,
    0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
    0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147,
    0x06CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
    0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B,
    0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
    0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A,
    0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
    0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,
)
_SHA256_ADJUSTMENT = 0xC9DC06A7
_SHA256_BLOCK_CONSTANTS = _SHA256_ROUND_CONSTANTS[:14] + (_SHA256_ADJUSTMENT,) + _SHA256_ROUND_CONSTANTS[15:]
_SHA256_SIGMA0_ADJUSTMENT = 0x059C0B80
_SHA256_SIGMA1_ADJUSTMENT = 0x000B92C0
_CS64_COEFFICIENTS = (
    (0xE82E91B1, 0xB32700D0), (0x44DE24C6, 0x88DFF51D), (0x3BEB65BC, 0x29514038),
    (0xC89C5933, 0xB328CBDF), (0x8D1EC211, 0xD405B4D5), (0x314EF5D5, 0x26E55F3C),
    (0xE92491B1, 0x607801C6), (0xF0A5B9D5, 0x82B2C1FB), (0x06064CF3, 0xFA51A3DA),
    (0xDA79FA60, 0x207CC464), (0xBED20560, 0x3C3C74F3), (0x89F9C9F8, 0xD2D14B61),
    (0x35FA38C6, 0xBB04A2C1), (0xCB49E3C6, 0xC5626167),
)
_CS64_FACTOR = 0x82893933
_CS64_ADJUSTMENT0 = 0xF2F90B1A
_CS64_ADJUSTMENT1 = 0x0B1A0000


def _rol16(value):
    value &= _U32_MASK
    return ((value << 16) | (value >> 16)) & _U32_MASK


def _words_le4_even(data):
    padded = data + b"\x00" * ((-len(data)) % 4)
    if not padded:
        return []
    words = list(struct.unpack("<" + str(len(padded) // 4) + "I", padded))
    if len(words) % 2:
        words.append(0)
    return words


def _sigma0(value):
    return ((value >> 7) ^ (value << 25) ^ (value >> 18) ^ (value << 14) ^ (value >> 3)) & _U32_MASK


def _sigma1(value):
    return ((value >> 17) ^ (value << 15) ^ (value >> 19) ^ (value << 13) ^ (value >> 10)) & _U32_MASK


def _sha256_rounds(state, words, first_round=0):
    a, b, c, d, e, f, g, h = state
    mask = _U32_MASK
    constants = _SHA256_BLOCK_CONSTANTS if first_round == 14 else _SHA256_ROUND_CONSTANTS
    aligned = min(64, ((first_round + 7) // 8) * 8)
    index = first_round
    while index < aligned:
        rot_e = e * 0x100000001
        rot_a = a * 0x100000001
        t1 = h + ((rot_e >> 6) ^ (rot_e >> 11) ^ (rot_e >> 25)) + (g ^ (e & (f ^ g))) + constants[index] + words[index]
        t2 = ((rot_a >> 2) ^ (rot_a >> 13) ^ (rot_a >> 22)) + ((a & b) | (c & (a | b)))
        a, b, c, d, e, f, g, h = (t1 + t2) & mask, a, b, c, (d + t1) & mask, e, f, g
        index += 1
    index = aligned
    while index < 64:
        rot_e = e * 0x100000001
        rot_a = a * 0x100000001
        t1 = h + ((rot_e >> 6) ^ (rot_e >> 11) ^ (rot_e >> 25)) + (g ^ (e & (f ^ g))) + constants[index] + words[index]
        d = (d + t1) & mask
        h = (t1 + ((rot_a >> 2) ^ (rot_a >> 13) ^ (rot_a >> 22)) + ((a & b) | (c & (a | b)))) & mask
        rot_e = d * 0x100000001
        rot_a = h * 0x100000001
        t1 = g + ((rot_e >> 6) ^ (rot_e >> 11) ^ (rot_e >> 25)) + (f ^ (d & (e ^ f))) + constants[index + 1] + words[index + 1]
        c = (c + t1) & mask
        g = (t1 + ((rot_a >> 2) ^ (rot_a >> 13) ^ (rot_a >> 22)) + ((h & a) | (b & (h | a)))) & mask
        rot_e = c * 0x100000001
        rot_a = g * 0x100000001
        t1 = f + ((rot_e >> 6) ^ (rot_e >> 11) ^ (rot_e >> 25)) + (e ^ (c & (d ^ e))) + constants[index + 2] + words[index + 2]
        b = (b + t1) & mask
        f = (t1 + ((rot_a >> 2) ^ (rot_a >> 13) ^ (rot_a >> 22)) + ((g & h) | (a & (g | h)))) & mask
        rot_e = b * 0x100000001
        rot_a = f * 0x100000001
        t1 = e + ((rot_e >> 6) ^ (rot_e >> 11) ^ (rot_e >> 25)) + (d ^ (b & (c ^ d))) + constants[index + 3] + words[index + 3]
        a = (a + t1) & mask
        e = (t1 + ((rot_a >> 2) ^ (rot_a >> 13) ^ (rot_a >> 22)) + ((f & g) | (h & (f | g)))) & mask
        rot_e = a * 0x100000001
        rot_a = e * 0x100000001
        t1 = d + ((rot_e >> 6) ^ (rot_e >> 11) ^ (rot_e >> 25)) + (c ^ (a & (b ^ c))) + constants[index + 4] + words[index + 4]
        h = (h + t1) & mask
        d = (t1 + ((rot_a >> 2) ^ (rot_a >> 13) ^ (rot_a >> 22)) + ((e & f) | (g & (e | f)))) & mask
        rot_e = h * 0x100000001
        rot_a = d * 0x100000001
        t1 = c + ((rot_e >> 6) ^ (rot_e >> 11) ^ (rot_e >> 25)) + (b ^ (h & (a ^ b))) + constants[index + 5] + words[index + 5]
        g = (g + t1) & mask
        c = (t1 + ((rot_a >> 2) ^ (rot_a >> 13) ^ (rot_a >> 22)) + ((d & e) | (f & (d | e)))) & mask
        rot_e = g * 0x100000001
        rot_a = c * 0x100000001
        t1 = b + ((rot_e >> 6) ^ (rot_e >> 11) ^ (rot_e >> 25)) + (a ^ (g & (h ^ a))) + constants[index + 6] + words[index + 6]
        f = (f + t1) & mask
        b = (t1 + ((rot_a >> 2) ^ (rot_a >> 13) ^ (rot_a >> 22)) + ((c & d) | (e & (c | d)))) & mask
        rot_e = f * 0x100000001
        rot_a = b * 0x100000001
        t1 = a + ((rot_e >> 6) ^ (rot_e >> 11) ^ (rot_e >> 25)) + (h ^ (f & (g ^ h))) + constants[index + 7] + words[index + 7]
        e = (e + t1) & mask
        a = (t1 + ((rot_a >> 2) ^ (rot_a >> 13) ^ (rot_a >> 22)) + ((b & c) | (d & (b | c)))) & mask
        index += 8
    return a, b, c, d, e, f, g, h


def _expand_sha256_schedule(words, first_word=16):
    mask = _U32_MASK
    index = first_word
    while index < 64:
        x, y = words[index - 2], words[index - 15]
        sigma1 = (x >> 17) ^ (x << 15) ^ (x >> 19) ^ (x << 13) ^ (x >> 10)
        sigma0 = (y >> 7) ^ (y << 25) ^ (y >> 18) ^ (y << 14) ^ (y >> 3)
        words.append((sigma1 + words[index - 7] + sigma0 + words[index - 16]) & mask)
        index += 1


def _sha256_init(data):
    mask = _U32_MASK
    words = [0] * 14 + [int.from_bytes(data[:3], "big")]
    words.append(int.from_bytes(data[3:7], "big"))
    index = 16
    while index < 30:
        value = _SHA256_SCHEDULE[index - 16]
        if index - 2 >= 14:
            extra = _sigma1(words[index - 2])
            if index == 16:
                extra ^= _SHA256_SIGMA1_ADJUSTMENT
            value += extra
        if index - 7 >= 14:
            value += words[index - 7]
        if index - 15 >= 14:
            extra = _sigma0(words[index - 15])
            if index == 29:
                extra ^= _SHA256_SIGMA0_ADJUSTMENT
            value += extra
        words.append(value & mask)
        index += 1
    words.append((
        _sigma1(words[28]) + words[23] + _sigma0(words[15]) + words[14]
        + _SHA256_ADJUSTMENT - _SHA256_ROUND_CONSTANTS[14]
    ) & mask)
    _expand_sha256_schedule(words, 31)
    working = _sha256_rounds(_SHA256_STATE, words, 14)
    return tuple((x + y) & mask for x, y in zip(_SHA256_INITIAL, working))


def _sha256_digest(data):
    if len(data) < 7:
        raise ValueError("token salt is too short")
    mask = _U32_MASK
    length = 57 + len(data)
    padded = data[7:] + b"\x80" + b"\x00" * ((55 - length) % 64)
    padded += struct.pack(">Q", length * 8)
    state = _sha256_init(data[:7])
    offset = 0
    while offset < len(padded):
        words = list(struct.unpack(">16I", padded[offset:offset + 64]))
        _expand_sha256_schedule(words)
        working = _sha256_rounds(state, words)
        state = tuple((x + y) & mask for x, y in zip(state, working))
        offset += 64
    return struct.pack(">8I", *state)


def _cs64_digest(data, digest):
    mask = _U32_MASK
    key_a, key_b = struct.unpack_from("<II", digest)
    key_a |= 1
    key_b |= 1
    factors = ((key_a * _CS64_FACTOR) & mask, (key_b * _CS64_FACTOR) & mask)
    terms = []
    offsets = []
    for index, pair in enumerate(_CS64_COEFFICIENTS):
        terms.append((pair[0] * factors[index % 2]) & mask)
        offsets.append(pair[1])
    for index, word in enumerate(_words_le4_even(b"\x00" + data)):
        if index % 2 == 0:
            term = word * key_a
            offset = _rol16(word) * 0xEF0569FB
        else:
            term = word * key_b
            offset = _rol16(word) * 0xC31713DB
        if index == 0:
            term += _CS64_ADJUSTMENT0 * factors[0]
            offset += _CS64_ADJUSTMENT1
        terms.append(term & mask)
        offsets.append(offset & mask)
    swap_acc = swap_last = state = acc = 0
    index = 0
    while index < len(terms):
        x, y = terms[index], terms[index + 1]
        t = _rol16((offsets[index] + x) & mask)
        q = (t * 0x76F50F34) & mask
        swap_acc += (_rol16(q) * 0xC3EFEA97 + q) & mask
        t = _rol16((offsets[index + 1] + y) & mask)
        q = (t * 0x1881CE3C) & mask
        swap_last = (_rol16(q) * 0x35BD1EC9 + q) & mask
        swap_acc = (swap_acc + swap_last) & mask
        state = (state * key_a + x) & mask
        state = (_rol16(state) * 0xCF98B111) & mask
        state = (_rol16(state) * 0x87085B9F) & mask
        state = (_rol16(state) * 0x12CEB96D) & mask
        state = (_rol16(state) * 0x257E1D83) & mask
        acc += state
        t = (state * key_b + y) & mask
        t = (_rol16(t) * 0xA27416F5) & mask
        t = (_rol16(t) * 0xD38396FF) & mask
        state = (_rol16((_rol16(t) * 0x7C932B89) & mask) * 0xBFA49F69) & mask
        acc = (acc + state) & mask
        index += 2
    return swap_last ^ state, swap_acc ^ acc


def sec_ms_gec(unix_timestamp=None):
    ticks = time.time() if unix_timestamp is None else float(unix_timestamp)
    ticks += WIN_EPOCH
    ticks -= ticks % 300
    ticks *= S_TO_NS / 100
    raw = ("%.0f%s" % (ticks, TRUSTED_CLIENT_TOKEN)).encode("ascii")
    digest = _sha256_digest(raw)
    cs64 = struct.pack("<II", *_cs64_digest(raw, digest))
    return binascii.hexlify(cs64).decode("ascii").upper() + "-" + binascii.hexlify(digest).decode("ascii").upper()


def _xml(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _recv_exact(sock, size):
    chunks = []
    left = size
    while left:
        piece = sock.recv(left)
        if not piece:
            raise IOError("connection closed")
        chunks.append(piece)
        left -= len(piece)
    return b"".join(chunks)


def _send_frame(sock, opcode, payload):
    header = bytearray()
    header.append(0x80 | opcode)
    length = len(payload)
    if length < 126:
        header.append(0x80 | length)
    elif length < 65536:
        header.append(0x80 | 126)
        header.extend(struct.pack(">H", length))
    else:
        header.append(0x80 | 127)
        header.extend(struct.pack(">Q", length))
    mask = os.urandom(4)
    header.extend(mask)
    masked = bytearray(payload)
    i = 0
    while i < len(masked):
        masked[i] ^= mask[i % 4]
        i += 1
    sock.sendall(bytes(header) + bytes(masked))


def _recv_frame(sock):
    head = _recv_exact(sock, 2)
    b0 = head[0]
    b1 = head[1]
    opcode = b0 & 0x0F
    fin = (b0 & 0x80) != 0
    length = b1 & 0x7F
    if length == 126:
        length = struct.unpack(">H", _recv_exact(sock, 2))[0]
    elif length == 127:
        length = struct.unpack(">Q", _recv_exact(sock, 8))[0]
    mask = _recv_exact(sock, 4) if (b1 & 0x80) else None
    payload = _recv_exact(sock, length) if length else b""
    if mask:
        raw = bytearray(payload)
        i = 0
        while i < len(raw):
            raw[i] ^= mask[i % 4]
            i += 1
        payload = bytes(raw)
    return fin, opcode, payload


def _connect(token):
    connection_id = uuid.uuid4().hex
    muid = binascii.hexlify(os.urandom(16)).decode("ascii").upper()
    path = (
        "/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=%s"
        "&ConnectionId=%s&Sec-MS-GEC=%s&Sec-MS-GEC-Version=%s"
        % (TRUSTED_CLIENT_TOKEN, connection_id, token, SEC_MS_GEC_VERSION)
    )
    key = base64_key()
    request = (
        "GET %s HTTP/1.1\r\n"
        "Host: %s\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        "Sec-WebSocket-Key: %s\r\n"
        "Sec-WebSocket-Version: 13\r\n"
        "Origin: chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold\r\n"
        "Pragma: no-cache\r\n"
        "Cache-Control: no-cache\r\n"
        "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0\r\n"
        "Cookie: muid=%s;\r\n"
        "\r\n"
    ) % (path, HOST, key, muid)
    raw = socket.create_connection((HOST, 443), 20)
    context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
    context.verify_mode = ssl.CERT_NONE
    sock = context.wrap_socket(raw, server_hostname=HOST)
    sock.sendall(request.encode("ascii"))
    reply = b""
    while b"\r\n\r\n" not in reply:
        piece = sock.recv(4096)
        if not piece:
            break
        reply += piece
    status = reply.split(b"\r\n", 1)[0]
    if b" 101 " not in status:
        raise IOError(status.decode("ascii", "replace"))
    return sock


def base64_key():
    import base64
    return base64.b64encode(os.urandom(16)).decode("ascii")


def synthesize(text):
    text = (text or "").strip()
    if not text:
        raise ValueError("empty text")
    stamp = time.strftime("%a %b %d %Y %H:%M:%S GMT+0000 (Coordinated Universal Time)", time.gmtime())
    config = (
        "X-Timestamp:%s\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n"
        '{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},'
        '"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n'
    ) % stamp
    ssml = (
        "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ja-JP'>"
        "<voice name='%s'><prosody pitch='+0Hz' rate='+0%%' volume='+0%%'>%s</prosody></voice></speak>"
    ) % (VOICE, _xml(text))
    request_id = uuid.uuid4().hex
    ssml_msg = (
        "X-RequestId:%s\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:%sZ\r\nPath:ssml\r\n\r\n%s"
    ) % (request_id, stamp, ssml)
    sock = _connect(sec_ms_gec())
    sock.settimeout(45)
    try:
        _send_frame(sock, 1, config.encode("utf-8"))
        _send_frame(sock, 1, ssml_msg.encode("utf-8"))
        audio = bytearray()
        pending = b""
        pending_op = None
        while True:
            fin, opcode, payload = _recv_frame(sock)
            if opcode == 0 and pending_op is not None:
                pending += payload
                opcode = pending_op
                payload = pending
            if not fin:
                pending = payload
                pending_op = opcode
                continue
            pending = b""
            pending_op = None
            if opcode == 8:
                break
            if opcode == 9:
                _send_frame(sock, 10, payload)
                continue
            if opcode == 1:
                if b"Path:turn.end" in payload:
                    break
                continue
            if opcode == 2 and len(payload) >= 2:
                header_len = struct.unpack(">H", payload[:2])[0]
                if 2 + header_len <= len(payload):
                    body = payload[2 + header_len:]
                    if body:
                        audio.extend(body)
        if len(audio) < 200:
            raise IOError("no audio")
        return bytes(audio)
    finally:
        try:
            sock.close()
        except Exception:
            pass


def save(text, path):
    folder = os.path.dirname(path)
    if folder and not os.path.isdir(folder):
        os.makedirs(folder)
    data = synthesize(text)
    with open(path, "wb") as handle:
        handle.write(data)
    return len(data)


if __name__ == "__main__":
    import sys
    src = sys.argv[1]
    dest = sys.argv[2]
    import io
    text = io.open(src, encoding="utf-8").read()
    size = save(text, dest)
    print("OK", size)
