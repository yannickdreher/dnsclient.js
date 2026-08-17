/*
 * Project:  dnsclient.js
 * File:     dnsclient.js
 * Author:   Yannick Dreher (yannick.dreher@dremaxx.de)
 * -----
 * Created:  Friday, 29th November 2024 3:30:10 pm
 * -----
 * License: MIT License (https://opensource.org/licenses/MIT)
 * Copyright © 2024-2025 Yannick Dreher
 */

/**
 * @typedef {Object} DNSHeaderFlags
 * @property {number} qr - Query/Response flag (0=query, 1=response)
 * @property {number} opcode - Operation code
 * @property {boolean} aa - Authoritative Answer flag
 * @property {boolean} tc - Truncation flag
 * @property {boolean} rd - Recursion Desired flag
 * @property {boolean} ra - Recursion Available flag
 * @property {number} rcode - Response code
 */

/**
 * @typedef {Object} DNSQuestion
 * @property {string} name - Domain name
 * @property {number} type - Record type
 * @property {number} clazz - Record class
 */

/**
 * @typedef {Object} DNSRecord
 * @property {string} name - Domain name
 * @property {number} type - Record type
 * @property {number} clazz - Record class
 * @property {number} ttl - Time to live in seconds
 * @property {Uint8Array|Array<{key: string, value: *}>} data - Record data
 */

/**
 * @typedef {Object} DNSMessage
 * @property {number} id - Message identifier
 * @property {DNSHeaderFlags} flags - Header flags
 */

/**
 * @typedef {Object} DNSQueryMessage
 * @extends {DNSMessage}
 * @property {number} qdcount - Number of questions
 * @property {number} ancount - Number of answers
 * @property {number} nscount - Number of authority records
 * @property {number} arcount - Number of additional records
 * @property {Array<DNSQuestion|DNSRecord>} questions - Question section
 * @property {Array<DNSRecord>} answers - Answer section
 * @property {Array<DNSRecord>} authorities - Authority section
 * @property {Array<DNSRecord>} additionals - Additional section
 */

/**
 * @typedef {Object} DNSUpdateMessage
 * @extends {DNSMessage}
 * @property {number} zcount - Number of zones
 * @property {number} prcount - Number of prerequisites
 * @property {number} upcount - Number of updates
 * @property {number} adcount - Number of additional records
 * @property {Array<DNSRecord>} zones - Zone section
 * @property {Array<DNSRecord>} prerequisites - Prerequisite section
 * @property {Array<DNSRecord>} updates - Update section
 * @property {Array<DNSRecord>} additionals - Additional section
 */

/**
 * @typedef {Object} DNSQueryResult
 * @property {DNSQueryMessage|DNSUpdateMessage} result - DNS response message
 * @property {number} latency - Query latency in milliseconds
 */

/**
 * @typedef {Object} RDataItem
 * @property {string} key - Field name
 * @property {*} value - Field value
 */

/**
 * @typedef {Object} DeserializedName
 * @property {string} name - The deserialized domain name
 * @property {number} offset - Next offset after the name
 * @property {number} length - Length of the name in bytes
 */

/**
 * @typedef {Object} DeserializedRecord
 * @property {DNSRecord|DNSQuestion} record - The deserialized record
 * @property {number} offset - Next offset after the record
 */

// Enums
export const QR_NAMES = Object.freeze({
    0: "QUERY",
    1: "RESPONSE"
});

export const OPCODE_NAMES = Object.freeze({
    0: "QUERY",    // Standard query
    1: "IQUERY",   // Inverse query (obsolete)
    2: "STATUS",   // Server status request
    3: "RESERVED", // Reserved for future use
    4: "NOTIFY",   // Notify request
    5: "UPDATE",   // Dynamic update
    6: "DSO"       // DNS Stateful Operations
});

export const RCODE_NAMES = Object.freeze({
    0: "NOERROR",    // DNS Query completed successfully
    1: "FORMERR",    // DNS Query Format Error
    2: "SERVFAIL",   // Server failed to complete the DNS request
    3: "NXDOMAIN",   // Domain name does not exist
    4: "NOTIMP",     // Function not implemented
    5: "REFUSED",    // The server refused to answer for the query
    6: "YXDOMAIN",   // Name that should not exist, does exist
    7: "XRRSET",     // RRset that should not exist, does exist
    8: "NOTAUTH",    // Server not authoritative for the zone
    9: "NOTZONE",    // Name not in zone
    10: "BADVERS",   // Bad OPT Version
    11: "BADSIG",    // TSIG Signature Failure
    12: "BADKEY",    // Key not recognized
    13: "BADTIME",   // Signature out of time window
    14: "BADMODE",   // Bad TKEY Mode
    15: "BADNAME",   // Duplicate key name
    16: "BADALG",    // Algorithm not supported
    17: "BADTRUNC",  // Bad truncation
    18: "BADCOOKIE"  // Bad/missing server cookie
});

export const TYPE_NAMES = Object.freeze({
    1: "A",
    2: "NS",
    3: "MD",
    4: "MF",
    5: "CNAME",
    6: "SOA",
    7: "MB",
    8: "MG",
    9: "MR",
    10: "NULL",
    11: "WKS",
    12: "PTR",
    13: "HINFO",
    14: "MINFO",
    15: "MX",
    16: "TXT",
    17: "RP",
    18: "AFSDB",
    19: "X25",
    20: "ISDN",
    21: "RT",
    22: "NSAP",
    23: "NSAP_PTR",
    24: "SIG",
    25: "KEY",
    26: "PX",
    27: "GPOS",
    28: "AAAA",
    29: "LOC",
    30: "NXT",
    31: "EID",
    32: "NIMLOC",
    33: "SRV",
    34: "ATMA",
    35: "NAPTR",
    36: "KX",
    37: "CERT",
    38: "A6",
    39: "DNAME",
    40: "SINK",
    41: "OPT",
    42: "APL",
    43: "DS",
    44: "SSHFP",
    45: "IPSECKEY",
    46: "RRSIG",
    47: "NSEC",
    48: "DNSKEY",
    49: "DHCID",
    50: "NSEC3",
    51: "NSEC3PARAM",
    52: "TLSA",
    53: "SMIMEA",
    55: "HIP",
    56: "NINFO",
    57: "RKEY",
    58: "TALINK",
    59: "CDS",
    60: "CDNSKEY",
    61: "OPENPGPKEY",
    62: "CSYNC",
    63: "ZONEMD",
    64: "SVCB",
    65: "HTTPS",
    99: "SPF",
    100: "UINFO",
    101: "UID",
    102: "GID",
    103: "UNSPEC",
    104: "NID",
    105: "L32",
    106: "L64",
    107: "LP",
    108: "EUI48",
    109: "EUI64",
    249: "TKEY",
    250: "TSIG",
    251: "IXFR",
    252: "AXFR",
    253: "MAILB",
    254: "MAILA",
    255: "ANY",
    256: "URI",
    257: "CAA",
    258: "AVC",
    259: "DOA",
    260: "AMTRELAY",
    32768: "TA",
    32769: "DLV"
});

export const CLASS_NAMES = Object.freeze({
    1: "IN",       // Internet
    2: "CS",       // CSNET (obsolete)
    3: "CH",       // CHAOS
    4: "HS",       // Hesiod
    254: "NONE",   // QCLASS NONE
    255: "ANY"     // QCLASS ANY
});

export const TYPE = Object.freeze({
    A: 1,
    NS: 2,
    MD: 3,
    MF: 4,
    CNAME: 5,
    SOA: 6,
    MB: 7,
    MG: 8,
    MR: 9,
    NULL: 10,
    WKS: 11,
    PTR: 12,
    HINFO: 13,
    MINFO: 14,
    MX: 15,
    TXT: 16,
    RP: 17,
    AFSDB: 18,
    X25: 19,
    ISDN: 20,
    RT: 21,
    NSAP: 22,
    NSAP_PTR: 23,
    SIG: 24,
    KEY: 25,
    PX: 26,
    GPOS: 27,
    AAAA: 28,
    LOC: 29,
    NXT: 30,
    EID: 31,
    NIMLOC: 32,
    SRV: 33,
    ATMA: 34,
    NAPTR: 35,
    KX: 36,
    CERT: 37,
    A6: 38,
    DNAME: 39,
    SINK: 40,
    OPT: 41,
    APL: 42,
    DS: 43,
    SSHFP: 44,
    IPSECKEY: 45,
    RRSIG: 46,
    NSEC: 47,
    DNSKEY: 48,
    DHCID: 49,
    NSEC3: 50,
    NSEC3PARAM: 51,
    TLSA: 52,
    SMIMEA: 53,
    HIP: 55,
    NINFO: 56,
    RKEY: 57,
    TALINK: 58,
    CDS: 59,
    CDNSKEY: 60,
    OPENPGPKEY: 61,
    CSYNC: 62,
    ZONEMD: 63,
    SVCB: 64,
    HTTPS: 65,
    SPF: 99,
    UINFO: 100,
    UID: 101,
    GID: 102,
    UNSPEC: 103,
    NID: 104,
    L32: 105,
    L64: 106,
    LP: 107,
    EUI48: 108,
    EUI64: 109,
    TKEY: 249,
    TSIG: 250,
    IXFR: 251,
    AXFR: 252,
    MAILB: 253,
    MAILA: 254,
    ANY: 255,
    URI: 256,
    CAA: 257,
    AVC: 258,
    DOA: 259,
    AMTRELAY: 260,
    TA: 32768,
    DLV: 32769
});

export const CLAZZ = Object.freeze({
    IN: 1,
    CS: 2,
    CH: 3,
    HS: 4,
    NONE: 254,
    ANY: 255
})

export const OPCODE = Object.freeze({
    QUERY: 0,
    IQUERY: 1,
    STATUS: 2,
    RESERVED: 3,
    NOTIFY: 4,
    UPDATE: 5,
    DSO: 6
})

/**
 * Maps record type names back to their numeric code, derived from TYPE_NAMES so
 * the two directions can never drift apart.
 * @type {Readonly<Object<string, number>>}
 */
export const TYPE_BY_NAME = Object.freeze(
    Object.fromEntries(Object.entries(TYPE_NAMES).map(([code, name]) => [name, Number(code)]))
);

/**
 * Maps response code names back to their numeric value.
 * @type {Readonly<Object<string, number>>}
 */
export const RCODE_BY_NAME = Object.freeze(
    Object.fromEntries(Object.entries(RCODE_NAMES).map(([code, name]) => [name, Number(code)]))
);

// Helpers
/** Maximum length of a single DNS label in bytes (RFC 1035 §2.3.4) */
const MAX_LABEL_LENGTH = 63;
/** Maximum length of a full DNS name in wire format including length bytes (RFC 1035 §2.3.4) */
const MAX_NAME_LENGTH = 255;
/** Size of the fixed DNS message header in bytes */
const DNS_HEADER_SIZE = 12;
/** Maximum number of compression pointers followed while decoding a single name */
const MAX_POINTER_HOPS = 64;

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

/**
 * Copies a byte range out of a DataView, honouring the view's own byteOffset.
 *
 * Slicing `view.buffer` directly always reads from the start of the underlying
 * ArrayBuffer and therefore returns the wrong bytes whenever the DataView only
 * covers part of that buffer (e.g. a message embedded in a TCP frame).
 * @param {DataView} view - DataView to read from
 * @param {number} offset - Offset relative to the start of the view
 * @param {number} length - Number of bytes to copy
 * @returns {Uint8Array} Copy of the requested bytes
 * @throws {RangeError} If the range lies outside the view
 */
function readBytes(view, offset, length) {
    if (!Number.isInteger(offset) || !Number.isInteger(length) || length < 0) {
        throw new RangeError(`Invalid byte range (offset=${offset}, length=${length}).`);
    }
    if (offset < 0 || offset + length > view.byteLength) {
        throw new RangeError(`Byte range ${offset}..${offset + length} exceeds the available ${view.byteLength} bytes.`);
    }
    return new Uint8Array(view.buffer, view.byteOffset + offset, length).slice();
}

/**
 * Copies the bytes between two offsets out of a DataView.
 * @param {DataView} view - DataView to read from
 * @param {number} start - First offset to copy, relative to the start of the view
 * @param {number} end - Offset one past the last byte to copy
 * @returns {Uint8Array} Copy of the requested bytes
 */
function readRange(view, start, end) {
    return readBytes(view, start, end - start);
}

/**
 * Decodes a byte range of a DataView as UTF-8 text.
 * @param {DataView} view - DataView to read from
 * @param {number} offset - Offset relative to the start of the view
 * @param {number} length - Number of bytes to decode
 * @returns {string} Decoded text
 */
function readText(view, offset, length) {
    return textDecoder.decode(readBytes(view, offset, length));
}

/**
 * Encodes bytes as base64 without spreading the array into function arguments,
 * which would overflow the call stack for large record data.
 * @param {Uint8Array} bytes - Bytes to encode
 * @returns {string} Base64 representation
 */
function toBase64(bytes) {
    let binary = "";
    const CHUNK_SIZE = 0x2000;
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK_SIZE));
    }
    return btoa(binary);
}

/**
 * Decodes a base64 string into bytes.
 * @param {string} value - Base64 string
 * @returns {Uint8Array} Decoded bytes
 */
function fromBase64(value) {
    return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}

/**
 * Encodes bytes as a lower-case hex string.
 * @param {Uint8Array} bytes - Bytes to encode
 * @returns {string} Hex representation
 */
function toHex(bytes) {
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, "0");
    }
    return hex;
}

/**
 * Decodes a hex string into bytes.
 * @param {string} value - Hex string (may be empty)
 * @returns {Uint8Array} Decoded bytes
 * @throws {Error} If the string is not valid hex
 */
function fromHex(value) {
    if (!value) {
        return new Uint8Array(0);
    }
    if (value.length % 2 !== 0 || /[^0-9a-fA-F]/.test(value)) {
        throw new Error(`Invalid hex string: "${value}".`);
    }
    const bytes = new Uint8Array(value.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(value.substr(i * 2, 2), 16);
    }
    return bytes;
}

/**
 * Concatenates byte arrays into a single Uint8Array.
 * @param {...Uint8Array} parts - Arrays to concatenate
 * @returns {Uint8Array} Concatenated bytes
 */
function concatBytes(...parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const buffer = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
        buffer.set(part, offset);
        offset += part.length;
    }
    return buffer;
}

/**
 * Verifies that a record's rdata has exactly the length the type requires.
 * @param {string} type - Record type name, for the error message
 * @param {number} dataLength - Actual rdata length
 * @param {number} expected - Required rdata length
 * @throws {Error} If the lengths differ
 */
function expectDataLength(type, dataLength, expected) {
    if (dataLength !== expected) {
        throw new Error(`Invalid ${type} record length: ${dataLength} bytes, expected ${expected}.`);
    }
}

/**
 * Converts a single label to its IDNA A-label form (RFC 5891), e.g. "münchen"
 * to "xn--mnchen-3ya". DNS servers hold internationalized names in that form, so
 * a name has to be converted before it goes on the wire.
 *
 * The conversion borrows the UTS #46 ToASCII implementation that the WHATWG URL
 * parser is required to have, which avoids shipping a Punycode table. It is
 * applied per label and only to labels that actually contain non-ASCII, because
 * the URL host parser would also lower-case the name — that would destroy
 * DNSSEC canonical forms and 0x20-encoded names.
 * @param {string} label - Label to convert
 * @returns {string} The label unchanged if it is ASCII, otherwise its A-label
 * @throws {Error} If the label cannot be converted
 */
function labelToASCII(label) {
    if (!/[^\x00-\x7F]/.test(label)) {
        return label;
    }
    let ascii;
    try {
        ascii = new URL(`http://${label}`).hostname;
    } catch {
        ascii = "";
    }
    if (ascii === "" || /[^\x00-\x7F]/.test(ascii) || ascii.includes(".")) {
        throw new Error(`Label "${label}" cannot be converted to an IDNA A-label.`);
    }
    return ascii;
}

