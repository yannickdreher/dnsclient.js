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
 * @property {boolean} ad - Authentic Data flag (DNSSEC validated, RFC 4035)
 * @property {boolean} cd - Checking Disabled flag (RFC 4035)
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

// Codes above 15 do not fit the 4-bit header field; they only appear as the
// extended rcode of an OPT record or in the error field of TSIG/TKEY.
export const RCODE_NAMES = Object.freeze({
    0: "NOERROR",     // DNS Query completed successfully
    1: "FORMERR",     // DNS Query Format Error
    2: "SERVFAIL",    // Server failed to complete the DNS request
    3: "NXDOMAIN",    // Domain name does not exist
    4: "NOTIMP",      // Function not implemented
    5: "REFUSED",     // The server refused to answer for the query
    6: "YXDOMAIN",    // Name that should not exist, does exist
    7: "YXRRSET",     // RRset that should not exist, does exist
    8: "NXRRSET",     // RRset that should exist, does not exist
    9: "NOTAUTH",     // Server not authoritative for the zone / not authorized
    10: "NOTZONE",    // Name not in zone
    11: "DSOTYPENI",  // DSO-TYPE not implemented
    16: "BADVERS",    // Bad OPT Version (BADSIG in a TSIG error field)
    17: "BADKEY",     // Key not recognized
    18: "BADTIME",    // Signature out of time window
    19: "BADMODE",    // Bad TKEY Mode
    20: "BADNAME",    // Duplicate key name
    21: "BADALG",     // Algorithm not supported
    22: "BADTRUNC",   // Bad truncation
    23: "BADCOOKIE"   // Bad/missing server cookie
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
/** Highest message offset a 14-bit compression pointer can address */
const MAX_POINTER_OFFSET = 0x3fff;

/** Opcodes whose messages use the question/answer/authority/additional layout */
const QUERY_LAYOUT_OPCODES = new Set([OPCODE.QUERY, OPCODE.NOTIFY]);
const QUERY_SECTIONS = Object.freeze(["questions", "answers", "authorities", "additionals"]);
const UPDATE_SECTIONS = Object.freeze(["zones", "prerequisites", "updates", "additionals"]);

/**
 * Record types whose rdata names may be compressed: the well-known types of
 * RFC 1035. Every other type MUST be sent uncompressed (RFC 3597 §4).
 */
const COMPRESSIBLE_TYPES = new Set([
    TYPE.NS, TYPE.MD, TYPE.MF, TYPE.CNAME, TYPE.SOA, TYPE.MB,
    TYPE.MG, TYPE.MR, TYPE.PTR, TYPE.MINFO, TYPE.MX
]);

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
 * Encodes bytes as unpadded base64url, the form RFC 8484 §4.1 uses for the
 * "dns" parameter of a GET request.
 * @param {Uint8Array} bytes - Bytes to encode
 * @returns {string} Base64url representation
 */
function toBase64Url(bytes) {
    return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
        bytes[i] = parseInt(value.slice(i * 2, i * 2 + 2), 16);
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
 * Encodes a value as a 16-bit big-endian integer.
 * @param {number} value - Value to encode
 * @returns {Uint8Array} 2 bytes
 */
function uint16Bytes(value) {
    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, value, false);
    return bytes;
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
 * Verifies that decoding a record's fields consumed exactly its rdata. Codecs
 * can also be called without a length, in which case there is nothing to check.
 * @param {number} end - Offset one past the last decoded field
 * @param {number} offset - Offset of the rdata
 * @param {number} [dataLength] - RDLENGTH of the record
 * @throws {Error} If the fields do not fill the rdata exactly
 */
function expectRDataEnd(end, offset, dataLength) {
    if (dataLength !== undefined && end !== offset + dataLength) {
        throw new Error(`Record data is ${dataLength} bytes long, but its fields take ${end - offset}.`);
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
    // The URL parser treats these as delimiters and would silently drop part of
    // the label, e.g. "ü@evil" has the host "evil".
    if (/[\s/\\?#@:%[\]]/.test(label)) {
        throw new Error(`Label "${label}" cannot be converted to an IDNA A-label.`);
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

/**
 * Encodes a single DNS character-string (RFC 1035 §3.3): a length byte followed
 * by at most 255 bytes.
 * @param {string} value - Text to encode
 * @param {string} field - Field name, for the error message
 * @returns {Uint8Array} Length-prefixed character-string
 * @throws {Error} If the text is longer than 255 bytes
 */
function encodeCharacterString(value, field) {
    const bytes = textEncoder.encode(value ?? "");
    if (bytes.length > 255) {
        throw new Error(`${field} is ${bytes.length} bytes long, but a character-string holds at most 255.`);
    }
    return concatBytes(new Uint8Array([bytes.length]), bytes);
}

/**
 * Reads a single DNS character-string.
 * @param {DataView} view - DataView to read from
 * @param {number} offset - Offset of the length byte
 * @returns {{text: string, offset: number}} Decoded text and the offset after it
 */
function decodeCharacterString(view, offset) {
    const length = view.getUint8(offset);
    return { text: readText(view, offset + 1, length), offset: offset + 1 + length };
}

/**
 * Returns the names of a message's four sections in wire order.
 * @param {number} opcode - Numeric opcode
 * @returns {ReadonlyArray<string>} Section property names
 * @throws {Error} If the opcode has no supported layout
 */
function sectionNames(opcode) {
    if (QUERY_LAYOUT_OPCODES.has(opcode)) {
        return QUERY_SECTIONS;
    }
    if (opcode === OPCODE.UPDATE) {
        return UPDATE_SECTIONS;
    }
    throw new Error(`Unsupported DNS opcode ${opcode} (${OPCODE_NAMES[opcode] || "unknown"}).`);
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
        ad: false,
        cd: false,
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
        return sectionNames(resolveOpcodeCode(message.flags.opcode))
            .map((name, index) => ({records: message[name], question: index === 0}));
    }

    /**
     * Computes the exact buffer size a DNS message needs in wire format.
     *
     * The size is derived from the actual serialized bytes rather than
     * estimated, so records with large rdata (DNSKEY, RRSIG, TSIG, ...) and
     * compressed names are always accounted for exactly.
     * @static
     * @param {QueryMessage|UpdateMessage} message - DNS message to measure
     * @param {Object} [options] - Serialization options, see serialize()
     * @returns {number} Required buffer size in bytes
     */
    static estimateMessageSize(message, options) {
        return this.serialize(message, options).byteLength;
    }

    /**
     * Deserializes a DNS message from binary buffer
     * @static
     * @param {ArrayBuffer|ArrayBufferView} buffer - Binary DNS message
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
        const flags = this.HeaderFlags.deserialize(view.getUint16(2));
        const sections = sectionNames(flags.opcode);
        const update = flags.opcode === OPCODE.UPDATE;
        const message = update ? new UpdateMessage() : new QueryMessage();
        message.id = view.getUint16(0);
        message.flags = flags;

        let offset = DNS_HEADER_SIZE;
        sections.forEach((section, index) => {
            const count = view.getUint16(4 + index * 2);
            // The first section holds questions (zones in an UPDATE), which
            // carry neither a TTL nor rdata.
            const question = index === 0 && !update;
            const zone = index === 0 && update;
            for (let i = 0; i < count; i++) {
                const record = DnsRecordSerializer.deserialize(view, offset, question, zone);
                offset = record.offset;
                message[section].push(record.record);
            }
        });
        return message;
    }

    /**
     * Serializes a DNS message to binary buffer
     * @static
     * @param {QueryMessage|UpdateMessage} message - DNS message to serialize
     * @param {Object} [options] - Serialization options
     * @param {boolean} [options.compress=true] - Replace repeated names by
     *   compression pointers (RFC 1035 §4.1.4)
     * @returns {Uint8Array} Binary DNS message
     * @throws {Error} If message is invalid
     */
    static serialize(message, {compress = true} = {}) {
        const sections = this.sections(message);
        const header = new Uint8Array(DNS_HEADER_SIZE);
        const view = new DataView(header.buffer);
        view.setUint16(0, message.id, false);
        this.HeaderFlags.serialize(view, 2, {
            ...message.flags,
            opcode: resolveOpcodeCode(message.flags.opcode),
            qr: typeof message.flags.qr === "number" ? message.flags.qr : (message.flags.qr === "RESPONSE" ? 1 : 0),
            rcode: typeof message.flags.rcode === "number" ? message.flags.rcode : (RCODE_BY_NAME[message.flags.rcode] ?? 0)
        });
        sections.forEach((section, index) => view.setUint16(4 + index * 2, section.records.length, false));

        // Records are encoded in wire order, because a compressed name can only
        // point at names that precede it.
        const compressor = compress ? new NameCompressor() : null;
        const parts = [header];
        let offset = DNS_HEADER_SIZE;
        for (const section of sections) {
            for (const record of section.records) {
                const bytes = DnsRecordSerializer.toBytes(record, section.question, compressor, offset);
                parts.push(bytes);
                offset += bytes.byteLength;
            }
        }
        return concatBytes(...parts);
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
            const ad = !!((buffer >> 5) & 1);
            const cd = !!((buffer >> 4) & 1);
            const rcode = buffer & 0xF;
            return {qr, opcode, aa, tc, rd, ra, ad, cd, rcode};
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
                ((flags.ad & 1) << 5) |
                ((flags.cd & 1) << 4) |
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
     * Splits a domain name into the ASCII labels it has on the wire.
     *
     * Labels containing non-ASCII characters are converted to their IDNA A-label
     * form; pure ASCII labels are kept byte-for-byte, preserving their case.
     * @static
     * @param {string} name - Domain name (e.g., "example.com")
     * @returns {Array<string>} ASCII labels, empty for the root name
     * @throws {Error} If a label is empty or the name exceeds the size limits
     */
    static labels(name) {
        if (name === "." || name === "") {
            return [];
        }
        if (typeof name !== "string") {
            throw new Error(`DNS name must be a string, got ${name === null ? "null" : typeof name}.`);
        }

        const labels = name.split(".");
        if (labels[labels.length - 1] === "") {
            labels.pop();
        }

        const ascii = labels.map(label => {
            // Convert first: the A-label is what the length limit applies to.
            const converted = labelToASCII(label);
            if (converted.length === 0) {
                throw new Error(`Empty label in DNS name "${name}".`);
            }
            if (converted.length > MAX_LABEL_LENGTH) {
                throw new Error(`Label "${label}" exceeds ${MAX_LABEL_LENGTH} bytes.`);
            }
            return converted;
        });

        const length = ascii.reduce((sum, label) => sum + label.length + 1, 0) + 1;
        if (length > MAX_NAME_LENGTH) {
            throw new Error(`DNS name "${name}" exceeds ${MAX_NAME_LENGTH} bytes in wire format.`);
        }
        return ascii;
    }

    /**
     * Serializes a domain name to DNS binary format, without compression.
     * @static
     * @param {string} name - Domain name to serialize (e.g., "example.com")
     * @returns {Uint8Array} Binary representation of the domain name
     * @throws {Error} If a label is empty or the name exceeds the size limits
     */
    static serialize(name) {
        const labels = this.labels(name);
        const buffer = new Uint8Array(labels.reduce((sum, label) => sum + label.length + 1, 0) + 1);
        let offset = 0;
        for (const label of labels) {
            buffer[offset++] = label.length;
            // Labels are pure ASCII at this point, so characters map to bytes 1:1.
            buffer.set(textEncoder.encode(label), offset);
            offset += label.length;
        }
        buffer[offset] = 0;
        return buffer;
    }
}

/**
 * Serializes a name without compression; the default name encoder of the codecs.
 * @param {string} name - Domain name
 * @returns {Uint8Array} Binary name
 */
function plainName(name) {
    return DnsNameSerializer.serialize(name);
}

/**
 * Remembers where names have been written into a message so that later
 * occurrences can be replaced by compression pointers (RFC 1035 §4.1.4).
 *
 * Suffixes are matched exactly rather than case-insensitively, so compression
 * never changes the case of a name on the wire.
 */
class NameCompressor {
    /** @type {Map<string, number>} */
    #offsets = new Map();

    /**
     * Encodes a name that will be written at the given message offset.
     * @param {string} name - Domain name
     * @param {number} at - Message offset the name will be written to
     * @returns {Uint8Array} Binary name, possibly ending in a pointer
     */
    encode(name, at) {
        const labels = DnsNameSerializer.labels(name);
        const parts = [];
        let length = 0;
        for (let i = 0; i < labels.length; i++) {
            const suffix = labels.slice(i).join(".");
            const target = this.#offsets.get(suffix);
            if (target !== undefined) {
                parts.push(new Uint8Array([0xc0 | (target >> 8), target & 0xff]));
                return concatBytes(...parts);
            }
            if (at + length <= MAX_POINTER_OFFSET) {
                this.#offsets.set(suffix, at + length);
            }
            parts.push(new Uint8Array([labels[i].length]), textEncoder.encode(labels[i]));
            length += labels[i].length + 1;
        }
        parts.push(new Uint8Array([0]));
        return concatBytes(...parts);
    }
}

/**
 * Codec for record types whose rdata is a single domain name (NS, CNAME, PTR,
 * DNAME, ...).
 */
const NAME_CODEC = Object.freeze({
    /**
     * @param {DataView} view - DataView containing the record
     * @param {number} offset - Starting offset
     * @param {number} [dataLength] - Length of the record data
     * @returns {Object} Deserialized record data
     */
    deserialize(view, offset, dataLength) {
        const value = DnsNameSerializer.deserialize(view, offset);
        expectRDataEnd(value.offset, offset, dataLength);
        return { name: value.name };
    },
    /**
     * @param {Object} rdata - Record data to serialize
     * @param {function(string, number): Uint8Array} [encodeName] - Name encoder,
     *   called with the name and its offset within the rdata
     * @returns {Uint8Array} Serialized record data
     */
    serialize(rdata, encodeName = plainName) {
        return encodeName(rdata.name, 0);
    }
});

/**
 * Builds a codec for rdata made of a 16-bit number followed by a domain name
 * (MX, KX, LP, AFSDB).
 * @param {string} numberField - Property holding the number
 * @param {string} nameField - Property holding the domain name
 * @returns {Object} Codec
 */
function numberAndNameCodec(numberField, nameField) {
    return Object.freeze({
        deserialize(view, offset, dataLength) {
            const number = view.getUint16(offset);
            const name = DnsNameSerializer.deserialize(view, offset + 2);
            expectRDataEnd(name.offset, offset, dataLength);
            return { [numberField]: number, [nameField]: name.name };
        },
        serialize(rdata, encodeName = plainName) {
            return concatBytes(uint16Bytes(rdata[numberField]), encodeName(rdata[nameField], 2));
        }
    });
}

/**
 * Builds a codec for rdata made of two domain names (MINFO, RP).
 * @param {string} firstField - Property holding the first name
 * @param {string} secondField - Property holding the second name
 * @returns {Object} Codec
 */
function twoNamesCodec(firstField, secondField) {
    return Object.freeze({
        deserialize(view, offset, dataLength) {
            const first = DnsNameSerializer.deserialize(view, offset);
            const second = DnsNameSerializer.deserialize(view, first.offset);
            expectRDataEnd(second.offset, offset, dataLength);
            return { [firstField]: first.name, [secondField]: second.name };
        },
        serialize(rdata, encodeName = plainName) {
            const first = encodeName(rdata[firstField], 0);
            return concatBytes(first, encodeName(rdata[secondField], first.length));
        }
    });
}

/**
 * Builds a codec for rdata made of a 16-bit preference followed by a value of
 * fixed length (NID, L32, L64 - RFC 6742).
 * @param {string} type - Record type name, for error messages
 * @param {string} field - Property holding the value
 * @param {number} length - Length of the value in bytes
 * @param {function(Uint8Array): string} format - Renders the value bytes
 * @param {function(string): Uint8Array} parse - Parses the rendered value
 * @returns {Object} Codec
 */
function preferenceAndValueCodec(type, field, length, format, parse) {
    return Object.freeze({
        deserialize(view, offset, dataLength) {
            expectDataLength(type, dataLength, 2 + length);
            return { preference: view.getUint16(offset), [field]: format(readBytes(view, offset + 2, length)) };
        },
        serialize(rdata) {
            const value = parse(rdata[field]);
            expectDataLength(type, 2 + value.length, 2 + length);
            return concatBytes(uint16Bytes(rdata.preference), value);
        }
    });
}

/**
 * Builds a codec for an EUI-48 or EUI-64 address (RFC 7043), rendered as
 * hyphen-separated hex bytes.
 * @param {string} type - Record type name, for error messages
 * @param {number} length - Address length in bytes
 * @returns {Object} Codec
 */
function euiCodec(type, length) {
    return Object.freeze({
        deserialize(view, offset, dataLength) {
            expectDataLength(type, dataLength, length);
            return { address: Array.from(readBytes(view, offset, length), b => b.toString(16).padStart(2, "0")).join("-") };
        },
        serialize(rdata) {
            const bytes = fromHex(String(rdata.address).replace(/-/g, ""));
            expectDataLength(type, bytes.length, length);
            return bytes;
        }
    });
}

/**
 * Codec for text records (TXT, SPF, AVC).
 *
 * Reads every character-string in the rdata and joins them. A TXT record
 * carries payloads longer than 255 bytes as several character-strings
 * (RFC 1035 §3.3.14), which is how long DKIM and SPF records are stored.
 */
const TEXT_CODEC = Object.freeze({
    /**
     * @param {DataView} view - DataView containing the record
     * @param {number} offset - Starting offset
     * @param {number} [dataLength] - Length of the record data
     * @returns {Object} Deserialized text record data
     */
    deserialize(view, offset, dataLength) {
        const end = dataLength === undefined ? offset + 1 + view.getUint8(offset) : offset + dataLength;
        return { text: decodeCharacterStrings(view, offset, end) };
    },
    /**
     * @param {Object} rdata - Record data to serialize
     * @returns {Uint8Array} Serialized text record
     */
    serialize(rdata) {
        return encodeCharacterStrings(rdata.text);
    }
});

/**
 * Codec for certificate association data (TLSA - RFC 6698, SMIMEA - RFC 8162).
 */
const CERT_ASSOCIATION_CODEC = Object.freeze({
    deserialize(view, offset, dataLength) {
        return {
            usage: view.getUint8(offset),
            selector: view.getUint8(offset + 1),
            matchingType: view.getUint8(offset + 2),
            certAssocData: toHex(readRange(view, offset + 3, offset + dataLength))
        };
    },
    serialize(rdata) {
        return concatBytes(
            new Uint8Array([rdata.usage, rdata.selector, rdata.matchingType]),
            fromHex(rdata.certAssocData)
        );
    }
});

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
     * @throws {Error} If the record is truncated or its rdata is malformed
     */
    static deserialize(view, offset, question = false, zone = false) {
        const name = DnsNameSerializer.deserialize(view, offset);
        offset = name.offset;
        const type = view.getUint16(offset);
        const clazz = view.getUint16(offset + 2);
        offset += 4;
        if (question) {
            return {record: new Question(name.name, type, clazz), offset};
        }
        if (zone) {
            return {record: new Zone(name.name, type, clazz), offset};
        }
        const ttl = view.getUint32(offset);
        const dataLength = view.getUint16(offset + 4);
        offset += 6;
        const end = offset + dataLength;
        if (end > view.byteLength) {
            throw new RangeError(`Rdata of record "${name.name}" (${offset}..${end}) exceeds the available ${view.byteLength} bytes.`);
        }

        const record = new Record(name.name, type, clazz, ttl);
        // A bare EDNS(0) record legitimately has no options, but it still needs
        // the structured empty option list rather than raw empty bytes.
        if (dataLength === 0 && type !== TYPE.OPT) {
            return {record, offset};
        }
        const codec = RDATA_CODECS.get(type);
        if (codec) {
            // Bound the view at the end of the rdata so a malformed record can
            // never read into the next one. Offsets stay relative to the message,
            // so compression pointers still reach every name before the record.
            const rdataView = new DataView(view.buffer, view.byteOffset, end);
            record.data = codec.deserialize(rdataView, offset, dataLength);
        } else {
            // Preserve the rdata of types without a dedicated codec verbatim so
            // the record still round-trips instead of being silently dropped.
            record.data = readBytes(view, offset, dataLength);
        }
        return {record, offset: end};
    }

    /**
     * Serializes a complete resource record (or question) to its wire bytes.
     * @static
     * @param {DNSRecord|DNSQuestion|Zone} record - Record to serialize
     * @param {boolean} [question] - Emit only name/type/class, as a question does
     * @param {NameCompressor|null} [compressor=null] - Compresses names against
     *   those already written to the message
     * @param {number} [at=0] - Message offset the record will be written to
     * @returns {Uint8Array} Binary representation of the record
     */
    static toBytes(record, question = record instanceof Question || record instanceof Zone, compressor = null, at = 0) {
        const type = resolveTypeCode(record.type);
        const nameBytes = compressor ? compressor.encode(record.name, at) : DnsNameSerializer.serialize(record.name);
        const header = new Uint8Array(question ? 4 : 10);
        const headerView = new DataView(header.buffer);
        headerView.setUint16(0, type, false);
        headerView.setUint16(2, resolveClassCode(record.clazz), false);
        if (question) {
            return concatBytes(nameBytes, header);
        }
        headerView.setUint32(4, record.ttl, false);

        const rdataAt = at + nameBytes.byteLength + header.byteLength;
        const encodeName = compressor && COMPRESSIBLE_TYPES.has(type)
            ? (name, relative) => compressor.encode(name, rdataAt + relative)
            : plainName;
        const rdata = this.serializeRData(record, encodeName);
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
     * @param {function(string, number): Uint8Array} [encodeName] - Encoder for
     *   the names in the rdata, called with the name and its offset within it
     * @returns {Uint8Array} Binary rdata
     */
    static serializeRData(record, encodeName = plainName) {
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
        const codec = RDATA_CODECS.get(resolveTypeCode(record.type));
        if (codec === undefined) {
            throw new Error(`Cannot serialize rdata for record type ${record.type}: pass raw bytes as a Uint8Array instead.`);
        }
        return codec.serialize(data, encodeName);
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
            return { ipv4: formatIPv4(readBytes(view, offset, dataLength)) };
        },
        /**
         * @param {Object} rdata - Record data to serialize
         * @returns {Uint8Array} Serialized A record
         */
        serialize(rdata) {
            return parseIPv4(rdata.ipv4);
        }
    }

    /** NS Record (Name Server) serializer */
    static NS = NAME_CODEC;
    static MD = NAME_CODEC;
    static MF = NAME_CODEC;
    static CNAME = NAME_CODEC;
    static MB = NAME_CODEC;
    static MG = NAME_CODEC;
    static MR = NAME_CODEC;
    static PTR = NAME_CODEC;
    static DNAME = NAME_CODEC;

    /**
     * SOA Record (Start of Authority) serializer
     * @static
     */
    static SOA = {
        /**
         * @param {DataView} view - DataView containing the record
         * @param {number} offset - Starting offset
         * @param {number} [dataLength] - Length of the record data
         * @returns {Object} Deserialized SOA record data
         */
        deserialize(view, offset, dataLength) {
            const mname = DnsNameSerializer.deserialize(view, offset);
            const rname = DnsNameSerializer.deserialize(view, mname.offset);
            const timers = rname.offset;
            const data = {
                mname: mname.name,
                rname: rname.name,
                serial: view.getUint32(timers),
                refresh: view.getUint32(timers + 4),
                retry: view.getUint32(timers + 8),
                expire: view.getUint32(timers + 12),
                minimum: view.getUint32(timers + 16)
            };
            expectRDataEnd(timers + 20, offset, dataLength);
            return data;
        },
        /**
         * @param {Object} rdata - Record data to serialize
         * @param {function(string, number): Uint8Array} [encodeName] - Name encoder
         * @returns {Uint8Array} Serialized SOA record
         */
        serialize(rdata, encodeName = plainName) {
            const mname = encodeName(rdata.mname, 0);
            const rname = encodeName(rdata.rname, mname.length);
            const timers = new Uint8Array(20);
            const view = new DataView(timers.buffer);
            view.setUint32(0, rdata.serial, false);
            view.setUint32(4, rdata.refresh, false);
            view.setUint32(8, rdata.retry, false);
            view.setUint32(12, rdata.expire, false);
            view.setUint32(16, rdata.minimum, false);
            return concatBytes(mname, rname, timers);
        }
    }

    static NULL = {
        deserialize(view, offset, dataLength) {
            return { data: toBase64(readRange(view, offset, offset + dataLength)) };
        },
        serialize(rdata) {
            return fromBase64(rdata.data);
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
            const address = formatIPv4(readBytes(view, offset, 4));
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

            return { address, protocol, ports };
        },
        /**
         * @param {Object} rdata - Record data to serialize
         * @returns {Uint8Array} Serialized WKS record
         */
        serialize(rdata) {
            const ports = rdata.ports || [];
            // An empty port list is legitimate and yields an empty bitmap;
            // reduce() also avoids spreading a large port list into Math.max.
            const maxPort = ports.reduce((max, port) => Math.max(max, port), -1);
            const bitmap = new Uint8Array(Math.ceil((maxPort + 1) / 8));
            for (const port of ports) {
                bitmap[port >> 3] |= 1 << (7 - (port & 7));
            }
            return concatBytes(parseIPv4(rdata.address), new Uint8Array([rdata.protocol]), bitmap);
        }
    }

    static MINFO = twoNamesCodec("rmailbx", "emailbx");
    static RP = twoNamesCodec("mbox", "txt");
    static AFSDB = numberAndNameCodec("subtype", "hostname");

    static HINFO = {
        deserialize(view, offset, dataLength) {
            const cpu = decodeCharacterString(view, offset);
            const os = decodeCharacterString(view, cpu.offset);
            expectRDataEnd(os.offset, offset, dataLength);
            return { cpu: cpu.text, os: os.text };
        },
        serialize(rdata) {
            return concatBytes(
                encodeCharacterString(rdata.cpu, "HINFO cpu"),
                encodeCharacterString(rdata.os, "HINFO os")
            );
        }
    }

    /** MX Record (Mail Exchange) serializer */
    static MX = numberAndNameCodec("preference", "exchange");

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
            return { ipv6: formatIPv6(readBytes(view, offset, dataLength)) };
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
        deserialize(view, offset, dataLength) {
            const priority = view.getUint16(offset);
            const weight = view.getUint16(offset + 2);
            const port = view.getUint16(offset + 4);
            const target = DnsNameSerializer.deserialize(view, offset + 6);
            expectRDataEnd(target.offset, offset, dataLength);
            return { priority, weight, port, target: target.name };
        },
        serialize(rdata) {
            const header = new Uint8Array(6);
            const view = new DataView(header.buffer);
            view.setUint16(0, rdata.priority, false);
            view.setUint16(2, rdata.weight, false);
            view.setUint16(4, rdata.port, false);
            return concatBytes(header, DnsNameSerializer.serialize(rdata.target));
        }
    }

    static DS = {
        deserialize(view, offset, dataLength) {
            return {
                keyTag: view.getUint16(offset),
                algorithm: view.getUint8(offset + 2),
                digestType: view.getUint8(offset + 3),
                digest: toBase64(readRange(view, offset + 4, offset + dataLength))
            };
        },
        serialize(rdata) {
            const header = new Uint8Array(4);
            const view = new DataView(header.buffer);
            view.setUint16(0, rdata.keyTag, false);
            view.setUint8(2, rdata.algorithm);
            view.setUint8(3, rdata.digestType);
            return concatBytes(header, fromBase64(rdata.digest));
        }
    }

    /** TXT Record (Text) serializer */
    static TXT = TEXT_CODEC;
    static SPF = TEXT_CODEC;

    static RRSIG = {
        deserialize(view, offset, dataLength) {
            const typeCoveredCode = view.getUint16(offset);
            const algorithm = view.getUint8(offset + 2);
            const labels = view.getUint8(offset + 3);
            const originalTtl = view.getUint32(offset + 4);
            const expiration = view.getUint32(offset + 8);
            const inception = view.getUint32(offset + 12);
            const keyTag = view.getUint16(offset + 16);
            const signersName = DnsNameSerializer.deserialize(view, offset + 18);
            const signature = toBase64(readRange(view, signersName.offset, offset + dataLength));
            return {
                typeCovered: TYPE_NAMES[typeCoveredCode] || typeCoveredCode,
                algorithm,
                labels,
                originalTtl,
                expiration: new Date(expiration * 1000),
                inception: new Date(inception * 1000),
                keyTag,
                signersName: signersName.name,
                signature
            };
        },
        serialize(rdata) {
            const header = new Uint8Array(18);
            const view = new DataView(header.buffer);
            // typeCovered may be a name ("A") as produced by deserialize, or a code.
            view.setUint16(0, resolveTypeCode(rdata.typeCovered), false);
            view.setUint8(2, rdata.algorithm);
            view.setUint8(3, rdata.labels);
            view.setUint32(4, rdata.originalTtl, false);
            view.setUint32(8, Math.floor(rdata.expiration.getTime() / 1000), false);
            view.setUint32(12, Math.floor(rdata.inception.getTime() / 1000), false);
            view.setUint16(16, rdata.keyTag, false);
            return concatBytes(header, DnsNameSerializer.serialize(rdata.signersName), fromBase64(rdata.signature));
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
            const nextDomain = DnsNameSerializer.deserialize(view, offset);
            return {
                nextDomain: nextDomain.name,
                typeBitmaps: decodeTypeBitmaps(view, nextDomain.offset, offset + dataLength)
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
            // Any other combination of the ZONE/SEP/REVOKE bits is kept numeric
            // so it survives a round-trip unchanged.
            const flag = flagBits === 256 ? "ZSK" : flagBits === 257 ? "KSK" : flagBits;
            return {
                flag,
                protocol: view.getUint8(offset + 2),
                algorithm: view.getUint8(offset + 3),
                publickey: toBase64(readRange(view, offset + 4, offset + dataLength))
            };
        },
        serialize(rdata) {
            const flag = rdata.flag === "ZSK" ? 256
                : rdata.flag === "KSK" ? 257
                : typeof rdata.flag === "number" ? rdata.flag
                : (() => { throw new Error(`Invalid DNSKEY flags value "${rdata.flag}": expected "ZSK", "KSK" or a number.`); })();
            const header = new Uint8Array(4);
            const view = new DataView(header.buffer);
            view.setUint16(0, flag, false);
            view.setUint8(2, rdata.protocol);
            view.setUint8(3, rdata.algorithm);
            return concatBytes(header, fromBase64(rdata.publickey));
        }
    }

    static TSIG = {
        deserialize(view, offset, dataLength) {
            const algorithm = DnsNameSerializer.deserialize(view, offset);
            let start = algorithm.offset;
            const timestampHigh = view.getUint16(start);
            const timestampLow = view.getUint32(start + 2);
            const fudge = view.getUint16(start + 6);
            const macLength = view.getUint16(start + 8);
            start += 10;
            const mac = readBytes(view, start, macLength);
            start += macLength;
            const originalId = view.getUint16(start);
            const error = view.getUint16(start + 2);
            const otherLength = view.getUint16(start + 4);
            start += 6;
            const otherData = readBytes(view, start, otherLength);
            expectRDataEnd(start + otherLength, offset, dataLength);
            return {
                algorithm: algorithm.name,
                timestamp: (BigInt(timestampHigh) << 32n) | BigInt(timestampLow),
                fudge,
                mac,
                originalId,
                error,
                otherData
            };
        },
        serialize(rdata) {
            // RFC 8945: layout is algorithm + 6 (time) + 2 (fudge) + 2 (maclen)
            // + mac + 2 (originalId) + 2 (error) + 2 (otherLen) + otherData.
            // The mac-length field MUST always be present (zero if empty).
            const fixed = new Uint8Array(10);
            const view = new DataView(fixed.buffer);
            view.setUint16(0, Number((rdata.timestamp >> 32n) & 0xFFFFn), false);
            view.setUint32(2, Number(rdata.timestamp & 0xFFFFFFFFn), false);
            view.setUint16(6, rdata.fudge, false);
            view.setUint16(8, rdata.mac.byteLength, false);

            const trailer = new Uint8Array(6);
            const trailerView = new DataView(trailer.buffer);
            trailerView.setUint16(0, rdata.originalId, false);
            trailerView.setUint16(2, rdata.error, false);
            trailerView.setUint16(4, rdata.otherData.byteLength, false);

            return concatBytes(DnsNameSerializer.serialize(rdata.algorithm), fixed, rdata.mac, trailer, rdata.otherData);
        }
    }

    static LOC = {
        deserialize(view, offset, dataLength) {
            if (dataLength !== 16) {
                throw new Error("Invalid LOC record length.");
            }
            return {
                version: view.getUint8(offset),
                size: view.getUint8(offset + 1),
                horizPre: view.getUint8(offset + 2),
                vertPre: view.getUint8(offset + 3),
                latitude: view.getUint32(offset + 4),
                longitude: view.getUint32(offset + 8),
                altitude: view.getUint32(offset + 12)
            };
        },
        serialize(rdata) {
            const buffer = new Uint8Array(16);
            const view = new DataView(buffer.buffer);
            view.setUint8(0, rdata.version);
            view.setUint8(1, rdata.size);
            view.setUint8(2, rdata.horizPre);
            view.setUint8(3, rdata.vertPre);
            view.setUint32(4, rdata.latitude, false);
            view.setUint32(8, rdata.longitude, false);
            view.setUint32(12, rdata.altitude, false);
            return buffer;
        }
    }

    static NAPTR = {
        deserialize(view, offset, dataLength) {
            const order = view.getUint16(offset);
            const preference = view.getUint16(offset + 2);
            const flags = decodeCharacterString(view, offset + 4);
            const services = decodeCharacterString(view, flags.offset);
            const regexp = decodeCharacterString(view, services.offset);
            const replacement = DnsNameSerializer.deserialize(view, regexp.offset);
            expectRDataEnd(replacement.offset, offset, dataLength);
            return {
                order,
                preference,
                flags: flags.text,
                services: services.text,
                regexp: regexp.text,
                replacement: replacement.name
            };
        },
        serialize(rdata) {
            const header = new Uint8Array(4);
            const view = new DataView(header.buffer);
            view.setUint16(0, rdata.order, false);
            view.setUint16(2, rdata.preference, false);
            return concatBytes(
                header,
                encodeCharacterString(rdata.flags, "NAPTR flags"),
                encodeCharacterString(rdata.services, "NAPTR services"),
                encodeCharacterString(rdata.regexp, "NAPTR regexp"),
                DnsNameSerializer.serialize(rdata.replacement)
            );
        }
    }

    static CERT = {
        deserialize(view, offset, dataLength) {
            return {
                type: view.getUint16(offset),
                keyTag: view.getUint16(offset + 2),
                algorithm: view.getUint8(offset + 4),
                certificate: toBase64(readRange(view, offset + 5, offset + dataLength))
            };
        },
        serialize(rdata) {
            const header = new Uint8Array(5);
            const view = new DataView(header.buffer);
            view.setUint16(0, rdata.type, false);
            view.setUint16(2, rdata.keyTag, false);
            view.setUint8(4, rdata.algorithm);
            return concatBytes(header, fromBase64(rdata.certificate));
        }
    }

    static SSHFP = {
        deserialize(view, offset, dataLength) {
            return {
                algorithm: view.getUint8(offset),
                fpType: view.getUint8(offset + 1),
                fingerprint: toHex(readRange(view, offset + 2, offset + dataLength))
            };
        },
        serialize(rdata) {
            return concatBytes(new Uint8Array([rdata.algorithm, rdata.fpType]), fromHex(rdata.fingerprint));
        }
    }

    static TLSA = CERT_ASSOCIATION_CODEC;
    static SMIMEA = CERT_ASSOCIATION_CODEC;

    static URI = {
        deserialize(view, offset, dataLength) {
            return {
                priority: view.getUint16(offset),
                weight: view.getUint16(offset + 2),
                target: textDecoder.decode(readRange(view, offset + 4, offset + dataLength))
            };
        },
        serialize(rdata) {
            const header = new Uint8Array(4);
            const view = new DataView(header.buffer);
            view.setUint16(0, rdata.priority, false);
            view.setUint16(2, rdata.weight, false);
            return concatBytes(header, textEncoder.encode(rdata.target));
        }
    }

    static CAA = {
        deserialize(view, offset, dataLength) {
            const flags = view.getUint8(offset);
            const tagLength = view.getUint8(offset + 1);
            return {
                flags,
                tag: textDecoder.decode(readRange(view, offset + 2, offset + 2 + tagLength)),
                value: textDecoder.decode(readRange(view, offset + 2 + tagLength, offset + dataLength))
            };
        },
        serialize(rdata) {
            return concatBytes(
                new Uint8Array([rdata.flags]),
                encodeCharacterString(rdata.tag, "CAA tag"),
                textEncoder.encode(rdata.value)
            );
        }
    }

    /**
     * SVCB Record (Service Binding - RFC 9460) serializer. HTTPS records share
     * the same wire format. SvcParams are kept as hex, keyed by their number.
     * @static
     */
    static SVCB = {
        deserialize(view, offset, dataLength) {
            const end = offset + dataLength;
            const priority = view.getUint16(offset);
            const target = DnsNameSerializer.deserialize(view, offset + 2);
            const params = {};

            offset = target.offset;
            while (offset < end) {
                if (offset + 4 > end) {
                    throw new Error("Truncated SvcParam header.");
                }
                const key = view.getUint16(offset);
                const length = view.getUint16(offset + 2);
                offset += 4;
                if (offset + length > end) {
                    throw new Error(`Truncated value of SvcParam ${key}.`);
                }
                params[key] = toHex(readBytes(view, offset, length));
                offset += length;
            }

            return { priority, target: target.name, params };
        },
        serialize(rdata) {
            const params = rdata.params || {};
            const blocks = Object.keys(params).map(Number).sort((a, b) => a - b).map(key => {
                const value = fromHex(params[key] || "");
                return concatBytes(uint16Bytes(key), uint16Bytes(value.length), value);
            });
            return concatBytes(uint16Bytes(rdata.priority), DnsNameSerializer.serialize(rdata.target), ...blocks);
        }
    }

    static HTTPS = this.SVCB;

    static OPENPGPKEY = {
        deserialize(view, offset, dataLength) {
            return { publickey: toBase64(readRange(view, offset, offset + dataLength)) };
        },
        serialize(rdata) {
            return fromBase64(rdata.publickey);
        }
    }

    static IPSECKEY = {
        deserialize(view, offset, dataLength) {
            const end = offset + dataLength;
            const precedence = view.getUint8(offset);
            const gatewayType = view.getUint8(offset + 1);
            const algorithm = view.getUint8(offset + 2);
            offset += 3;

            let gateway;
            switch (gatewayType) {
                case 0:
                    gateway = ".";
                    break;
                case 1:
                    gateway = formatIPv4(readBytes(view, offset, 4));
                    offset += 4;
                    break;
                case 2:
                    gateway = formatIPv6(readBytes(view, offset, 16));
                    offset += 16;
                    break;
                case 3: {
                    const gatewayName = DnsNameSerializer.deserialize(view, offset);
                    gateway = gatewayName.name;
                    offset = gatewayName.offset;
                    break;
                }
                default:
                    // Without a known gateway type its length is unknown, so the
                    // remaining rdata cannot be split reliably.
                    throw new Error(`Unknown IPSECKEY gateway type ${gatewayType}.`);
            }

            // The public key fills the rest of the rdata.
            const publickey = toBase64(readRange(view, offset, end));
            return { precedence, gatewayType, algorithm, gateway, publickey };
        },
        serialize(rdata) {
            let gatewayBytes;
            switch (rdata.gatewayType) {
                case 0:
                    gatewayBytes = new Uint8Array(0);
                    break;
                case 1:
                    gatewayBytes = parseIPv4(rdata.gateway);
                    break;
                case 2:
                    gatewayBytes = parseIPv6(rdata.gateway);
                    break;
                case 3:
                    gatewayBytes = DnsNameSerializer.serialize(rdata.gateway);
                    break;
                default:
                    throw new Error(`Unknown IPSECKEY gateway type ${rdata.gatewayType}.`);
            }
            return concatBytes(
                new Uint8Array([rdata.precedence, rdata.gatewayType, rdata.algorithm]),
                gatewayBytes,
                fromBase64(rdata.publickey)
            );
        }
    }

    static DHCID = {
        deserialize(view, offset, dataLength) {
            return { digest: toBase64(readRange(view, offset, offset + dataLength)) };
        },
        serialize(rdata) {
            return fromBase64(rdata.digest);
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
            const end = offset + dataLength;
            const algorithm = view.getUint8(offset);
            const flags = view.getUint8(offset + 1);
            const iterations = view.getUint16(offset + 2);
            const saltLength = view.getUint8(offset + 4);
            offset += 5;

            const salt = toHex(readBytes(view, offset, saltLength));
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
                typeBitmaps: decodeTypeBitmaps(view, offset, end)
            };
        },
        /**
         * @param {Object} rdata - Record data to serialize
         * @returns {Uint8Array} Serialized NSEC3 record
         */
        serialize(rdata) {
            const salt = fromHex(rdata.salt);
            const hash = fromHex(rdata.nextHashedOwnerName);
            if (salt.length > 255 || hash.length > 255) {
                throw new Error("NSEC3 salt and hash are limited to 255 bytes each.");
            }
            const header = new Uint8Array(4);
            const view = new DataView(header.buffer);
            view.setUint8(0, rdata.algorithm);
            view.setUint8(1, rdata.flags);
            view.setUint16(2, rdata.iterations, false);
            return concatBytes(
                header,
                new Uint8Array([salt.length]), salt,
                new Uint8Array([hash.length]), hash,
                encodeTypeBitmaps(rdata?.typeBitmaps || [])
            );
        }
    }

    static NSEC3PARAM = {
        deserialize(view, offset, dataLength) {
            const algorithm = view.getUint8(offset);
            const flags = view.getUint8(offset + 1);
            const iterations = view.getUint16(offset + 2);
            const saltLength = view.getUint8(offset + 4);
            const salt = toHex(readBytes(view, offset + 5, saltLength));
            expectRDataEnd(offset + 5 + saltLength, offset, dataLength);
            return { algorithm, flags, iterations, salt };
        },
        serialize(rdata) {
            const salt = rdata.salt ? fromHex(rdata.salt) : new Uint8Array(0);
            if (salt.length > 255) {
                throw new Error("NSEC3PARAM salt is limited to 255 bytes.");
            }
            const header = new Uint8Array(5);
            const view = new DataView(header.buffer);
            view.setUint8(0, rdata.algorithm);
            view.setUint8(1, rdata.flags);
            view.setUint16(2, rdata.iterations, false);
            view.setUint8(4, salt.length);
            return concatBytes(header, salt);
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
            return {
                serial: view.getUint32(offset),
                scheme: view.getUint8(offset + 4),
                algorithm: view.getUint8(offset + 5),
                digest: toHex(readRange(view, offset + 6, offset + dataLength))
            };
        },
        serialize(rdata) {
            const header = new Uint8Array(6);
            const view = new DataView(header.buffer);
            view.setUint32(0, rdata.serial, false);
            view.setUint8(4, rdata.scheme);
            view.setUint8(5, rdata.algorithm);
            return concatBytes(header, fromHex(rdata.digest));
        }
    }

    static TKEY = {
        deserialize(view, offset, dataLength) {
            const algorithm = DnsNameSerializer.deserialize(view, offset);
            const start = algorithm.offset;
            const inception = view.getUint32(start);
            const expiration = view.getUint32(start + 4);
            const mode = view.getUint16(start + 8);
            const error = view.getUint16(start + 10);
            const keyLength = view.getUint16(start + 12);
            const key = keyLength > 0 ? toBase64(readBytes(view, start + 14, keyLength)) : "";
            const otherLength = view.getUint16(start + 14 + keyLength);
            const other = otherLength > 0 ? toBase64(readBytes(view, start + 16 + keyLength, otherLength)) : "";
            expectRDataEnd(start + 16 + keyLength + otherLength, offset, dataLength);

            return { algorithm: algorithm.name, inception: new Date(inception * 1000), expiration: new Date(expiration * 1000), mode, error, key, other };
        },
        serialize(rdata) {
            const key = rdata.key ? fromBase64(rdata.key) : new Uint8Array(0);
            const other = rdata.other ? fromBase64(rdata.other) : new Uint8Array(0);
            const fixed = new Uint8Array(12);
            const view = new DataView(fixed.buffer);
            view.setUint32(0, Math.floor(rdata.inception.getTime() / 1000), false);
            view.setUint32(4, Math.floor(rdata.expiration.getTime() / 1000), false);
            view.setUint16(8, rdata.mode, false);
            view.setUint16(10, rdata.error, false);
            return concatBytes(
                DnsNameSerializer.serialize(rdata.algorithm),
                fixed,
                uint16Bytes(key.length), key,
                uint16Bytes(other.length), other
            );
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
                return concatBytes(uint16Bytes(option.code), uint16Bytes(data.length), data);
            });
            return concatBytes(...blocks);
        }
    }

    /** KX Record (Key Exchanger - RFC 2230) serializer */
    static KX = numberAndNameCodec("preference", "exchanger");

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

    /** NID Record (Node Identifier - RFC 6742) serializer */
    static NID = preferenceAndValueCodec("NID", "nodeId", 8, toHex, fromHex);
    /** L32 Record (32-bit Locator - RFC 6742) serializer */
    static L32 = preferenceAndValueCodec("L32", "locator32", 4, formatIPv4, parseIPv4);
    /** L64 Record (64-bit Locator - RFC 6742) serializer */
    static L64 = preferenceAndValueCodec("L64", "locator64", 8, toHex, fromHex);
    /** LP Record (Locator Pointer - RFC 6742) serializer */
    static LP = numberAndNameCodec("preference", "fqdn");

    /** EUI48 Record (48-bit MAC address - RFC 7043) serializer */
    static EUI48 = euiCodec("EUI48", 6);
    /** EUI64 Record (64-bit MAC address - RFC 7043) serializer */
    static EUI64 = euiCodec("EUI64", 8);
}

/**
 * Maps a record type to the codec of its rdata. Codecs are picked up by type
 * name from DnsRecordSerializer, so adding a codec there is all it takes; types
 * that reuse another type's wire format are aliased explicitly.
 * @type {ReadonlyMap<number, {deserialize: Function, serialize: Function}>}
 */
const RDATA_CODECS = new Map([
    ...Object.entries(TYPE)
        .filter(([name]) => Object.hasOwn(DnsRecordSerializer, name))
        .map(([name, code]) => [code, DnsRecordSerializer[name]]),
    [TYPE.CDS, DnsRecordSerializer.DS],
    [TYPE.CDNSKEY, DnsRecordSerializer.DNSKEY],
    [TYPE.DLV, DnsRecordSerializer.DS],
    [TYPE.TA, DnsRecordSerializer.DS],
    [TYPE.AVC, DnsRecordSerializer.TXT]
]);

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

    // A message carries at most one TSIG record, as its very last record. Drop
    // the signature of an earlier sign() so that re-signing — e.g. sending the
    // same UpdateBuilder twice — replaces it instead of stacking a second one.
    for (let i = message.additionals.length - 1; i >= 0; i--) {
        if (resolveTypeCode(message.additionals[i].type) === TYPE.TSIG) {
            message.additionals.splice(i, 1);
        }
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
    for (const section of DnsSerializer.sections(message)) {
        for (const record of section.records) {
            record.clazz = CLASS_NAMES[record.clazz] ?? record.clazz;
            record.type  = TYPE_NAMES[record.type] ?? record.type;
        }
    }
    // Values without a name keep their number, so interpreting twice or
    // re-serializing afterwards never loses them.
    message.flags.qr = QR_NAMES[message.flags.qr] ?? message.flags.qr;
    message.flags.opcode = OPCODE_NAMES[message.flags.opcode] ?? message.flags.opcode;
    message.flags.rcode  = RCODE_NAMES[message.flags.rcode] ?? message.flags.rcode;
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
 * @param {"POST"|"GET"} [options.method="POST"] - HTTP method. GET sends the
 *   message base64url-encoded in the "dns" parameter, which HTTP caches can
 *   serve; set `message.id = 0` to make identical queries cacheable.
 * @returns {Promise<DNSQueryResult>} Query result with latency
 * @throws {Error} If the request fails, times out or the response is not a DNS message
 */
export async function query(url, message, options = false) {
    // A boolean third argument is still accepted for backwards compatibility.
    const {interpreted = false, timeout, signal, headers, method = "POST"} = typeof options === "boolean"
        ? {interpreted: options}
        : options;
    const get = String(method).toUpperCase() === "GET";
    if (!get && String(method).toUpperCase() !== "POST") {
        throw new Error(`Unsupported HTTP method "${method}": DNS over HTTPS uses GET or POST.`);
    }

    // Serialize before any timer or listener exists, so a message that cannot be
    // encoded leaves nothing behind.
    const body = DnsSerializer.serialize(message);
    const request = get
        ? {
            url: `${url}${url.includes("?") ? "&" : "?"}dns=${toBase64Url(body)}`,
            init: {method: "GET", headers: {"Accept": "application/dns-message", ...headers}}
        }
        : {
            url,
            init: {
                method: "POST",
                headers: {
                    "Content-Type": "application/dns-message",
                    "Accept": "application/dns-message",
                    ...headers
                },
                body
            }
        };

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

    const start = performance.now();
    let end;
    let buffer;
    try {
        const response = await fetch(request.url, {...request.init, signal: controller.signal});
        end = performance.now();
        if (!response.ok) {
            throw new Error(`DNS query request failed with status: ${response.status} - ${response.statusText}`);
        }
        const contentType = response.headers?.get?.("Content-Type");
        if (contentType && !/^application\/dns-message\s*(;|$)/i.test(contentType)) {
            throw new Error(`DNS query to ${url} returned "${contentType}" instead of a DNS message.`);
        }
        // Reading the body stays inside the try block so that the timeout and
        // the caller's signal also cover a response that stalls mid-transfer.
        buffer = await response.arrayBuffer();
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
    }

    let result = DnsSerializer.deserialize(buffer);
    if (result.flags.qr !== 1) {
        throw new Error(`DNS query to ${url} returned a message that is not a response.`);
    }
    if (result.id !== message.id) {
        throw new Error(`DNS response ID ${result.id} does not match the query ID ${message.id}.`);
    }
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
        // One label per nibble, least significant first (RFC 3596 §2.5).
        return toHex(parseIPv6(ip)).split("").reverse().join(".") + ".ip6.arpa";
    }
    return Array.from(parseIPv4(ip)).reverse().join(".") + ".in-addr.arpa";
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
     * @param {object} [options]
     * @param {"POST"|"GET"} [options.method="POST"] HTTP method for lookups.
     *   With GET, lookups use message ID 0 as RFC 8484 §4.1 recommends, so
     *   HTTP caches can answer repeated queries.
     */
    constructor(serverUrl, {method = "POST"} = {}) {
        if (!serverUrl || typeof serverUrl !== "string") {
            throw new TypeError("serverUrl is required and must be a string.");
        }
        this.serverUrl = serverUrl;
        this.method = method;
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
        if (String(this.method).toUpperCase() === "GET") {
            message.id = 0;
        }
        message.questions.push(new Question(name, resolveTypeCode(type), CLAZZ.IN));
        const { result, latency } = await query(this.serverUrl, message, {method: this.method});
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