/**
 * Resolves an opcode given either as a numeric code or as an opcode name, so a
 * message that has been through `interpret()` can still be serialized.
 * @param {number|string} opcode - Opcode or name (e.g. 0 or "QUERY")
 * @returns {number} Numeric opcode
 * @throws {Error} If the opcode cannot be resolved
 */
function resolveOpcodeCode(opcode) {
    if (typeof opcode === "number") {
        return opcode;
    }
    const code = OPCODE[String(opcode).toUpperCase()];
    if (code === undefined) {
        throw new Error(`Unknown DNS opcode: ${opcode}`);
    }
    return code;
}

/**
 * Parses a dotted-quad IPv4 address into 4 bytes.
 * @param {string} value - IPv4 address (e.g. "192.0.2.1")
 * @returns {Uint8Array} 4 address bytes
 * @throws {Error} If the address is malformed
 */
function parseIPv4(value) {
    const parts = String(value).split(".");
    if (parts.length !== 4) {
        throw new Error(`Invalid IPv4 address: "${value}".`);
    }
    const bytes = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
        if (!/^\d{1,3}$/.test(parts[i])) {
            throw new Error(`Invalid IPv4 address: "${value}".`);
        }
        const octet = Number(parts[i]);
        if (octet > 255) {
            throw new Error(`Invalid IPv4 address: "${value}".`);
        }
        bytes[i] = octet;
    }
    return bytes;
}

/**
 * Formats 4 bytes as a dotted-quad IPv4 address.
 * @param {Uint8Array} bytes - 4 address bytes
 * @returns {string} IPv4 address
 */
function formatIPv4(bytes) {
    return Array.from(bytes).join(".");
}

/**
 * Formats 16 bytes as a compressed IPv6 address following RFC 5952: the longest
 * run of at least two zero groups is replaced by "::".
 * @param {Uint8Array} bytes - 16 address bytes
 * @returns {string} IPv6 address
 */
function formatIPv6(bytes) {
    const groups = [];
    for (let i = 0; i < 16; i += 2) {
        groups.push((bytes[i] << 8) | bytes[i + 1]);
    }

    let bestStart = -1;
    let bestLength = 0;
    let runStart = -1;
    for (let i = 0; i <= groups.length; i++) {
        if (i < groups.length && groups[i] === 0) {
            if (runStart === -1) {
                runStart = i;
            }
            continue;
        }
        if (runStart !== -1) {
            const runLength = i - runStart;
            if (runLength > bestLength) {
                bestStart = runStart;
                bestLength = runLength;
            }
            runStart = -1;
        }
    }

    const hex = groups.map(group => group.toString(16));
    if (bestLength < 2) {
        return hex.join(":");
    }
    const head = hex.slice(0, bestStart).join(":");
    const tail = hex.slice(bestStart + bestLength).join(":");
    return `${head}::${tail}`;
}

/**
 * Parses an IPv6 address into 16 bytes. Supports "::" compression and a
 * trailing IPv4 part (e.g. "::ffff:192.0.2.1").
 * @param {string} value - IPv6 address
 * @returns {Uint8Array} 16 address bytes
 * @throws {Error} If the address is malformed
 */
function parseIPv6(value) {
    let text = String(value);
    const bytes = new Uint8Array(16);

    // A trailing IPv4 part occupies the last two groups.
    let trailing = null;
    const lastColon = text.lastIndexOf(":");
    if (lastColon !== -1 && text.slice(lastColon + 1).includes(".")) {
        trailing = parseIPv4(text.slice(lastColon + 1));
        text = text.slice(0, lastColon + 1) + "0:0";
    }

    const halves = text.split("::");
    if (halves.length > 2) {
        throw new Error(`Invalid IPv6 address: "${value}".`);
    }

    const parseGroups = (part) => {
        if (part === "") {
            return [];
        }
        return part.split(":").map(group => {
            if (!/^[0-9a-fA-F]{1,4}$/.test(group)) {
                throw new Error(`Invalid IPv6 address: "${value}".`);
            }
            return parseInt(group, 16);
        });
    };

    const head = parseGroups(halves[0]);
    const tail = halves.length === 2 ? parseGroups(halves[1]) : [];
    // Check the count before building the array, so an over-long address reports
    // a bad address rather than an array-length RangeError.
    if (head.length + tail.length > 8) {
        throw new Error(`Invalid IPv6 address: "${value}".`);
    }
    const groups = halves.length === 2
        ? [...head, ...Array(8 - head.length - tail.length).fill(0), ...tail]
        : head;

    if (groups.length !== 8) {
        throw new Error(`Invalid IPv6 address: "${value}".`);
    }

    for (let i = 0; i < 8; i++) {
        bytes[i * 2] = (groups[i] >> 8) & 0xff;
        bytes[i * 2 + 1] = groups[i] & 0xff;
    }
    if (trailing) {
        bytes.set(trailing, 12);
    }
    return bytes;
}

/**
 * Decodes RFC 4034 §4.1.2 type bit maps into a list of record type names.
 * Types without a known name are reported as "TYPE<n>" so nothing is lost.
 * @param {DataView} view - DataView to read from
 * @param {number} offset - Offset of the first window block
 * @param {number} end - Offset one past the last bitmap byte
 * @returns {Array<string>} Covered record type names
 */
function decodeTypeBitmaps(view, offset, end) {
    const types = [];
    while (offset < end) {
        if (offset + 2 > end) {
            throw new Error("Truncated type bitmap window header.");
        }
        const windowNumber = view.getUint8(offset++);
        const windowLength = view.getUint8(offset++);
        if (windowLength < 1 || windowLength > 32 || offset + windowLength > end) {
            throw new Error("Invalid type bitmap window length.");
        }
        for (let i = 0; i < windowLength; i++) {
            const byte = view.getUint8(offset++);
            for (let bit = 0; bit < 8; bit++) {
                if (byte & (1 << (7 - bit))) {
                    const rrType = (windowNumber * 256) + (i * 8) + bit;
                    types.push(TYPE_NAMES[rrType] || `TYPE${rrType}`);
                }
            }
        }
    }
    return types;
}

/**
 * Encodes record types as RFC 4034 §4.1.2 type bit maps.
 * @param {Array<string|number>} types - Record type names or codes
 * @returns {Uint8Array} Encoded window blocks
 */
function encodeTypeBitmaps(types) {
    /** @type {Map<number, Uint8Array>} */
    const windows = new Map();
    for (const type of types) {
        const code = typeof type === "number"
            ? type
            : (TYPE_BY_NAME[type] ?? (/^TYPE\d+$/.test(type) ? Number(type.slice(4)) : undefined));
        if (code === undefined) {
            throw new Error(`Unknown record type "${type}" in type bitmap.`);
        }
        const windowNumber = code >> 8;
        if (!windows.has(windowNumber)) {
            windows.set(windowNumber, new Uint8Array(32));
        }
        const bitmap = windows.get(windowNumber);
        bitmap[(code & 0xff) >> 3] |= 1 << (7 - (code & 0x07));
    }

    const blocks = [];
    for (const windowNumber of [...windows.keys()].sort((a, b) => a - b)) {
        const bitmap = windows.get(windowNumber);
        let windowLength = 32;
        while (windowLength > 1 && bitmap[windowLength - 1] === 0) {
            windowLength--;
        }
        blocks.push(concatBytes(
            new Uint8Array([windowNumber, windowLength]),
            bitmap.subarray(0, windowLength)
        ));
    }
    return concatBytes(...blocks);
}

/**
 * Splits a string into DNS character-strings, each at most 255 bytes long
 * (RFC 1035 §3.3.14 — this is how TXT records carry payloads beyond 255 bytes).
 *
 * Chunk boundaries are pulled back to the start of a UTF-8 sequence so that no
 * multi-byte character is torn apart, which would make each chunk undecodable
 * on its own.
 * @param {string} text - Text to encode
 * @returns {Uint8Array} Length-prefixed character-strings
 */
function encodeCharacterStrings(text) {
    const bytes = textEncoder.encode(text ?? "");
    if (bytes.length === 0) {
        return new Uint8Array([0]);
    }
    const chunks = [];
    let start = 0;
    while (start < bytes.length) {
        let length = Math.min(255, bytes.length - start);
        // 0b10xxxxxx marks a UTF-8 continuation byte; never cut in front of one.
        while (length > 1 && (bytes[start + length] & 0xc0) === 0x80) {
            length--;
        }
        chunks.push(concatBytes(new Uint8Array([length]), bytes.subarray(start, start + length)));
        start += length;
    }
    return concatBytes(...chunks);
}

/**
 * Reads consecutive DNS character-strings and joins them into one string.
 *
 * The payload bytes of all strings are concatenated before being decoded once,
 * so text that a peer split in the middle of a UTF-8 sequence still decodes.
 * @param {DataView} view - DataView to read from
 * @param {number} offset - Offset of the first character-string
 * @param {number} end - Offset one past the last character-string
 * @returns {string} Concatenated text
 */
function decodeCharacterStrings(view, offset, end) {
    const parts = [];
    while (offset < end) {
        const length = view.getUint8(offset++);
        if (offset + length > end) {
            throw new Error("Truncated character-string.");
        }
        parts.push(readBytes(view, offset, length));
        offset += length;
    }
    return textDecoder.decode(concatBytes(...parts));
}

// Models
function generateTransactionId() {
    // Use a CSPRNG for the DNS transaction ID to mitigate spoofing.
    // Falls back to Math.random only if no Web Crypto is available.
    const g = (typeof globalThis !== "undefined" ? globalThis : undefined);
    if (g && g.crypto && typeof g.crypto.getRandomValues === "function") {
        const buf = new Uint16Array(1);
        g.crypto.getRandomValues(buf);
        return buf[0];
    }
    return Math.floor(Math.random() * 0x10000);
}

class Message {
    id = generateTransactionId();
    flags = {
        qr: 0,
        opcode: 0,
        aa: false,
        tc: false,
        rd: false,
        ra: false,
        rcode: 0
    };
}

/**
 * DNS Query Message
 * @class
 * @extends Message
 */
export class QueryMessage extends Message {
    /** @returns {number} Number of questions */
    get qdcount() { return this.questions.length };
    /** @returns {number} Number of answers */
    get ancount() { return this.answers.length };
    /** @returns {number} Number of authority records */
    get nscount() { return this.authorities.length };
    /** @returns {number} Number of additional records */
    get arcount() { return this.additionals.length };
    /** @type {Array<DNSQuestion|DNSRecord>} */
    questions = [];
    /** @type {Array<DNSRecord>} */
    answers = [];
    /** @type {Array<DNSRecord>} */
    authorities = [];
    /** @type {Array<DNSRecord>} */
    additionals = [];
    /**
     * Creates a new DNS query message
     * @constructor
     */
    constructor() {
        super();
        this.flags.rd = true;
        this.flags.opcode = OPCODE.QUERY;
    }
}

/**
 * DNS Update Message (RFC 2136)
 * @class
 * @extends Message
 */
export class UpdateMessage extends Message {
    /** @returns {number} Number of zones */
    get zcount() { return this.zones.length };
    /** @returns {number} Number of prerequisites */
    get prcount() { return this.prerequisites.length };
    /** @returns {number} Number of updates */
    get upcount() { return this.updates.length };
    /** @returns {number} Number of additional records */
    get adcount() { return this.additionals.length };
    /** @type {Array<DNSRecord>} */
    zones = [];
    /** @type {Array<DNSRecord>} */
    prerequisites = [];
    /** @type {Array<DNSRecord>} */
    updates = [];
    /** @type {Array<DNSRecord>} */
    additionals = [];
    /**
     * Creates a new DNS update message
     * @constructor
     */
    constructor() {
        super();
        this.flags.opcode = OPCODE.UPDATE;
    }
}

/**
 * DNS Resource Record
 * @class
 */
export class Record {
    /**
     * Creates a new DNS resource record
     * @constructor
     * @param {string} name - Domain name
     * @param {number} type - Record type (from TYPE enum)
     * @param {number} clazz - Record class (from CLAZZ enum)
     * @param {number} [ttl=0] - Time to live in seconds
     * @param {Uint8Array|Object|Array<RDataItem>} [data=new Uint8Array(0)] - Record data
     */
    constructor(name, type, clazz, ttl = 0, data = new Uint8Array(0)) {
        /** @type {string} */
        this.name = name;
        /** @type {number} */
        this.type = type;
        /** @type {number} */
        this.clazz = clazz;
        /** @type {number} */
        this.ttl = ttl;
        /** @type {Uint8Array|Object|Array<RDataItem>} */
        this.data = data;
    }
}

/**
 * DNS Question
 * @class
 */
export class Question {
    /**
     * Creates a new DNS question
     * @constructor
     * @param {string} name - Domain name to query
     * @param {number} [type=TYPE.ANY] - Record type to query (from TYPE enum)
     * @param {number} [clazz=CLAZZ.ANY] - Record class to query (from CLAZZ enum)
     */
    constructor(name, type = TYPE.ANY, clazz = CLAZZ.ANY) {
        /** @type {string} */
        this.name = name;
        /** @type {number} */
        this.type = type;
        /** @type {number} */
        this.clazz = clazz;
    }
}

/**
 * DNS Zone (for UPDATE messages)
 * @class
 */
export class Zone {
    /**
     * Creates a new DNS zone
     * @constructor
     * @param {string} name - Zone name
     * @param {number} [type=TYPE.SOA] - Zone type (from TYPE enum)
     * @param {number} [clazz=CLAZZ.IN] - Zone class (from CLAZZ enum)
     */
    constructor(name, type = TYPE.SOA, clazz = CLAZZ.IN) {
        /** @type {string} */
        this.name = name;
        /** @type {number} */
        this.type = type;
        /** @type {number} */
        this.clazz = clazz;
    }
}

// Classes
/**
 * DNS Message Serializer/Deserializer
 * @class
 */
export class DnsSerializer {
    /**
     * Returns the sections of a message in wire order together with a flag
     * telling whether they hold questions (name/type/class only) or full records.
     * @static
     * @private
     * @param {QueryMessage|UpdateMessage} message - DNS message
     * @returns {Array<{records: Array<DNSRecord|DNSQuestion|Zone>, question: boolean}>} Message sections
     * @throws {Error} If the message opcode is not supported
     */
    static sections(message) {
        // Accept a named opcode so a message that has been through interpret()
        // can still be serialized.
        switch (resolveOpcodeCode(message.flags.opcode)) {
            case OPCODE.QUERY:
                return [
                    {records: message.questions, question: true},
                    {records: message.answers, question: false},
                    {records: message.authorities, question: false},
                    {records: message.additionals, question: false}
                ];
            case OPCODE.UPDATE:
                return [
                    {records: message.zones, question: true},
                    {records: message.prerequisites, question: false},
                    {records: message.updates, question: false},
                    {records: message.additionals, question: false}
                ];
            default:
                throw new Error(`Unsupported DNS opcode ${message.flags.opcode} (${OPCODE_NAMES[message.flags.opcode] || "unknown"}).`);
        }
    }

    /**
     * Computes the exact buffer size a DNS message needs in wire format.
     *
     * The size is derived from the actual serialized record bytes rather than
     * estimated, so records with large rdata (DNSKEY, RRSIG, TSIG, ...) can never
     * overflow the allocated buffer.
     * @static
     * @param {QueryMessage|UpdateMessage} message - DNS message to measure
     * @returns {number} Required buffer size in bytes
     */
    static estimateMessageSize(message) {
        return this.sections(message).reduce(
            (size, section) => size + section.records.reduce(
                (sectionSize, record) => sectionSize + DnsRecordSerializer.toBytes(record, section.question).byteLength,
                0
            ),
            DNS_HEADER_SIZE
        );
    }

    /**
     * Deserializes a DNS message from binary buffer
     * @static
     * @param {ArrayBuffer} buffer - Binary DNS message
     * @returns {QueryMessage|UpdateMessage} Deserialized DNS message
     * @throws {Error} If buffer is invalid or too small
     */
    static deserialize(buffer) {
        let view;
        if (buffer instanceof DataView) {
            view = buffer;
        } else if (ArrayBuffer.isView(buffer)) {
            view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        } else if (buffer instanceof ArrayBuffer) {
            view = new DataView(buffer);
        } else {
            throw new Error("Expected an ArrayBuffer, a typed array or a DataView.");
        }
        if (view.byteLength < DNS_HEADER_SIZE) {
            throw new Error(`DNS message is too short: ${view.byteLength} bytes, expected at least ${DNS_HEADER_SIZE}.`);
        }
        const id = view.getUint16(0);
        const flags = this.HeaderFlags.deserialize(view.getUint16(2));
        let message;
        let offset = 4;
        switch (flags.opcode) {
            case OPCODE.QUERY:
                message = new QueryMessage();
                message.id = id;
                message.flags = flags;
                const qdcount = view.getUint16(4);
                const ancount = view.getUint16(6);
                const nscount = view.getUint16(8);
                const arcount = view.getUint16(10);
                offset += 8;
                for (let i = 0; i < qdcount; i++) {
                    const record = DnsRecordSerializer.deserialize(view, offset, true, false);
                    offset = record.offset;
                    message.questions.push(record.record);
                }
                for (let i = 0; i < ancount; i++) {
                    const record = DnsRecordSerializer.deserialize(view, offset);
                    offset = record.offset;
                    message.answers.push(record.record);
                }
                for (let i = 0; i < nscount; i++) {
                    const record = DnsRecordSerializer.deserialize(view, offset);
                    offset = record.offset;
                    message.authorities.push(record.record);
                }
                for (let i = 0; i < arcount; i++) {
                    const record = DnsRecordSerializer.deserialize(view, offset);
                    offset = record.offset;
                    message.additionals.push(record.record);
                }
                return message;
            case OPCODE.UPDATE:
                message = new UpdateMessage();
                message.id = id;
                message.flags = flags;
                const zcount = view.getUint16(4);
                const prcount = view.getUint16(6);
                const upcount = view.getUint16(8);
                const adcount = view.getUint16(10);
                offset += 8;
                for (let i = 0; i < zcount; i++) {
                    const record = DnsRecordSerializer.deserialize(view, offset, false, true);
                    offset = record.offset;
                    message.zones.push(record.record);
                }
                for (let i = 0; i < prcount; i++) {
                    const record = DnsRecordSerializer.deserialize(view, offset);
                    offset = record.offset;
                    message.prerequisites.push(record.record);
                }
                for (let i = 0; i < upcount; i++) {
                    const record = DnsRecordSerializer.deserialize(view, offset);
                    offset = record.offset;
                    message.updates.push(record.record);
                }
                for (let i = 0; i < adcount; i++) {
                    const record = DnsRecordSerializer.deserialize(view, offset);
                    offset = record.offset;
                    message.additionals.push(record.record);
                }
                return message;
            default:
                throw new Error(`Unsupported DNS opcode ${flags.opcode} (${OPCODE_NAMES[flags.opcode] || "unknown"}).`);
        }
    }

    /**
     * Serializes a DNS message to binary buffer
     * @static
     * @param {QueryMessage|UpdateMessage} message - DNS message to serialize
     * @returns {Uint8Array} Binary DNS message
     * @throws {Error} If message is invalid
     */
    static serialize(message) {
        // Serialize every record up front so the buffer can be sized exactly.
        const sections = this.sections(message).map(section => ({
            count: section.records.length,
            bytes: section.records.map(record => DnsRecordSerializer.toBytes(record, section.question))
        }));
        const size = sections.reduce(
            (total, section) => total + section.bytes.reduce((sum, bytes) => sum + bytes.byteLength, 0),
            DNS_HEADER_SIZE
        );

        const buffer = new ArrayBuffer(size);
        const view = new DataView(buffer);
        const output = new Uint8Array(buffer);
        let offset = 0;

        view.setUint16(offset, message.id, false);
        offset += 2;
        offset = this.HeaderFlags.serialize(view, offset, {
            ...message.flags,
            opcode: resolveOpcodeCode(message.flags.opcode),
            qr: typeof message.flags.qr === "number" ? message.flags.qr : (message.flags.qr === "RESPONSE" ? 1 : 0),
            rcode: typeof message.flags.rcode === "number" ? message.flags.rcode : (RCODE_BY_NAME[message.flags.rcode] ?? 0)
        });
        for (const section of sections) {
            view.setUint16(offset, section.count, false);
            offset += 2;
        }
        for (const section of sections) {
            for (const bytes of section.bytes) {
                output.set(bytes, offset);
                offset += bytes.byteLength;
            }
        }
        return output;
    }

    /**
     * DNS Header Flags serializer/deserializer
     * @static
     */
    static HeaderFlags = {
        /**
         * Deserializes DNS header flags from 16-bit integer
         * @param {number} buffer - 16-bit flags value
         * @returns {DNSHeaderFlags} Deserialized header flags
         */
        deserialize(buffer) {
            const qr = (buffer >> 15) & 1;
            const opcode = (buffer >> 11) & 0xF;
            const aa = !!((buffer >> 10) & 1);
            const tc = !!((buffer >> 9) & 1);
            const rd = !!((buffer >> 8) & 1);
            const ra = !!((buffer >> 7) & 1);
            const rcode = buffer & 0xF; 
            return {qr, opcode, aa, tc, rd, ra, rcode};
        },
        /**
         * Serializes DNS header flags to 16-bit integer
         * @param {DataView} view - DataView to write to
         * @param {number} offset - Offset in the view
         * @param {DNSHeaderFlags} flags - Header flags to serialize
         * @returns {number} New offset after serialization
         */
        serialize(view, offset, flags) {
            const buffer =
                ((flags.qr & 1) << 15) |
                ((flags.opcode & 0xF) << 11) |
                ((flags.aa & 1) << 10) |
                ((flags.tc & 1) << 9) |
                ((flags.rd & 1) << 8) |
                ((flags.ra & 1) << 7) |
                ((flags.rcode & 0xF));
            view.setUint16(offset, buffer, false);
            return offset + 2;
        }
    }
}

/**
 * DNS Name (Domain Name) Serializer/Deserializer
 * Handles DNS name compression (RFC 1035)
 * @class
 */
export class DnsNameSerializer {
    /**
     * Deserializes a DNS domain name from binary format
     * @static
     * @param {DataView} view - DataView containing the DNS message
     * @param {number} offset - Starting offset of the name
     * @returns {DeserializedName} Deserialized domain name with offset and length
     */
    static deserialize(view, offset) {
        const labels = [];
        const initialOffset = offset;
        const visited = new Set();
        let jumped = false;
        let jumpOffset = 0;
        let hops = 0;
        // Counts the terminating root byte from the start, so the limit matches
        // what serialize() accepts for the same name.
        let nameLength = 1;

        for (;;) {
            if (offset < 0 || offset >= view.byteLength) {
                throw new Error(`DNS name at offset ${initialOffset} runs past the end of the message.`);
            }
            const length = view.getUint8(offset);

            if (length === 0) {
                if (!jumped) {
                    jumpOffset = offset + 1;
                }
                break;
            }

            if ((length & 0xc0) === 0xc0) {
                if (offset + 1 >= view.byteLength) {
                    throw new Error(`Truncated compression pointer at offset ${offset}.`);
                }
                if (!jumped) {
                    jumpOffset = offset + 2;
                }
                const target = ((length & 0x3f) << 8) | view.getUint8(offset + 1);
                if (visited.has(target) || ++hops > MAX_POINTER_HOPS) {
                    throw new Error(`Cyclic DNS name compression pointer at offset ${offset}.`);
                }
                visited.add(target);
                offset = target;
                jumped = true;
                continue;
            }

            if ((length & 0xc0) !== 0) {
                throw new Error(`Reserved DNS label type 0x${(length & 0xc0).toString(16)} at offset ${offset}.`);
            }
            if (length > MAX_LABEL_LENGTH) {
                throw new Error(`DNS label at offset ${offset} exceeds ${MAX_LABEL_LENGTH} bytes.`);
            }

            nameLength += length + 1;
            if (nameLength > MAX_NAME_LENGTH) {
                throw new Error(`DNS name at offset ${initialOffset} exceeds ${MAX_NAME_LENGTH} bytes.`);
            }

            offset++;
            labels.push(readText(view, offset, length));
            offset += length;
        }

        const name = labels.length === 0 ? "." : labels.join(".");
        return { name, offset: jumpOffset, length: jumpOffset - initialOffset };
    }

    /**
     * Serializes a domain name to DNS binary format.
     *
     * Labels containing non-ASCII characters are converted to their IDNA A-label
     * form; pure ASCII labels are emitted byte-for-byte, preserving their case.
     * @static
     * @param {string} name - Domain name to serialize (e.g., "example.com")
     * @returns {Uint8Array} Binary representation of the domain name
     * @throws {Error} If a label is empty or the name exceeds the size limits
     */
    static serialize(name) {
        if (name === "." || name === "") {
            return new Uint8Array([0]);
        }
        if (typeof name !== "string") {
            throw new Error(`DNS name must be a string, got ${name === null ? "null" : typeof name}.`);
        }

        const labels = name.split(".");
        if (labels[labels.length - 1] === "") {
            labels.pop();
        }

        const encoded = labels.map(label => {
            // Convert first: the A-label is what the length limit applies to.
            const bytes = textEncoder.encode(labelToASCII(label));
            if (bytes.length === 0) {
                throw new Error(`Empty label in DNS name "${name}".`);
            }
            if (bytes.length > MAX_LABEL_LENGTH) {
                throw new Error(`Label "${label}" exceeds ${MAX_LABEL_LENGTH} bytes.`);
            }
            return bytes;
        });

        const length = encoded.reduce((sum, bytes) => sum + bytes.length + 1, 0) + 1;
        if (length > MAX_NAME_LENGTH) {
            throw new Error(`DNS name "${name}" exceeds ${MAX_NAME_LENGTH} bytes in wire format.`);
        }

        const buffer = new Uint8Array(length);
        let offset = 0;
        for (const bytes of encoded) {
            buffer[offset++] = bytes.length;
            buffer.set(bytes, offset);
            offset += bytes.length;
        }
        buffer[offset] = 0;
        return buffer;
    }
}

/**
 * DNS Resource Record Serializer/Deserializer
 * Handles all DNS record types (A, AAAA, MX, TXT, etc.)
 * @class
 */
export class DnsRecordSerializer {
    /**
     * Deserializes a DNS resource record from binary format
     * @static
     * @param {DataView} view - DataView containing the DNS message
     * @param {number} offset - Starting offset of the record
     * @param {boolean} [question=false] - Whether this is a question section record
     * @param {boolean} [zone=false] - Whether this is a zone section record
     * @returns {DeserializedRecord} Deserialized record with new offset
     */
    static deserialize(view, offset, question = false, zone = false) {
        const name = DnsNameSerializer.deserialize(view, offset);
        offset = name.offset;
        const type = view.getUint16(offset);
        offset += 2;
        const clazz = view.getUint16(offset);
        offset += 2;
        if (question) {
            const record = new Question(name.name, type, clazz);
            return {record, offset};
        }
        if (zone) {
            const record = new Zone(name.name, type, clazz);
            return {record, offset};
        }
        const ttl = view.getUint32(offset);
        offset += 4;
        const dataLength = view.getUint16(offset);
        offset += 2;
        const record = new Record();
        record.name = name.name;
        record.type = type;
        record.clazz = clazz;
        record.ttl = ttl;
        // A bare EDNS(0) record legitimately has no options, but it still needs
        // the structured empty option list rather than raw empty bytes.
        if (dataLength === 0 && record.type !== TYPE.OPT) {
            return {record, offset};
        }
        switch (record.type) {
            case TYPE.A:
                record.data = this.A.deserialize(view, offset, dataLength); break;
            case TYPE.NS:
                record.data = this.NS.deserialize(view, offset); break;
            case TYPE.MD:
                record.data = this.MD.deserialize(view, offset); break;
            case TYPE.MF:
                record.data = this.MF.deserialize(view, offset); break;
            case TYPE.CNAME:
                record.data = this.CNAME.deserialize(view, offset); break;
            case TYPE.SOA:
                record.data = this.SOA.deserialize(view, offset); break;
            case TYPE.MB:
                record.data = this.MB.deserialize(view, offset); break;
            case TYPE.MG:
                record.data = this.MG.deserialize(view, offset); break;
            case TYPE.MR:
                record.data = this.MR.deserialize(view, offset); break;
            case TYPE.NULL:
                record.data = this.NULL.deserialize(view, offset, dataLength); break;
            case TYPE.WKS:
                record.data = this.WKS.deserialize(view, offset, dataLength); break;
            case TYPE.PTR:
                record.data = this.PTR.deserialize(view, offset); break;
            case TYPE.HINFO:
                record.data = this.HINFO.deserialize(view, offset); break;
            case TYPE.MINFO:
                record.data = this.MINFO.deserialize(view, offset); break;
            case TYPE.MX:
                record.data = this.MX.deserialize(view, offset); break;
            case TYPE.TXT:
                record.data = this.TXT.deserialize(view, offset, dataLength); break;
            case TYPE.RP:
                record.data = this.RP.deserialize(view, offset); break;
            case TYPE.AFSDB:
                record.data = this.AFSDB.deserialize(view, offset); break;
            case TYPE.LOC:
                record.data = this.LOC.deserialize(view, offset, dataLength); break;
            case TYPE.AAAA:
                record.data = this.AAAA.deserialize(view, offset, dataLength); break;
            case TYPE.SRV:
                record.data = this.SRV.deserialize(view, offset); break;
            case TYPE.NAPTR:
                record.data = this.NAPTR.deserialize(view, offset); break;
            case TYPE.CERT:
                record.data = this.CERT.deserialize(view, offset, dataLength); break;
            case TYPE.DNAME:
                record.data = this.DNAME.deserialize(view, offset); break;
            case TYPE.DS:
                record.data = this.DS.deserialize(view, offset, dataLength); break;
            case TYPE.SSHFP:
                record.data = this.SSHFP.deserialize(view, offset, dataLength); break;
            case TYPE.RRSIG:
                record.data = this.RRSIG.deserialize(view, offset, dataLength); break;
            case TYPE.NSEC:
                record.data = this.NSEC.deserialize(view, offset, dataLength); break;
            case TYPE.DNSKEY:
                record.data = this.DNSKEY.deserialize(view, offset, dataLength); break;
            case TYPE.TLSA:
                record.data = this.TLSA.deserialize(view, offset, dataLength); break;
            case TYPE.CDS:
                record.data = this.DS.deserialize(view, offset, dataLength); break;
            case TYPE.CDNSKEY:
                record.data = this.DNSKEY.deserialize(view, offset, dataLength); break;
            case TYPE.SPF:
                record.data = this.SPF.deserialize(view, offset, dataLength); break;
            case TYPE.TSIG:
                record.data = this.TSIG.deserialize(view, offset); break;
            case TYPE.URI:
                record.data = this.URI.deserialize(view, offset, dataLength); break;
            case TYPE.CAA:
                record.data = this.CAA.deserialize(view, offset, dataLength); break;
            case TYPE.HTTPS:
                record.data = this.HTTPS.deserialize(view, offset, dataLength); break;
            case TYPE.SVCB:
                record.data = this.SVCB.deserialize(view, offset, dataLength); break;
            case TYPE.OPENPGPKEY:
                record.data = this.OPENPGPKEY.deserialize(view, offset, dataLength); break;
            case TYPE.SMIMEA:
                record.data = this.SMIMEA.deserialize(view, offset, dataLength); break;
            case TYPE.IPSECKEY:
                record.data = this.IPSECKEY.deserialize(view, offset, dataLength); break;
            case TYPE.DHCID:
                record.data = this.DHCID.deserialize(view, offset, dataLength); break;
            case TYPE.NSEC3:
                record.data = this.NSEC3.deserialize(view, offset, dataLength); break;
            case TYPE.NSEC3PARAM:
                record.data = this.NSEC3PARAM.deserialize(view, offset, dataLength); break;
            case TYPE.CSYNC:
                record.data = this.CSYNC.deserialize(view, offset, dataLength); break;
            case TYPE.ZONEMD:
                record.data = this.ZONEMD.deserialize(view, offset, dataLength); break;
            case TYPE.TKEY:
                record.data = this.TKEY.deserialize(view, offset, dataLength); break;
            case TYPE.OPT:
                record.data = this.OPT.deserialize(view, offset, dataLength); break;
            case TYPE.KX:
                record.data = this.KX.deserialize(view, offset); break;
            case TYPE.X25:
                record.data = this.X25.deserialize(view, offset, dataLength); break;
            case TYPE.DLV:
            case TYPE.TA:
                record.data = this.DS.deserialize(view, offset, dataLength); break;
            case TYPE.AVC:
                record.data = this.TXT.deserialize(view, offset, dataLength); break;
            case TYPE.NID:
                record.data = this.NID.deserialize(view, offset, dataLength); break;
            case TYPE.L32:
                record.data = this.L32.deserialize(view, offset, dataLength); break;
            case TYPE.L64:
                record.data = this.L64.deserialize(view, offset, dataLength); break;
            case TYPE.LP:
                record.data = this.LP.deserialize(view, offset); break;
            case TYPE.EUI48:
                record.data = this.EUI48.deserialize(view, offset, dataLength); break;
            case TYPE.EUI64:
                record.data = this.EUI64.deserialize(view, offset, dataLength); break;
            default:
                // Preserve the rdata of types without a dedicated codec verbatim so
                // the record still round-trips instead of being silently dropped.
                record.data = readBytes(view, offset, dataLength);
        }
        offset += dataLength;
        return {record, offset};
    }

    /**
     * Serializes a complete resource record (or question) to its wire bytes.
     * @static
     * @param {DNSRecord|DNSQuestion|Zone} record - Record to serialize
     * @param {boolean} [question] - Emit only name/type/class, as a question does
     * @returns {Uint8Array} Binary representation of the record
     */
    static toBytes(record, question = record instanceof Question || record instanceof Zone) {
        const nameBytes = DnsNameSerializer.serialize(record.name);
        const header = new Uint8Array(question ? 4 : 10);
        const headerView = new DataView(header.buffer);
        headerView.setUint16(0, resolveTypeCode(record.type), false);
        headerView.setUint16(2, resolveClassCode(record.clazz), false);
        if (question) {
            return concatBytes(nameBytes, header);
        }
        headerView.setUint32(4, record.ttl, false);

        const rdata = this.serializeRData(record);
        if (rdata.byteLength > 0xffff) {
            throw new Error(`Record "${record.name}" has ${rdata.byteLength} bytes of rdata, which exceeds the 65535 byte RDLENGTH limit.`);
        }
        headerView.setUint16(8, rdata.byteLength, false);
        return concatBytes(nameBytes, header, rdata);
    }

    /**
     * Serializes just the rdata of a resource record.
     * @static
     * @param {DNSRecord} record - Record whose data should be serialized
     * @returns {Uint8Array} Binary rdata
     */
    static serializeRData(record) {
        const data = record.data;
        if (data === undefined || data === null) {
            return new Uint8Array(0);
        }
        // Raw rdata (including types without a dedicated codec) is passed through.
        if (data instanceof Uint8Array) {
            return data;
        }
        if (ArrayBuffer.isView(data)) {
            return new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice();
        }

        switch (resolveTypeCode(record.type)) {
            case TYPE.A:          return this.A.serialize(data);
            case TYPE.NS:         return this.NS.serialize(data);
            case TYPE.MD:         return this.MD.serialize(data);
            case TYPE.MF:         return this.MF.serialize(data);
            case TYPE.CNAME:      return this.CNAME.serialize(data);
            case TYPE.SOA:        return this.SOA.serialize(data);
            case TYPE.MB:         return this.MB.serialize(data);
            case TYPE.MG:         return this.MG.serialize(data);
            case TYPE.MR:         return this.MR.serialize(data);
            case TYPE.NULL:       return this.NULL.serialize(data);
            case TYPE.WKS:        return this.WKS.serialize(data);
            case TYPE.PTR:        return this.PTR.serialize(data);
            case TYPE.HINFO:      return this.HINFO.serialize(data);
            case TYPE.MINFO:      return this.MINFO.serialize(data);
            case TYPE.MX:         return this.MX.serialize(data);
            case TYPE.TXT:        return this.TXT.serialize(data);
            case TYPE.RP:         return this.RP.serialize(data);
            case TYPE.AFSDB:      return this.AFSDB.serialize(data);
            case TYPE.LOC:        return this.LOC.serialize(data);
            case TYPE.AAAA:       return this.AAAA.serialize(data);
            case TYPE.SRV:        return this.SRV.serialize(data);
            case TYPE.NAPTR:      return this.NAPTR.serialize(data);
            case TYPE.CERT:       return this.CERT.serialize(data);
            case TYPE.DNAME:      return this.DNAME.serialize(data);
            case TYPE.DS:         return this.DS.serialize(data);
            case TYPE.SSHFP:      return this.SSHFP.serialize(data);
            case TYPE.IPSECKEY:   return this.IPSECKEY.serialize(data);
            case TYPE.RRSIG:      return this.RRSIG.serialize(data);
            case TYPE.NSEC:       return this.NSEC.serialize(data);
            case TYPE.DNSKEY:     return this.DNSKEY.serialize(data);
            case TYPE.DHCID:      return this.DHCID.serialize(data);
            case TYPE.NSEC3:      return this.NSEC3.serialize(data);
            case TYPE.NSEC3PARAM: return this.NSEC3PARAM.serialize(data);
            case TYPE.TLSA:       return this.TLSA.serialize(data);
            case TYPE.SMIMEA:     return this.SMIMEA.serialize(data);
            case TYPE.CDS:        return this.DS.serialize(data);
            case TYPE.CDNSKEY:    return this.DNSKEY.serialize(data);
            case TYPE.OPENPGPKEY: return this.OPENPGPKEY.serialize(data);
            case TYPE.CSYNC:      return this.CSYNC.serialize(data);
            case TYPE.ZONEMD:     return this.ZONEMD.serialize(data);
            case TYPE.SVCB:       return this.SVCB.serialize(data);
            case TYPE.HTTPS:      return this.HTTPS.serialize(data);
            case TYPE.SPF:        return this.SPF.serialize(data);
            case TYPE.TKEY:       return this.TKEY.serialize(data);
            case TYPE.TSIG:       return this.TSIG.serialize(data);
            case TYPE.URI:        return this.URI.serialize(data);
            case TYPE.CAA:        return this.CAA.serialize(data);
            case TYPE.X25:        return this.X25.serialize(data);
            case TYPE.KX:         return this.KX.serialize(data);
            case TYPE.OPT:        return this.OPT.serialize(data);
            case TYPE.NID:        return this.NID.serialize(data);
            case TYPE.L32:        return this.L32.serialize(data);
            case TYPE.L64:        return this.L64.serialize(data);
            case TYPE.LP:         return this.LP.serialize(data);
            case TYPE.EUI48:      return this.EUI48.serialize(data);
            case TYPE.EUI64:      return this.EUI64.serialize(data);
            case TYPE.DLV:        return this.DS.serialize(data);
            case TYPE.TA:         return this.DS.serialize(data);
            case TYPE.AVC:        return this.TXT.serialize(data);
            default:
                throw new Error(`Cannot serialize rdata for record type ${record.type}: pass raw bytes as a Uint8Array instead.`);
        }
    }

    /**
     * Serializes a DNS resource record into an existing DataView.
     * @static
     * @param {DataView} view - DataView to write to
     * @param {number} offset - Starting offset
     * @param {DNSRecord|DNSQuestion|Zone} record - Record to serialize
     * @returns {number} New offset after serialization
     * @throws {RangeError} If the record does not fit into the view
     */
    static serialize(view, offset, record) {
        const bytes = this.toBytes(record);
        if (offset + bytes.byteLength > view.byteLength) {
            throw new RangeError(`Record "${record.name}" needs ${bytes.byteLength} bytes but only ${view.byteLength - offset} are left in the buffer.`);
        }
        new Uint8Array(view.buffer, view.byteOffset, view.byteLength).set(bytes, offset);
        return offset + bytes.byteLength;
    }

    /**
     * A Record (IPv4 address) serializer
     * @static
     */
    static A = {
        /**
         * @param {DataView} view - DataView containing the record
         * @param {number} offset - Starting offset
         * @param {number} dataLength - Length of the record data
         * @returns {Object} Deserialized A record data
         * @throws {Error} If data length is not 4 bytes
         */
        deserialize(view, offset, dataLength) {
            if (dataLength !== 4) {
                throw new Error("Invalid IPv4 byte array length.");
            }
            const ipv4 = formatIPv4(readBytes(view, offset, dataLength));
            const data = { ipv4: ipv4 };
            return data;
        },
        /**
         * @param {Object} rdata - Record data to serialize
         * @returns {Uint8Array} Serialized A record
         */
        serialize(rdata) {
            return parseIPv4(rdata.ipv4);
        }
    }

    /**
     * NS Record (Name Server) serializer
     * @static
     */
    static NS = {
        /**
         * @param {DataView} view - DataView containing the record
         * @param {number} offset - Starting offset
         * @returns {Object} Deserialized NS record data
         */
        deserialize(view, offset) {
            const value = DnsNameSerializer.deserialize(view, offset);
            const data = { name: value.name };
            return data;
        },
        /**
         * @param {Object} rdata - Record data to serialize
         * @returns {Uint8Array} Serialized NS record
         */
        serialize(rdata) {
            const name = rdata.name;
            const buffer = DnsNameSerializer.serialize(name);
            return buffer;
        }
    }

    static MD = {
        deserialize(view, offset) {
            const value = DnsNameSerializer.deserialize(view, offset);
            const data = { name: value.name };
            return data;
        },
        serialize(rdata) {
            const name = rdata.name;
            const buffer = DnsNameSerializer.serialize(name);
            return buffer;
        }
    }

    static MF = {
        deserialize(view, offset) {
            const value = DnsNameSerializer.deserialize(view, offset);
            const data = { name: value.name };
            return data;
        },
        serialize(rdata) {
            const name = rdata.name;
            const buffer = DnsNameSerializer.serialize(name);
            return buffer;
        }
    }
    
    static CNAME = {
        deserialize(view, offset) {
            const value = DnsNameSerializer.deserialize(view, offset);
            const data = { name: value.name };
            return data;
        },
        serialize(rdata) {
            const name = rdata.name;
            const buffer = DnsNameSerializer.serialize(name);
            return buffer;
        }
    }
    
    /**
     * SOA Record (Start of Authority) serializer
     * @static
     */
    static SOA = {
        /**
         * @param {DataView} view - DataView containing the record
         * @param {number} offset - Starting offset
         * @returns {Object} Deserialized SOA record data
         */
        deserialize(view, offset) {
            const mname = DnsNameSerializer.deserialize(view, offset);
            offset = mname.offset;
            const rname = DnsNameSerializer.deserialize(view, offset);
            offset = rname.offset;
            const serial = view.getUint32(offset +  0);
            const refresh = view.getUint32(offset +  4);
            const retry = view.getUint32(offset +  8);
            const expire = view.getUint32(offset + 12);
            const minimum = view.getUint32(offset + 16);
            const data = { mname: mname.name, rname: rname.name, serial: serial, refresh: refresh, retry: retry, expire: expire, minimum: minimum };
            return data;
        },
        /**
         * @param {Object} rdata - Record data to serialize
         * @returns {Uint8Array} Serialized SOA record
         */
        serialize(rdata) {
            const mname = rdata.mname;
            const mnameBytes = DnsNameSerializer.serialize(mname);
            const rname = rdata.rname;
            const rnameBytes = DnsNameSerializer.serialize(rname);

            const length = mnameBytes.length + rnameBytes.length + 20;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;

            mnameBytes.forEach((byte) => view.setUint8(offset++, byte));
            rnameBytes.forEach((byte) => view.setUint8(offset++, byte));
            view.setUint32(offset +  0, rdata.serial,  false);
            view.setUint32(offset +  4, rdata.refresh, false);
            view.setUint32(offset +  8, rdata.retry,   false);
            view.setUint32(offset + 12, rdata.expire,  false);
            view.setUint32(offset + 16, rdata.minimum, false);
            return new Uint8Array(buffer);
        }
    }

    static MB = {
        deserialize(view, offset) {
            const value = DnsNameSerializer.deserialize(view, offset);
            const data = { name: value.name };
            return data;
        },
        serialize(rdata) {
            const name = rdata.name;
            const buffer = DnsNameSerializer.serialize(name);
            return buffer;
        }
    }

    static MG = {
        deserialize(view, offset) {
            const value = DnsNameSerializer.deserialize(view, offset);
            const data = { name: value.name };
            return data;
        },
        serialize(rdata) {
            const name = rdata.name;
            const buffer = DnsNameSerializer.serialize(name);
            return buffer;
        }
    }

    static MR = {
        deserialize(view, offset) {
            const value = DnsNameSerializer.deserialize(view, offset);
            const data = { name: value.name };
            return data;
        },
        serialize(rdata) {
            const name = rdata.name;
            const buffer = DnsNameSerializer.serialize(name);
            return buffer;
        }
    }

    static NULL = {
        deserialize(view, offset, dataLength) {
            const data = readRange(view, offset, offset + dataLength);
            return { data: toBase64(data) };
        },
        serialize(rdata) {
            const base64Data = rdata.data;
            const buffer = fromBase64(base64Data);
            return buffer;
        }
    }

    /**
     * WKS Record (Well-Known Services) serializer
     * @static
     */
    static WKS = {
        /**
         * @param {DataView} view - DataView containing the record
         * @param {number} offset - Starting offset
         * @param {number} dataLength - Length of the record data
         * @returns {Object} Deserialized WKS record data
         */
        deserialize(view, offset, dataLength) {
            const address = readRange(view, offset, offset + 4).join(".");
            const protocol = view.getUint8(offset + 4);
            const bitmap = readRange(view, offset + 5, offset + dataLength);
            const ports = [];

            for (let i = 0; i < bitmap.length; i++) {
                for (let bit = 0; bit < 8; bit++) {
                    if (bitmap[i] & (1 << (7 - bit))) {
                        ports.push(i * 8 + bit);
                    }
                }
            }

            const data = { address: address, protocol: protocol, ports: ports };
            return data;
        },
        /**
         * @param {Object} rdata - Record data to serialize
         * @returns {Uint8Array} Serialized WKS record
         */
        serialize(rdata) {
            const address = rdata.address;
            const protocol = rdata.protocol;
            const ports = rdata.ports || [];

            const addressBytes = parseIPv4(address);
            // An empty port list is legitimate and yields an empty bitmap;
            // reduce() also avoids spreading a large port list into Math.max.
            const maxPort = ports.reduce((max, port) => Math.max(max, port), -1);
            const bitmapLength = Math.ceil((maxPort + 1) / 8);
            const bitmap = new Uint8Array(bitmapLength);

            for (const port of ports) {
                const byteIndex = Math.floor(port / 8);
                const bitIndex = 7 - (port % 8);
                bitmap[byteIndex] |= (1 << bitIndex);
            }

            const buffer = new Uint8Array(5 + bitmapLength);
            buffer.set(addressBytes, 0);
            buffer[4] = protocol;
            buffer.set(bitmap, 5);

            return buffer;
        }
    }

    static PTR = {
        deserialize(view, offset) {
            const value = DnsNameSerializer.deserialize(view, offset);
            const data = { name: value.name };
            return data;
        },
        serialize(rdata) {
            const name = rdata.name;
            const buffer = DnsNameSerializer.serialize(name);
            return buffer;
        }
    }

    static MINFO = {
        deserialize(view, offset) {
            const rmailbx = DnsNameSerializer.deserialize(view, offset);
            offset = rmailbx.offset;
            const emailbx = DnsNameSerializer.deserialize(view, offset);
            const data = { rmailbx: rmailbx.name, emailbx: emailbx.name };
            return data;
        },
        serialize(rdata) {
            const rmailbx = rdata.rmailbx;
            const emailbx = rdata.emailbx;
            const rmailbxBytes = DnsNameSerializer.serialize(rmailbx);
            const emailbxBytes = DnsNameSerializer.serialize(emailbx);

            const buffer = new Uint8Array(rmailbxBytes.length + emailbxBytes.length);
            buffer.set(rmailbxBytes, 0);
            buffer.set(emailbxBytes, rmailbxBytes.length);

            return buffer;
        }
    }

    static RP = {
        deserialize(view, offset) {
            const mbox = DnsNameSerializer.deserialize(view, offset);
            offset = mbox.offset;
            const txt = DnsNameSerializer.deserialize(view, offset);
            const data = { mbox: mbox.name, txt: txt.name };
            return data;
        },
        serialize(rdata) {
            const mbox = rdata.mbox;
            const txt = rdata.txt;
            const mboxBytes = DnsNameSerializer.serialize(mbox);
            const txtBytes = DnsNameSerializer.serialize(txt);

            const buffer = new Uint8Array(mboxBytes.length + txtBytes.length);
            buffer.set(mboxBytes, 0);
            buffer.set(txtBytes, mboxBytes.length);

            return buffer;
        }
    }

    static AFSDB = {
        deserialize(view, offset) {
            const subtype = view.getUint16(offset);
            const hostname = DnsNameSerializer.deserialize(view, offset + 2);
            const data = { subtype: subtype, hostname: hostname.name };
            return data;
        },
        serialize(rdata) {
            const subtype = rdata.subtype;
            const hostname = rdata.hostname;
            const hostnameBytes = DnsNameSerializer.serialize(hostname);

            const length = hostnameBytes.length + 2;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint16(offset, subtype, false);
            offset += 2;
            hostnameBytes.forEach((byte) => view.setUint8(offset++, byte));
            return new Uint8Array(buffer);
        }
    }

    static HINFO = {
        deserialize(view, offset) {
            const cpuLength = view.getUint8(offset);
            offset += 1;
            const cpu = textDecoder.decode(readRange(view, offset, offset + cpuLength));
            offset += cpuLength;
            const osLength = view.getUint8(offset);
            offset += 1;
            const os = textDecoder.decode(readRange(view, offset, offset + osLength));
            offset += osLength;
            const data   = { cpu: cpu, os: os };
            return data;
        },
        serialize(rdata) {
            const cpu = rdata.cpu;
            const os  = rdata.os;
            const cpuBytes = new TextEncoder().encode(cpu);
            const osBytes = new TextEncoder().encode(os);

            const length = cpuBytes.length + osBytes.length + 2;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint8(offset, cpuBytes.length);
            offset++;
            cpuBytes.forEach((byte) => view.setUint8(offset++, byte));
            view.setUint8(offset, osBytes.length);
            offset++;
            osBytes.forEach((byte) => view.setUint8(offset++, byte));
            return new Uint8Array(buffer);
        }
    }
    
    /**
     * MX Record (Mail Exchange) serializer
     * @static
     */
    static MX = {
        /**
         * @param {DataView} view - DataView containing the record
         * @param {number} offset - Starting offset
         * @returns {Object} Deserialized MX record data
         */
        deserialize(view, offset) {
            const preference = view.getUint16(offset);
            const exchange = DnsNameSerializer.deserialize(view, offset + 2);
            const data = { preference: preference, exchange: exchange.name };
            return data;
        },
        serialize(rdata) {
            const preference = rdata.preference;
            const exchange = rdata.exchange;
            const exchangeBytes = DnsNameSerializer.serialize(exchange);

            const length = exchangeBytes.length + 2;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint16(offset, preference, false);
            offset += 2;
            exchangeBytes.forEach((byte) => view.setUint8(offset++, byte));
            return new Uint8Array(buffer);
        }
    }
    
    /**
     * AAAA Record (IPv6 address) serializer
     * @static
     */
    static AAAA = {
        /**
         * @param {DataView} view - DataView containing the record
         * @param {number} offset - Starting offset
         * @param {number} dataLength - Length of the record data
         * @returns {Object} Deserialized AAAA record data
         * @throws {Error} If data length is not 16 bytes
         */
        deserialize(view, offset, dataLength) {
            if (dataLength !== 16) {
                throw new Error("Invalid IPv6 byte array length.");
            }
            const ipv6 = formatIPv6(readBytes(view, offset, dataLength));
            const data = { ipv6: ipv6 };
            return data;
        },
        /**
         * @param {Object} rdata - Record data to serialize
         * @returns {Uint8Array} Serialized AAAA record
         * @throws {Error} If the address is not a valid IPv6 address
         */
        serialize(rdata) {
            return parseIPv6(rdata.ipv6);
        }
    }
    
    static SRV = {
        deserialize(view, offset) {
            const priority = view.getUint16(offset + 0);
            const weight = view.getUint16(offset + 2);
            const port = view.getUint16(offset + 4);
            const target = DnsNameSerializer.deserialize(view, offset + 6);
            const data = { priority: priority, weight: weight, port: port, target: target.name };
            return data;
        },
        serialize(rdata) {
            const priority = rdata.priority;
            const weight = rdata.weight;
            const port = rdata.port;
            const target = rdata.target;
            const targetBytes = DnsNameSerializer.serialize(target);

            const length = targetBytes.length + 6;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint16(offset, priority);
            offset += 2;
            view.setUint16(offset, weight);
            offset += 2;
            view.setUint16(offset, port);
            offset += 2;
            targetBytes.forEach((byte) => view.setUint8(offset++, byte));
            return new Uint8Array(buffer);
        }
    }
    
    static DS = {
        deserialize(view, offset, dataLength) {
            const keyTag = view.getUint16(offset);
            offset += 2;
            const algorithm = view.getUint8(offset);
            offset += 1;
            const digestType = view.getUint8(offset);
            offset += 1;
            const digestBytes = readRange(view, offset, offset + (dataLength - 4));
            const digestBase64 = toBase64(digestBytes);
            const data = { keyTag: keyTag, algorithm: algorithm, digestType: digestType, digest: digestBase64 };
            return data;
        },
        serialize(rdata) {
            const keyTag = rdata.keyTag;
            const algorithm = rdata.algorithm;
            const digestType = rdata.digestType;
            const digestBase64 = rdata.digest;
            const digestBytes = fromBase64(digestBase64);

            const length = digestBytes.length + 4;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint16(offset, keyTag);
            offset += 2;
            view.setUint8(offset, algorithm);
            offset++;
            view.setUint8(offset, digestType);
            offset++;
            digestBytes.forEach((byte) => view.setUint8(offset++, byte));
            return new Uint8Array(buffer);
        }
    }
    
    /**
     * TXT Record (Text) serializer
     * @static
     */
    static TXT = {
        /**
         * Reads every character-string in the rdata and joins them. A TXT record
         * carries payloads longer than 255 bytes as several character-strings
         * (RFC 1035 §3.3.14), which is how long DKIM and SPF records are stored.
         * @param {DataView} view - DataView containing the record
         * @param {number} offset - Starting offset
         * @param {number} [dataLength] - Length of the record data
         * @returns {Object} Deserialized TXT record data
         */
        deserialize(view, offset, dataLength) {
            const end = dataLength === undefined ? offset + 1 + view.getUint8(offset) : offset + dataLength;
            return { text: decodeCharacterStrings(view, offset, end) };
        },
        /**
         * @param {Object} rdata - Record data to serialize
         * @returns {Uint8Array} Serialized TXT record
         */
        serialize(rdata) {
            return encodeCharacterStrings(rdata.text);
        }
    }
    
    static RRSIG = {
        deserialize(view, offset, dataLength) {
            const typeCoveredCode = view.getUint16(offset);
            const typeCovered = TYPE_NAMES[typeCoveredCode] || typeCoveredCode;
            const algorithm = view.getUint8(offset   +  2);
            const labels = view.getUint8(offset   +  3);
            const originalTtl = view.getUint32(offset  +  4);
            const expiration = view.getUint32(offset  +  8);
            const inception = view.getUint32(offset  + 12);
            const keyTag = view.getUint16(offset  + 16);
            const signersName = DnsNameSerializer.deserialize(view, offset + 18);
            const buffer = readRange(view, signersName.offset, offset + dataLength);
            const signature = toBase64(new Uint8Array(buffer));
            const data = { typeCovered: typeCovered, algorithm: algorithm, labels: labels, originalTtl: originalTtl, expiration: new Date(expiration * 1000), inception: new Date(inception * 1000), keyTag: keyTag, signersName: signersName.name, signature: signature };
            return data;
        },
        serialize(rdata) {
            // typeCovered may be a name ("A") as produced by deserialize, or a code.
            const typeCovered = resolveTypeCode(rdata.typeCovered);
            const algorithm = rdata.algorithm;
            const labels = rdata.labels;
            const originalTtl = rdata.originalTtl;
            const expiration = Math.floor(rdata.expiration.getTime() / 1000);
            const inception = Math.floor(rdata.inception.getTime() / 1000);
            const keyTag = rdata.keyTag;
            const signersName = rdata.signersName;
            const signature = rdata.signature;
            const signersNameBytes = DnsNameSerializer.serialize(signersName);
            const signatureBytes = fromBase64(signature);

            const length = signersNameBytes.length + signatureBytes.length + 18;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint16(offset, typeCovered);
            offset += 2;
            view.setUint8(offset, algorithm);
            offset += 1;
            view.setUint8(offset, labels);
            offset += 1;
            view.setUint32(offset, originalTtl);
            offset += 4;
            view.setUint32(offset, expiration);
            offset += 4;
            view.setUint32(offset, inception);
            offset += 4;
            view.setUint16(offset, keyTag);
            offset += 2;
            signersNameBytes.forEach((byte) => view.setUint8(offset++, byte));
            signatureBytes.forEach((byte) => view.setUint8(offset++, byte));
            return new Uint8Array(buffer);
        }
    }
    
    static NSEC = {
        /**
         * @param {DataView} view - DataView containing the record
         * @param {number} offset - Starting offset
         * @param {number} dataLength - Length of the record data
         * @returns {Object} Deserialized NSEC record data
         */
        deserialize(view, offset, dataLength) {
            const end = offset + dataLength;
            const nextDomain = DnsNameSerializer.deserialize(view, offset);
            return {
                nextDomain: nextDomain.name,
                typeBitmaps: decodeTypeBitmaps(view, offset + nextDomain.length, end)
            };
        },
        /**
         * @param {Object} rdata - Record data to serialize
         * @returns {Uint8Array} Serialized NSEC record
         */
        serialize(rdata) {
            return concatBytes(
                DnsNameSerializer.serialize(rdata.nextDomain),
                encodeTypeBitmaps(rdata?.typeBitmaps || [])
            );
        }
    }
    
    static DNSKEY = {
        deserialize(view, offset, dataLength) {
            const flagBits = view.getUint16(offset);
            let flag;
            offset += 2;
            switch (flagBits) {
                case 256:
                    flag = "ZSK";
                    break;
                case 257:
                    flag = "KSK";
                    break;
                default:
                    // Any other combination of the ZONE/SEP/REVOKE bits is kept
                    // numeric so it survives a round-trip unchanged.
                    flag = flagBits;
            } 
            const protocol = view.getUint8(offset);
            offset += 1;
            const algorithm = view.getUint8(offset);
            offset += 1;
            const publicKeyBytes = readRange(view, offset, offset + (dataLength - 4));
            const publicKeyBase64 = toBase64(publicKeyBytes);
            const data = { flag: flag, protocol: protocol, algorithm: algorithm, publickey: publicKeyBase64 };
            return data;
        },
        serialize(rdata) {
            const flag = rdata.flag === "ZSK" ? 256
                : rdata.flag === "KSK" ? 257
                : typeof rdata.flag === "number" ? rdata.flag
                : (() => { throw new Error(`Invalid DNSKEY flags value "${rdata.flag}": expected "ZSK", "KSK" or a number.`); })();
            const protocol = rdata.protocol;
            const algorithm = rdata.algorithm;
            const publicKeyBase64 = rdata.publickey;
            const publicKeyBytes = fromBase64(publicKeyBase64);

            const length = publicKeyBytes.length + 4;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint16(offset, flag, false);
            offset += 2;
            view.setUint8(offset, protocol);
            offset += 1;
            view.setUint8(offset, algorithm);
            offset += 1;
            publicKeyBytes.forEach((byte) => view.setUint8(offset++, byte));
            return new Uint8Array(buffer);
        }
    }

    static TSIG = {
        deserialize(view, offset) {
            let rdata = {};
            const algorithm = DnsNameSerializer.deserialize(view, offset);
            rdata.algorithm = algorithm.name;
            let start = algorithm.offset;
            const timestampHigh = view.getUint16(start);
            const timestampLow  = view.getUint32(start + 2);
            rdata.timestamp = (BigInt(timestampHigh) << 32n) | BigInt(timestampLow);
            start += 6;
            rdata.fudge = view.getUint16(start);
            start += 2;
            const macLength = view.getUint16(start);
            start += 2;
            rdata.mac = readRange(view, start, start + macLength);
            start += macLength;
            rdata.originalId = view.getUint16(start);
            start += 2;
            rdata.error = view.getUint16(start);
            start += 2;
            const otherLength = view.getUint16(start);
            start += 2;
            rdata.otherData = readRange(view, start, start + otherLength);
            start += otherLength;
            return rdata;
        },
        serialize(rdata) {
            const algorithmBytes = DnsNameSerializer.serialize(rdata.algorithm);
            const timestampHigh = Number((rdata.timestamp >> 32n) & 0xFFFFn);
            const timestampLow = Number(rdata.timestamp & 0xFFFFFFFFn);

            // RFC 8945: layout is algorithm + 6 (time) + 2 (fudge) + 2 (maclen)
            // + mac + 2 (originalId) + 2 (error) + 2 (otherLen) + otherData.
            // The mac-length field MUST always be present (zero if empty).
            const length = algorithmBytes.length + 16 + rdata.mac.byteLength + rdata.otherData.byteLength;

            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;
    
            algorithmBytes.forEach((byte) => view.setUint8(offset++, byte));
            view.setUint16(offset, timestampHigh);
            offset += 2;
            view.setUint32(offset, timestampLow);
            offset += 4;
            view.setUint16(offset, rdata.fudge);
            offset += 2;

            view.setUint16(offset, rdata.mac.byteLength);
            offset += 2;
            rdata.mac.forEach((byte) => view.setUint8(offset++, byte));

            view.setUint16(offset, rdata.originalId);
            offset += 2;
            view.setUint16(offset, rdata.error);
            offset += 2;
            view.setUint16(offset, rdata.otherData.byteLength);
            offset += 2;
            rdata.otherData.forEach((byte) => view.setUint8(offset++, byte));
            return new Uint8Array(buffer);
        }
    }

    static LOC = {
        deserialize(view, offset, dataLength) {
            if (dataLength !== 16) {
                throw new Error("Invalid LOC record length.");
            }
            const version = view.getUint8(offset);
            const size = view.getUint8(offset + 1);
            const horizPre = view.getUint8(offset + 2);
            const vertPre = view.getUint8(offset + 3);
            const latitude = view.getUint32(offset + 4);
            const longitude = view.getUint32(offset + 8);
            const altitude = view.getUint32(offset + 12);
            
            const data = { version: version, size: size, horizPre: horizPre, vertPre: vertPre, latitude: latitude, longitude: longitude, altitude: altitude };
            return data;
        },
        serialize(rdata) {
            const buffer = new ArrayBuffer(16);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint8(offset, rdata.version);
            offset++;
            view.setUint8(offset, rdata.size);
            offset++;
            view.setUint8(offset, rdata.horizPre);
            offset++;
            view.setUint8(offset, rdata.vertPre);
            offset++;
            view.setUint32(offset, rdata.latitude, false);
            offset += 4;
            view.setUint32(offset, rdata.longitude, false);
            offset += 4;
            view.setUint32(offset, rdata.altitude, false);
            
            return new Uint8Array(buffer);
        }
    }

    static NAPTR = {
        deserialize(view, offset) {
            const order = view.getUint16(offset);
            const preference = view.getUint16(offset + 2);
            offset += 4;
            
            const flagsLength = view.getUint8(offset);
            const flags = textDecoder.decode(readRange(view, offset + 1, offset + 1 + flagsLength));
            offset += 1 + flagsLength;
            
            const servicesLength = view.getUint8(offset);
            const services = textDecoder.decode(readRange(view, offset + 1, offset + 1 + servicesLength));
            offset += 1 + servicesLength;
            
            const regexpLength = view.getUint8(offset);
            const regexp = textDecoder.decode(readRange(view, offset + 1, offset + 1 + regexpLength));
            offset += 1 + regexpLength;
            
            const replacement = DnsNameSerializer.deserialize(view, offset);
            
            const data = { order: order, preference: preference, flags: flags, services: services, regexp: regexp, replacement: replacement.name };
            return data;
        },
        serialize(rdata) {
            const order = rdata.order;
            const preference = rdata.preference;
            const flags = rdata.flags;
            const services = rdata.services;
            const regexp = rdata.regexp;
            const replacement = rdata.replacement;
            
            const flagsBytes = new TextEncoder().encode(flags);
            const servicesBytes = new TextEncoder().encode(services);
            const regexpBytes = new TextEncoder().encode(regexp);
            const replacementBytes = DnsNameSerializer.serialize(replacement);
            
            const length = 4 + 1 + flagsBytes.length + 1 + servicesBytes.length + 1 + regexpBytes.length + replacementBytes.length;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;
            
            view.setUint16(offset, order, false);
            offset += 2;
            view.setUint16(offset, preference, false);
            offset += 2;
            view.setUint8(offset, flagsBytes.length);
            offset++;
            flagsBytes.forEach((byte) => view.setUint8(offset++, byte));
            view.setUint8(offset, servicesBytes.length);
            offset++;
            servicesBytes.forEach((byte) => view.setUint8(offset++, byte));
            view.setUint8(offset, regexpBytes.length);
            offset++;
            regexpBytes.forEach((byte) => view.setUint8(offset++, byte));
            replacementBytes.forEach((byte) => view.setUint8(offset++, byte));
            
            return new Uint8Array(buffer);
        }
    }

    static CERT = {
        deserialize(view, offset, dataLength) {
            const type = view.getUint16(offset);
            const keyTag = view.getUint16(offset + 2);
            const algorithm = view.getUint8(offset + 4);
            const certificate = readRange(view, offset + 5, offset + dataLength);
            const certificateBase64 = toBase64(certificate);
            
            const data = { type: type, keyTag: keyTag, algorithm: algorithm, certificate: certificateBase64 };
            return data;
        },
        serialize(rdata) {
            const type = rdata.type;
            const keyTag = rdata.keyTag;
            const algorithm = rdata.algorithm;
            const certificateBase64 = rdata.certificate;
            const certificateBytes = fromBase64(certificateBase64);
            
            const length = certificateBytes.length + 5;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;
            
            view.setUint16(offset, type, false);
            offset += 2;
            view.setUint16(offset, keyTag, false);
            offset += 2;
            view.setUint8(offset, algorithm);
            offset++;
            certificateBytes.forEach((byte) => view.setUint8(offset++, byte));
            
            return new Uint8Array(buffer);
        }
    }

    static DNAME = {
        deserialize(view, offset) {
            const value = DnsNameSerializer.deserialize(view, offset);
            const data = { name: value.name };
            return data;
        },
        serialize(rdata) {
            const name = rdata.name;
            const buffer = DnsNameSerializer.serialize(name);
            return buffer;
        }
    }

    static SSHFP = {
        deserialize(view, offset, dataLength) {
            const algorithm = view.getUint8(offset);
            const fpType = view.getUint8(offset + 1);
            const fingerprint = readRange(view, offset + 2, offset + dataLength);
            const fingerprintHex = toHex(fingerprint);
            
            const data = { algorithm: algorithm, fpType: fpType, fingerprint: fingerprintHex };
            return data;
        },
        serialize(rdata) {
            const algorithm = rdata.algorithm;
            const fpType = rdata.fpType;
            const fingerprintHex = rdata.fingerprint;
            const fingerprintBytes = fromHex(fingerprintHex);
            
            const buffer = new Uint8Array(2 + fingerprintBytes.length);
            buffer[0] = algorithm;
            buffer[1] = fpType;
            buffer.set(fingerprintBytes, 2);
            
            return buffer;
        }
    }

    static TLSA = {
        deserialize(view, offset, dataLength) {
            const usage = view.getUint8(offset);
            const selector = view.getUint8(offset + 1);
            const matchingType = view.getUint8(offset + 2);
            const certAssocData = readRange(view, offset + 3, offset + dataLength);
            const certAssocDataHex = toHex(certAssocData);
            
            const data = { usage: usage, selector: selector, matchingType: matchingType, certAssocData: certAssocDataHex };
            return data;
        },
        serialize(rdata) {
            const usage = rdata.usage;
            const selector = rdata.selector;
            const matchingType = rdata.matchingType;
            const certAssocDataHex = rdata.certAssocData;
            const certAssocDataBytes = fromHex(certAssocDataHex);
            
            const buffer = new Uint8Array(3 + certAssocDataBytes.length);
            buffer[0] = usage;
            buffer[1] = selector;
            buffer[2] = matchingType;
            buffer.set(certAssocDataBytes, 3);
            
            return buffer;
        }
    }

    static SPF = {
        /**
         * @param {DataView} view - DataView containing the record
         * @param {number} offset - Starting offset
         * @param {number} [dataLength] - Length of the record data
         * @returns {Object} Deserialized SPF record data
         */
        deserialize(view, offset, dataLength) {
            const end = dataLength === undefined ? offset + 1 + view.getUint8(offset) : offset + dataLength;
            return { text: decodeCharacterStrings(view, offset, end) };
        },
        serialize(rdata) {
            return encodeCharacterStrings(rdata.text);
        }
    }

    static URI = {
        deserialize(view, offset, dataLength) {
            const priority = view.getUint16(offset);
            const weight = view.getUint16(offset + 2);
            const target = textDecoder.decode(readRange(view, offset + 4, offset + dataLength));
            
            const data = { priority: priority, weight: weight, target: target };
            return data;
        },
        serialize(rdata) {
            const priority = rdata.priority;
            const weight = rdata.weight;
            const target = rdata.target;
            const targetBytes = new TextEncoder().encode(target);
            
            const length = targetBytes.length + 4;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;
            
            view.setUint16(offset, priority, false);
            offset += 2;
            view.setUint16(offset, weight, false);
            offset += 2;
            targetBytes.forEach((byte) => view.setUint8(offset++, byte));
            
            return new Uint8Array(buffer);
        }
    }

    static CAA = {
        deserialize(view, offset, dataLength) {
            const flags = view.getUint8(offset);
            const tagLength = view.getUint8(offset + 1);
            const tag = textDecoder.decode(readRange(view, offset + 2, offset + 2 + tagLength));
            const value = textDecoder.decode(readRange(view, offset + 2 + tagLength, offset + dataLength));
            
            const data = { flags: flags, tag: tag, value: value };
            return data;
        },
        serialize(rdata) {
            const flags = rdata.flags;
            const tag = rdata.tag;
            const value = rdata.value;
            
            const tagBytes = new TextEncoder().encode(tag);
            const valueBytes = new TextEncoder().encode(value);
            
            const buffer = new Uint8Array(2 + tagBytes.length + valueBytes.length);
            buffer[0] = flags;
            buffer[1] = tagBytes.length;
            buffer.set(tagBytes, 2);
            buffer.set(valueBytes, 2 + tagBytes.length);
            
            return buffer;
        }
    }

    static HTTPS = {
        deserialize(view, offset, dataLength) {
            const startOffset = offset;
            const priority = view.getUint16(offset);
            offset += 2;
            
            const target = DnsNameSerializer.deserialize(view, offset);
            offset = target.offset;
            
            const params = {};
            const maxOffset = startOffset + dataLength;
            
            while (offset < maxOffset) {
                if (offset + 4 > maxOffset) break;
                
                const paramKey = view.getUint16(offset);
                offset += 2;
                const paramLength = view.getUint16(offset);
                offset += 2;
                
                if (offset + paramLength > maxOffset) break;
                
                let paramValue;
                if (paramLength === 0) {
                    paramValue = "";
                } else {
                    const paramBytes = readRange(view, offset, offset + paramLength);
                    paramValue = toHex(paramBytes);
                    offset += paramLength;
                }
                
                params[paramKey] = paramValue;
            }
            
            return { priority, target: target.name, params };
        },
        serialize(rdata) {
            const priority = rdata.priority;
            const target = rdata.target;
            const params = rdata.params || {};
            
            const targetBytes = DnsNameSerializer.serialize(target);
            
            const paramKeys = Object.keys(params).map(Number).sort((a, b) => a - b);
            const paramBuffers = paramKeys.map(k => {
                const v = params[k];
                return fromHex(v || "");
            });
            const paramsSize = paramBuffers.reduce((sum, b) => sum + 4 + b.length, 0);
            
            const length = 2 + targetBytes.length + paramsSize;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;
            
            view.setUint16(offset, priority, false);
            offset += 2;
            
            targetBytes.forEach((byte) => view.setUint8(offset++, byte));
            
            for (let i = 0; i < paramKeys.length; i++) {
                view.setUint16(offset, paramKeys[i], false);
                offset += 2;
                view.setUint16(offset, paramBuffers[i].length, false);
                offset += 2;
                paramBuffers[i].forEach((byte) => view.setUint8(offset++, byte));
            }
            
            return new Uint8Array(buffer);
        }
    }

    static SVCB = {
        deserialize(view, offset, dataLength) {
            const startOffset = offset;
            const priority = view.getUint16(offset);
            offset += 2;
            
            const target = DnsNameSerializer.deserialize(view, offset);
            offset = target.offset;
            
            const params = {};
            const maxOffset = startOffset + dataLength;
            
            while (offset < maxOffset) {
                if (offset + 4 > maxOffset) break;
                
                const paramKey = view.getUint16(offset);
                offset += 2;
                const paramLength = view.getUint16(offset);
                offset += 2;
                
                if (offset + paramLength > maxOffset) break;
                
                let paramValue;
                if (paramLength === 0) {
                    paramValue = "";
                } else {
                    const paramBytes = readRange(view, offset, offset + paramLength);
                    paramValue = toHex(paramBytes);
                    offset += paramLength;
                }
                
                params[paramKey] = paramValue;
            }
            
            return { priority, target: target.name, params };
        },
        serialize(rdata) {
            const priority = rdata.priority;
            const target = rdata.target;
            const params = rdata.params || {};
            
            const targetBytes = DnsNameSerializer.serialize(target);
            
            const paramKeys = Object.keys(params).map(Number).sort((a, b) => a - b);
            const paramBuffers = paramKeys.map(k => {
                const v = params[k];
                return fromHex(v || "");
            });
            const paramsSize = paramBuffers.reduce((sum, b) => sum + 4 + b.length, 0);
            
            const length = 2 + targetBytes.length + paramsSize;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;
            
            view.setUint16(offset, priority, false);
            offset += 2;
            
            targetBytes.forEach((byte) => view.setUint8(offset++, byte));
            
            for (let i = 0; i < paramKeys.length; i++) {
                view.setUint16(offset, paramKeys[i], false);
                offset += 2;
                view.setUint16(offset, paramBuffers[i].length, false);
                offset += 2;
                paramBuffers[i].forEach((byte) => view.setUint8(offset++, byte));
            }
            
            return new Uint8Array(buffer);
        }
    }

    static OPENPGPKEY = {
        deserialize(view, offset, dataLength) {
            const keyData = readRange(view, offset, offset + dataLength);
            const keyBase64 = toBase64(keyData);
            
            const data = { publickey: keyBase64 };
            return data;
        },
        serialize(rdata) {
            const publicKeyBase64 = rdata.publickey;
            const publicKeyBytes = fromBase64(publicKeyBase64);
            return publicKeyBytes;
        }
    }

    static SMIMEA = {
        deserialize(view, offset, dataLength) {
            const usage = view.getUint8(offset);
            const selector = view.getUint8(offset + 1);
            const matchingType = view.getUint8(offset + 2);
            const certAssocData = readRange(view, offset + 3, offset + dataLength);
            const certAssocDataHex = toHex(certAssocData);

            const data = { usage: usage, selector: selector, matchingType: matchingType, certAssocData: certAssocDataHex };
            return data;
        },
        serialize(rdata) {
            const usage = rdata.usage;
            const selector = rdata.selector;
            const matchingType = rdata.matchingType;
            const certAssocDataHex = rdata.certAssocData;
            const certAssocDataBytes = fromHex(certAssocDataHex);

            const buffer = new Uint8Array(3 + certAssocDataBytes.length);
            buffer[0] = usage;
            buffer[1] = selector;
            buffer[2] = matchingType;
            buffer.set(certAssocDataBytes, 3);

            return buffer;
        }
    }

    static IPSECKEY = {
        deserialize(view, offset, dataLength) {
            const startOffset = offset;
            const precedence = view.getUint8(offset);
            const gatewayType = view.getUint8(offset + 1);
            const algorithm = view.getUint8(offset + 2);
            offset += 3;

            let gateway = "";
            let gatewayLength = 0;

            switch (gatewayType) {
                case 0:
                    gateway = ".";
                    gatewayLength = 0;
                    break;
                case 1:
                    gatewayLength = 4;
                    gateway = formatIPv4(readBytes(view, offset, gatewayLength));
                    offset += gatewayLength;
                    break;
                case 2:
                    gatewayLength = 16;
                    gateway = formatIPv6(readBytes(view, offset, gatewayLength));
                    offset += gatewayLength;
                    break;
                case 3:
                    const gatewayName = DnsNameSerializer.deserialize(view, offset);
                    gateway = gatewayName.name;
                    offset = gatewayName.offset;
                    break;
                default:
                    // Without a known gateway type its length is unknown, so the
                    // remaining rdata cannot be split reliably.
                    throw new Error(`Unknown IPSECKEY gateway type ${gatewayType}.`);
            }

            // Korrekte Berechnung der verbleibenden Bytes für den Public Key
            const publicKeyLength = dataLength - (offset - startOffset);
            const publicKeyBytes = readRange(view, offset, offset + publicKeyLength);
            const publicKeyBase64 = toBase64(publicKeyBytes);

            const data = { precedence: precedence, gatewayType: gatewayType, algorithm: algorithm, gateway: gateway, publickey: publicKeyBase64 };
            return data;
        },
        serialize(rdata) {
            const precedence = rdata.precedence;
            const gatewayType = rdata.gatewayType;
            const algorithm = rdata.algorithm;
            const gateway = rdata.gateway;
            const publicKeyBase64 = rdata.publickey;

            let gatewayBytes;
            switch (gatewayType) {
                case 0:
                    gatewayBytes = new Uint8Array(0);
                    break;
                case 1:
                    gatewayBytes = parseIPv4(gateway);
                    break;
                case 2:
                    gatewayBytes = parseIPv6(gateway);
                    break;
                case 3:
                    gatewayBytes = DnsNameSerializer.serialize(gateway);
                    break;
                default:
                    throw new Error(`Unknown IPSECKEY gateway type ${gatewayType}.`);
            }

            const publicKeyBytes = fromBase64(publicKeyBase64);

            const length = 3 + gatewayBytes.length + publicKeyBytes.length;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint8(offset, precedence);
            offset++;
            view.setUint8(offset, gatewayType);
            offset++;
            view.setUint8(offset, algorithm);
            offset++;
            gatewayBytes.forEach((byte) => view.setUint8(offset++, byte));
            publicKeyBytes.forEach((byte) => view.setUint8(offset++, byte));

            return new Uint8Array(buffer);
        }
    }

    static DHCID = {
        deserialize(view, offset, dataLength) {
            const dhcidData = readRange(view, offset, offset + dataLength);
            const dhcidBase64 = toBase64(dhcidData);

            const data = { digest: dhcidBase64 };
            return data;
        },
        serialize(rdata) {
            const digestBase64 = rdata.digest;
            const digestBytes = fromBase64(digestBase64);
            return digestBytes;
        }
    }

    static NSEC3 = {
        /**
         * @param {DataView} view - DataView containing the record
         * @param {number} offset - Starting offset
         * @param {number} dataLength - Length of the record data
         * @returns {Object} Deserialized NSEC3 record data
         */
        deserialize(view, offset, dataLength) {
            const startOffset = offset;
            const algorithm = view.getUint8(offset);
            const flags = view.getUint8(offset + 1);
            const iterations = view.getUint16(offset + 2);
            const saltLength = view.getUint8(offset + 4);
            offset += 5;

            const salt = saltLength > 0 ? toHex(readBytes(view, offset, saltLength)) : "";
            offset += saltLength;

            const hashLength = view.getUint8(offset);
            offset++;
            const nextHashedOwnerName = toHex(readBytes(view, offset, hashLength));
            offset += hashLength;

            return {
                algorithm,
                flags,
                iterations,
                salt,
                nextHashedOwnerName,
                typeBitmaps: decodeTypeBitmaps(view, offset, startOffset + dataLength)
            };
        },
        /**
         * @param {Object} rdata - Record data to serialize
         * @returns {Uint8Array} Serialized NSEC3 record
         */
        serialize(rdata) {
            const saltBytes = fromHex(rdata.salt);
            const hashBytes = fromHex(rdata.nextHashedOwnerName);

            const header = new Uint8Array(5 + saltBytes.length + 1 + hashBytes.length);
            const view = new DataView(header.buffer);
            view.setUint8(0, rdata.algorithm);
            view.setUint8(1, rdata.flags);
            view.setUint16(2, rdata.iterations, false);
            view.setUint8(4, saltBytes.length);
            header.set(saltBytes, 5);
            view.setUint8(5 + saltBytes.length, hashBytes.length);
            header.set(hashBytes, 6 + saltBytes.length);

            return concatBytes(header, encodeTypeBitmaps(rdata?.typeBitmaps || []));
        }
    }

    static NSEC3PARAM = {
        deserialize(view, offset, dataLength) {
            const algorithm = view.getUint8(offset);
            const flags = view.getUint8(offset + 1);
            const iterations = view.getUint16(offset + 2);
            const saltLength = view.getUint8(offset + 4);
            const salt = saltLength > 0 ? toHex(readRange(view, offset + 5, offset + 5 + saltLength)) : "";

            return { algorithm: algorithm, flags: flags, iterations: iterations, salt: salt };
        },
        serialize(rdata) {
            const algorithm = rdata.algorithm;
            const flags = rdata.flags;
            const iterations = rdata.iterations;
            const salt = rdata.salt;
            const saltBytes = salt ? fromHex(salt) : new Uint8Array(0);

            const buffer = new ArrayBuffer(5 + saltBytes.length);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint8(offset, algorithm);
            offset++;
            view.setUint8(offset, flags);
            offset++;
            view.setUint16(offset, iterations, false);
            offset += 2;
            view.setUint8(offset, saltBytes.length);
            offset++;
            saltBytes.forEach((byte) => view.setUint8(offset++, byte));

            return new Uint8Array(buffer);
        }
    }

    static CSYNC = {
        /**
         * @param {DataView} view - DataView containing the record
         * @param {number} offset - Starting offset
         * @param {number} dataLength - Length of the record data
         * @returns {Object} Deserialized CSYNC record data
         */
        deserialize(view, offset, dataLength) {
            return {
                serial: view.getUint32(offset),
                flags: view.getUint16(offset + 4),
                typeBitmaps: decodeTypeBitmaps(view, offset + 6, offset + dataLength)
            };
        },
        /**
         * @param {Object} rdata - Record data to serialize
         * @returns {Uint8Array} Serialized CSYNC record
         */
        serialize(rdata) {
            const header = new Uint8Array(6);
            const view = new DataView(header.buffer);
            view.setUint32(0, rdata.serial, false);
            view.setUint16(4, rdata.flags, false);
            return concatBytes(header, encodeTypeBitmaps(rdata?.typeBitmaps || []));
        }
    }

    static ZONEMD = {
        deserialize(view, offset, dataLength) {
            const serial = view.getUint32(offset);
            const scheme = view.getUint8(offset + 4);
            const algorithm = view.getUint8(offset + 5);
            const digest = toHex(readRange(view, offset + 6, offset + dataLength));

            return { serial: serial, scheme: scheme, algorithm: algorithm, digest: digest };
        },
        serialize(rdata) {
            const serial = rdata.serial;
            const scheme = rdata.scheme;
            const algorithm = rdata.algorithm;
            const digest = rdata.digest;
            const digestBytes = fromHex(digest);

            const buffer = new ArrayBuffer(6 + digestBytes.length);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint32(offset, serial, false);
            offset += 4;
            view.setUint8(offset, scheme);
            offset++;
            view.setUint8(offset, algorithm);
            offset++;
            digestBytes.forEach((byte) => view.setUint8(offset++, byte));

            return new Uint8Array(buffer);
        }
    }

    static TKEY = {
        deserialize(view, offset, dataLength) {
            const algorithm = DnsNameSerializer.deserialize(view, offset);
            offset = algorithm.offset;
            const inception = view.getUint32(offset);
            const expiration = view.getUint32(offset + 4);
            const mode = view.getUint16(offset + 8);
            const error = view.getUint16(offset + 10);
            const keyLength = view.getUint16(offset + 12);
            const key = keyLength > 0 ? toBase64(readRange(view, offset + 14, offset + 14 + keyLength)) : "";
            const otherLength = view.getUint16(offset + 14 + keyLength);
            const other = otherLength > 0 ? toBase64(readRange(view, offset + 16 + keyLength, offset + 16 + keyLength + otherLength)) : "";

            return { algorithm: algorithm.name, inception: new Date(inception * 1000), expiration: new Date(expiration * 1000), mode: mode, error: error, key: key, other: other };
        },
        serialize(rdata) {
            const algorithm = rdata.algorithm;
            const inception = Math.floor(rdata.inception.getTime() / 1000);
            const expiration = Math.floor(rdata.expiration.getTime() / 1000);
            const mode = rdata.mode;
            const error = rdata.error;
            const key = rdata.key;
            const other = rdata.other;

            const algorithmBytes = DnsNameSerializer.serialize(algorithm);
            const keyBytes = key ? fromBase64(key) : new Uint8Array(0);
            const otherBytes = other ? fromBase64(other) : new Uint8Array(0);

            const length = algorithmBytes.length + 16 + keyBytes.length + otherBytes.length;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;

            algorithmBytes.forEach((byte) => view.setUint8(offset++, byte));
            view.setUint32(offset, inception, false);
            offset += 4;
            view.setUint32(offset, expiration, false);
            offset += 4;
            view.setUint16(offset, mode, false);
            offset += 2;
            view.setUint16(offset, error, false);
            offset += 2;
            view.setUint16(offset, keyBytes.length, false);
            offset += 2;
            keyBytes.forEach((byte) => view.setUint8(offset++, byte));
            view.setUint16(offset, otherBytes.length, false);
            offset += 2;
            otherBytes.forEach((byte) => view.setUint8(offset++, byte));

            return new Uint8Array(buffer);
        }
    }

    /**
     * OPT pseudo-record (EDNS(0) - RFC 6891) serializer.
     *
     * The rdata is a list of {code, data} options. Note that an OPT record
     * repurposes the class field as the requestor's UDP payload size and the TTL
     * field as the extended rcode and flags; those live on the record itself.
     * @static
     */
    static OPT = {
        /**
         * @param {DataView} view - DataView containing the record
         * @param {number} offset - Starting offset
         * @param {number} dataLength - Length of the record data
         * @returns {Object} Deserialized EDNS(0) options
         */
        deserialize(view, offset, dataLength) {
            const end = offset + dataLength;
            const options = [];
            while (offset + 4 <= end) {
                const code = view.getUint16(offset);
                const optionLength = view.getUint16(offset + 2);
                offset += 4;
                if (offset + optionLength > end) {
                    throw new Error("Truncated EDNS(0) option.");
                }
                options.push({code, data: toHex(readBytes(view, offset, optionLength))});
                offset += optionLength;
            }
            return { options };
        },
        /**
         * @param {Object} rdata - Record data to serialize
         * @returns {Uint8Array} Serialized EDNS(0) options
         */
        serialize(rdata) {
            const blocks = (rdata?.options || []).map(option => {
                const data = fromHex(option.data || "");
                const header = new Uint8Array(4);
                const view = new DataView(header.buffer);
                view.setUint16(0, option.code, false);
                view.setUint16(2, data.length, false);
                return concatBytes(header, data);
            });
            return concatBytes(...blocks);
        }
    }

    /**
     * KX Record (Key Exchanger - RFC 2230) serializer
     * @static
     */
    static KX = {
        deserialize(view, offset) {
            const preference = view.getUint16(offset);
            const exchanger = DnsNameSerializer.deserialize(view, offset + 2);
            return { preference, exchanger: exchanger.name };
        },
        serialize(rdata) {
            const header = new Uint8Array(2);
            new DataView(header.buffer).setUint16(0, rdata.preference, false);
            return concatBytes(header, DnsNameSerializer.serialize(rdata.exchanger));
        }
    }

    /**
     * X25 Record (X.25 PSDN address - RFC 1183) serializer
     * @static
     */
    static X25 = {
        deserialize(view, offset, dataLength) {
            return { address: decodeCharacterStrings(view, offset, offset + dataLength) };
        },
        serialize(rdata) {
            return encodeCharacterStrings(rdata.address);
        }
    }

    /**
     * NID Record (Node Identifier - RFC 6742) serializer
     * @static
     */
    static NID = {
        deserialize(view, offset, dataLength) {
            expectDataLength("NID", dataLength, 10);
            return { preference: view.getUint16(offset), nodeId: toHex(readBytes(view, offset + 2, 8)) };
        },
        serialize(rdata) {
            const header = new Uint8Array(2);
            new DataView(header.buffer).setUint16(0, rdata.preference, false);
            const value = fromHex(rdata.nodeId);
            expectDataLength("NID", 2 + value.length, 10);
            return concatBytes(header, value);
        }
    }

    /**
     * L32 Record (32-bit Locator - RFC 6742) serializer
     * @static
     */
    static L32 = {
        deserialize(view, offset, dataLength) {
            expectDataLength("L32", dataLength, 6);
            return { preference: view.getUint16(offset), locator32: formatIPv4(readBytes(view, offset + 2, 4)) };
        },
        serialize(rdata) {
            const header = new Uint8Array(2);
            new DataView(header.buffer).setUint16(0, rdata.preference, false);
            return concatBytes(header, parseIPv4(rdata.locator32));
        }
    }

    /**
     * L64 Record (64-bit Locator - RFC 6742) serializer
     * @static
     */
    static L64 = {
        deserialize(view, offset, dataLength) {
            expectDataLength("L64", dataLength, 10);
            return { preference: view.getUint16(offset), locator64: toHex(readBytes(view, offset + 2, 8)) };
        },
        serialize(rdata) {
            const header = new Uint8Array(2);
            new DataView(header.buffer).setUint16(0, rdata.preference, false);
            const value = fromHex(rdata.locator64);
            expectDataLength("L64", 2 + value.length, 10);
            return concatBytes(header, value);
        }
    }

    /**
     * LP Record (Locator Pointer - RFC 6742) serializer
     * @static
     */
    static LP = {
        deserialize(view, offset) {
            const preference = view.getUint16(offset);
            const fqdn = DnsNameSerializer.deserialize(view, offset + 2);
            return { preference, fqdn: fqdn.name };
        },
        serialize(rdata) {
            const header = new Uint8Array(2);
            new DataView(header.buffer).setUint16(0, rdata.preference, false);
            return concatBytes(header, DnsNameSerializer.serialize(rdata.fqdn));
        }
    }

    /**
     * EUI48 Record (48-bit MAC address - RFC 7043) serializer
     * @static
     */
    static EUI48 = {
        deserialize(view, offset, dataLength) {
            expectDataLength("EUI48", dataLength, 6);
            return { address: Array.from(readBytes(view, offset, 6)).map(b => b.toString(16).padStart(2, "0")).join("-") };
        },
        serialize(rdata) {
            const bytes = fromHex(String(rdata.address).replace(/-/g, ""));
            expectDataLength("EUI48", bytes.length, 6);
            return bytes;
        }
    }

    /**
     * EUI64 Record (64-bit MAC address - RFC 7043) serializer
     * @static
     */
    static EUI64 = {
        deserialize(view, offset, dataLength) {
            expectDataLength("EUI64", dataLength, 8);
            return { address: Array.from(readBytes(view, offset, 8)).map(b => b.toString(16).padStart(2, "0")).join("-") };
        },
        serialize(rdata) {
            const bytes = fromHex(String(rdata.address).replace(/-/g, ""));
            expectDataLength("EUI64", bytes.length, 8);
            return bytes;
        }
    }
}

// Functions
/**
 * Supported TSIG algorithms and the WebCrypto hash they map to (RFC 8945 §6).
 * @type {Readonly<Object<string, string>>}
 */
export const TSIG_ALGORITHMS = Object.freeze({
    "hmac-sha1": "SHA-1",
    "hmac-sha256": "SHA-256",
    "hmac-sha384": "SHA-384",
    "hmac-sha512": "SHA-512"
});

/**
 * Signs a DNS message with TSIG (Transaction Signature - RFC 2845 / RFC 8945).
 *
 * The MAC is computed over the message in the form it will be sent — before the
 * TSIG record is appended and before ARCOUNT is incremented — followed by the
 * TSIG variables of RFC 2845 §3.4.2. Those variables deliberately exclude the
 * record type and the original message ID.
 * @async
 * @param {QueryMessage|UpdateMessage} message - DNS message to sign
 * @param {string} name - TSIG key name
 * @param {string} secret - Base64-encoded shared secret
 * @param {Object} [options] - Signing options
 * @param {string} [options.algorithm="hmac-sha256"] - TSIG algorithm name
 * @param {number} [options.fudge=300] - Permitted clock skew in seconds
 * @param {bigint} [options.timestamp] - Signing time as seconds since the epoch
 * @returns {Promise<QueryMessage|UpdateMessage>} Signed DNS message with TSIG record
 * @throws {Error} If the algorithm is unsupported or signing fails
 */
export async function sign(message, name, secret, options = {}) {
    // RFC 2845 §3.4.2 hashes the key and algorithm names in canonical form, which
    // is all lower case; a mixed-case name would produce a MAC servers reject.
    const algorithm = String(options.algorithm ?? "hmac-sha256").toLowerCase();
    const keyName = String(name).toLowerCase();
    const hash = TSIG_ALGORITHMS[algorithm];
    if (hash === undefined) {
        throw new Error(`Unsupported TSIG algorithm "${algorithm}". Supported: ${Object.keys(TSIG_ALGORITHMS).join(", ")}.`);
    }

    const tsig = new Record(
        keyName,
        TYPE.TSIG,
        CLAZZ.ANY,
        0,
        {
            algorithm,
            timestamp: options.timestamp ?? BigInt(Math.floor(Date.now() / 1000)),
            fudge: options.fudge ?? 300,
            mac: new Uint8Array(0),
            originalId: message.id,
            error: 0,
            otherData: new Uint8Array(0)
        }
    );

    const messageBytes = DnsSerializer.serialize(message);
    const nameBytes = DnsNameSerializer.serialize(keyName);
    const algorithmBytes = DnsNameSerializer.serialize(algorithm);
    const timestampHigh = Number((tsig.data.timestamp >> 32n) & 0xFFFFn);
    const timestampLow = Number(tsig.data.timestamp & 0xFFFFFFFFn);
    const secretBytes = fromBase64(secret);

    // Fixed TSIG variables: class (2) + ttl (4) + time signed (6) + fudge (2)
    // + error (2) + other len (2).
    const TSIG_VARIABLES_SIZE = 18;
    const variables = new Uint8Array(nameBytes.byteLength + algorithmBytes.byteLength + TSIG_VARIABLES_SIZE + tsig.data.otherData.byteLength);
    const view = new DataView(variables.buffer);
    let offset = 0;

    variables.set(nameBytes, offset);
    offset += nameBytes.byteLength;
    view.setUint16(offset, tsig.clazz, false);
    offset += 2;
    view.setUint32(offset, tsig.ttl, false);
    offset += 4;
    variables.set(algorithmBytes, offset);
    offset += algorithmBytes.byteLength;
    view.setUint16(offset, timestampHigh, false);
    offset += 2;
    view.setUint32(offset, timestampLow, false);
    offset += 4;
    view.setUint16(offset, tsig.data.fudge, false);
    offset += 2;
    view.setUint16(offset, tsig.data.error, false);
    offset += 2;
    view.setUint16(offset, tsig.data.otherData.byteLength, false);
    offset += 2;
    variables.set(tsig.data.otherData, offset);

    const key = await crypto.subtle.importKey(
        "raw",
        secretBytes,
        {name: "HMAC", hash},
        false,
        ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, concatBytes(messageBytes, variables));

    tsig.data.mac = new Uint8Array(sig);
    message.additionals.push(tsig);
    // The section counts are getters derived from the arrays, so there is nothing
    // to update here — assigning to them would throw in strict mode.
    return message;
}

/**
 * Interprets numeric DNS values to human-readable strings
 * Converts type/class numbers to names (e.g., 1 -> "A", "IN")
 * @param {QueryMessage|UpdateMessage} message - DNS message to interpret
 * @returns {QueryMessage|UpdateMessage} Message with interpreted values
 */
export function interpret(message) {
    switch (message.flags.opcode) {
        case OPCODE.QUERY:
            message.questions.forEach(record => {
                record.clazz = CLASS_NAMES[record.clazz] || record.clazz;
                record.type  = TYPE_NAMES[record.type] || record.type;
            });
            message.answers.forEach(record => {
                record.clazz = CLASS_NAMES[record.clazz] || record.clazz;
                record.type  = TYPE_NAMES[record.type] || record.type;
            });
            message.authorities.forEach(record => {
                record.clazz = CLASS_NAMES[record.clazz] || record.clazz;
                record.type  = TYPE_NAMES[record.type] || record.type;
            });
            message.additionals.forEach(record => {
                record.clazz = CLASS_NAMES[record.clazz] || record.clazz;
                record.type  = TYPE_NAMES[record.type] || record.type;
            });
            break;
        case OPCODE.UPDATE:
            message.zones.forEach(record => {
                record.clazz = CLASS_NAMES[record.clazz] || record.clazz;
                record.type  = TYPE_NAMES[record.type] || record.type;
            });
            message.prerequisites.forEach(record => {
                record.clazz = CLASS_NAMES[record.clazz] || record.clazz;
                record.type  = TYPE_NAMES[record.type] || record.type;
            });
            message.updates.forEach(record => {
                record.clazz = CLASS_NAMES[record.clazz] || record.clazz;
                record.type  = TYPE_NAMES[record.type] || record.type;
            });
            message.additionals.forEach(record => {
                record.clazz = CLASS_NAMES[record.clazz] || record.clazz;
                record.type  = TYPE_NAMES[record.type] || record.type;
            });
            break;
    }
    message.flags.qr = QR_NAMES[message.flags.qr];
    message.flags.opcode = OPCODE_NAMES[message.flags.opcode];
    message.flags.rcode  = RCODE_NAMES[message.flags.rcode];
    return message;
}

/**
 * Sends a DNS query over HTTPS (DoH - RFC 8484)
 * @async
 * @param {string} url - DNS-over-HTTPS server URL
 * @param {QueryMessage|UpdateMessage} message - DNS message to send
 * @param {boolean|Object} [options=false] - Options, or a boolean for `interpreted` alone
 * @param {boolean} [options.interpreted=false] - Whether to interpret numeric values as strings
 * @param {number} [options.timeout] - Abort the request after this many milliseconds
 * @param {AbortSignal} [options.signal] - Signal to abort the request
 * @param {Object} [options.headers] - Additional request headers
 * @returns {Promise<DNSQueryResult>} Query result with latency
 * @throws {Error} If the request fails, times out or the response is not a DNS message
 */
export async function query(url, message, options = false) {
    // A boolean third argument is still accepted for backwards compatibility.
    const {interpreted = false, timeout, signal, headers} = typeof options === "boolean"
        ? {interpreted: options}
        : options;

    const controller = new AbortController();
    const abort = () => controller.abort(signal?.reason);
    if (signal) {
        if (signal.aborted) {
            abort();
        } else {
            signal.addEventListener("abort", abort, {once: true});
        }
    }
    const timer = timeout === undefined
        ? undefined
        : setTimeout(() => controller.abort(new Error(`DNS query to ${url} timed out after ${timeout} ms.`)), timeout);

    const body = DnsSerializer.serialize(message);
    const start = performance.now();
    let response;
    try {
        response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/dns-message",
                "Accept": "application/dns-message",
                ...headers
            },
            body,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
    }
    const end = performance.now();

    if (!response.ok) {
        throw new Error(`DNS query request failed with status: ${response.status} - ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    let result = DnsSerializer.deserialize(buffer);
    const latency = Math.round(end - start);
    if (interpreted) {
        result = interpret(result);
    }
    return {result, latency};
}

// ---------------------------------------------------------------------------
// High-level convenience API
// ---------------------------------------------------------------------------

/**
 * Resolves a DNS type name (e.g. "A", "AAAA", "MX") or numeric code to a
 * numeric TYPE value. Throws on unknown names.
 */
function resolveTypeCode(type) {
    if (typeof type === "number") return type;
    if (typeof type === "string") {
        const upper = type.toUpperCase();
        // "TYPE<n>" is how unnamed codes are reported, e.g. in NSEC type bitmaps.
        const code = TYPE[upper] ?? (/^TYPE\d+$/.test(upper) ? Number(upper.slice(4)) : undefined);
        if (code === undefined) {
            throw new Error(`Unknown DNS record type: ${type}`);
        }
        return code;
    }
    throw new TypeError("Type must be a string or a number.");
}

function resolveClassCode(clazz) {
    if (typeof clazz === "number") return clazz;
    if (typeof clazz === "string") {
        const code = CLAZZ[clazz.toUpperCase()];
        if (code === undefined) {
            throw new Error(`Unknown DNS class: ${clazz}`);
        }
        return code;
    }
    throw new TypeError("Class must be a string or a number.");
}

/**
 * Returns a user-friendly view of a single record. The internal record is not
 * mutated.
 */
function recordToObject(record) {
    return {
        name: record.name,
        type: TYPE_NAMES[record.type] ?? record.type,
        class: CLASS_NAMES[record.clazz] ?? record.clazz,
        ttl: record.ttl,
        data: record.data
    };
}

function questionToObject(question) {
    return {
        name: question.name,
        type: TYPE_NAMES[question.type] ?? question.type,
        class: CLASS_NAMES[question.clazz] ?? question.clazz
    };
}

/**
 * Builds the reverse-DNS name (.in-addr.arpa / .ip6.arpa) for an IPv4 or IPv6
 * address.
 */
function buildReverseName(ip) {
    if (typeof ip !== "string" || ip.length === 0) {
        throw new TypeError("ip must be a non-empty string.");
    }
    if (ip.includes(":")) {
        // IPv6 - expand and reverse nibbles.
        const parts = ip.split(":");
        const expanded = [];
        let skipped = false;
        for (const part of parts) {
            if (part === "" && !skipped) {
                expanded.push(...Array(8 - parts.length + 1).fill("0"));
                skipped = true;
            } else if (part !== "") {
                expanded.push(part);
            }
        }
        // Pad each group to 4 hex digits.
        const hex = expanded.map(p => p.padStart(4, "0")).join("");
        if (hex.length !== 32) {
            throw new Error(`Invalid IPv6 address: ${ip}`);
        }
        return hex.split("").reverse().join(".") + ".ip6.arpa";
    }
    // IPv4
    const octets = ip.split(".");
    if (octets.length !== 4 || octets.some(o => !/^\d+$/.test(o) || Number(o) > 255)) {
        throw new Error(`Invalid IPv4 address: ${ip}`);
    }
    return octets.slice().reverse().join(".") + ".in-addr.arpa";
}

/**
 * Fluent builder for RFC 2136 dynamic DNS UPDATE messages.
 *
 * Obtain an instance via `client.update(zone)`. After populating it with
 * `add`, `delete`, `replace`, `requirePresent` or `requireAbsent` calls send
 * it via `await builder.send()` (optionally signed with TSIG).
 */
export class UpdateBuilder {
    constructor(client, zone) {
        if (!zone || typeof zone !== "string") {
            throw new TypeError("Zone must be a non-empty string.");
        }
        this._client = client;
        this._message = new UpdateMessage();
        this._message.zones.push(new Zone(zone, TYPE.SOA, CLAZZ.IN));
    }

    /**
     * Adds an RR to the zone.
     * @param {string} name The owner name (FQDN or relative — relative names
     *   are NOT auto-qualified, callers should pass FQDNs).
     * @param {string|number} type The RR type (e.g. "A").
     * @param {object} data The rdata as a plain object (e.g. `{ipv4: "1.2.3.4"}`).
     * @param {number} [ttl=300] TTL in seconds.
     */
    add(name, type, data, ttl = 300) {
        const record = new Record(name, resolveTypeCode(type), CLAZZ.IN, ttl);
        record.data = data;
        this._message.updates.push(record);
        return this;
    }

    /**
     * Deletes records. Behaviour follows RFC 2136 section 2.5:
     *   - delete(name)            -> delete all RRsets at name
     *   - delete(name, type)      -> delete the entire RRset of that type
     *   - delete(name, type, data)-> delete a specific RR
     */
    delete(name, type, data) {
        let record;
        if (type === undefined) {
            // Delete all RRsets at name.
            record = new Record(name, TYPE.ANY, CLAZZ.ANY, 0);
            record.data = new Uint8Array(0);
        } else if (data === undefined) {
            // Delete the RRset of the given type at name.
            record = new Record(name, resolveTypeCode(type), CLAZZ.ANY, 0);
            record.data = new Uint8Array(0);
        } else {
            // Delete a specific RR.
            record = new Record(name, resolveTypeCode(type), CLAZZ.NONE, 0);
            record.data = data;
        }
        this._message.updates.push(record);
        return this;
    }

    /**
     * Replaces an RRset: deletes the existing RRset of that type and adds the
     * new RR(s) atomically within the same UPDATE message.
     */
    replace(name, type, data, ttl = 300) {
        this.delete(name, type);
        this.add(name, type, data, ttl);
        return this;
    }

    /**
     * Prerequisite: at least one RR with the given name (and optionally type)
     * MUST exist (RFC 2136 section 2.4.1 / 2.4.2).
     */
    requirePresent(name, type) {
        const record = new Record(
            name,
            type === undefined ? TYPE.ANY : resolveTypeCode(type),
            CLAZZ.ANY,
            0
        );
        record.data = new Uint8Array(0);
        this._message.prerequisites.push(record);
        return this;
    }

    /**
     * Prerequisite: NO RR with the given name (and optionally type) MUST
     * exist (RFC 2136 section 2.4.3 / 2.4.4).
     */
    requireAbsent(name, type) {
        const record = new Record(
            name,
            type === undefined ? TYPE.ANY : resolveTypeCode(type),
            CLAZZ.NONE,
            0
        );
        record.data = new Uint8Array(0);
        this._message.prerequisites.push(record);
        return this;
    }

    /**
     * Sends the UPDATE to the server.
     * @param {object} [options]
     * @param {{name: string, secret: string}} [options.tsig] TSIG credentials.
     *   When provided the message is signed before being sent.
     * @returns {Promise<{result: object, latency: number}>}
     */
    async send(options = {}) {
        let message = this._message;
        if (options.tsig) {
            message = await sign(message, options.tsig.name, options.tsig.secret);
        }
        const { result, latency } = await query(this._client.serverUrl, message);
        return { result: this._client._formatMessage(result), latency };
    }

    /** Returns the underlying low-level UpdateMessage. */
    toMessage() {
        return this._message;
    }
}

/**
 * High-level DNS-over-HTTPS client.
 *
 * @example
 *   const client = new DnsClient("https://cloudflare-dns.com/dns-query");
 *   const res = await client.resolve("example.com", "A");
 *   //   res.answers[0].data.ipv4 === "93.184.216.34"
 */
export class DnsClient {
    /**
     * @param {string} serverUrl The DoH endpoint URL (mandatory).
     */
    constructor(serverUrl) {
        if (!serverUrl || typeof serverUrl !== "string") {
            throw new TypeError("serverUrl is required and must be a string.");
        }
        this.serverUrl = serverUrl;
    }

    /**
     * Performs a forward DNS lookup.
     *
     * @param {string} name The domain name to resolve.
     * @param {string|number} [type="A"] The record type (e.g. "A", "AAAA", "MX").
     * @returns {Promise<{question: object, answers: object[], authorities: object[], additionals: object[], rcode: string, latency: number}>}
     */
    async resolve(name, type = "A") {
        if (!name || typeof name !== "string") {
            throw new TypeError("name must be a non-empty string.");
        }
        const message = new QueryMessage();
        message.questions.push(new Question(name, resolveTypeCode(type), CLAZZ.IN));
        const { result, latency } = await query(this.serverUrl, message);
        return { ...this._formatMessage(result), latency };
    }

    /**
     * Performs a reverse DNS lookup (PTR query against in-addr.arpa / ip6.arpa).
     *
     * @param {string} ip An IPv4 or IPv6 address.
     * @returns {Promise<{question: object, answers: object[], authorities: object[], additionals: object[], rcode: string, latency: number}>}
     */
    async reverse(ip) {
        return this.resolve(buildReverseName(ip), TYPE.PTR);
    }

    /**
     * Starts building an RFC 2136 dynamic DNS UPDATE message for the given
     * zone. Returns an `UpdateBuilder`; populate it and call `await
     * builder.send({tsig?})`.
     */
    update(zone) {
        return new UpdateBuilder(this, zone);
    }

    /** Internal helper to format a message returned by the low-level layer. */
    _formatMessage(message) {
        if (message instanceof QueryMessage) {
            return {
                id: message.id,
                rcode: RCODE_NAMES[message.flags.rcode] ?? message.flags.rcode,
                question: message.questions[0] ? questionToObject(message.questions[0]) : null,
                questions: message.questions.map(questionToObject),
                answers: message.answers.map(recordToObject),
                authorities: message.authorities.map(recordToObject),
                additionals: message.additionals.map(recordToObject)
            };
        }
        if (message instanceof UpdateMessage) {
            return {
                id: message.id,
                rcode: RCODE_NAMES[message.flags.rcode] ?? message.flags.rcode,
                zones: message.zones.map(questionToObject),
                prerequisites: message.prerequisites.map(recordToObject),
                updates: message.updates.map(recordToObject),
                additionals: message.additionals.map(recordToObject)
            };
        }
        return message;
    }
}
