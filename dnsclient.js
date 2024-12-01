/* @preserve
 * File: dnsclient.js
 * Project: dnsclient.js
 * File Created: Friday, 29th November 2024 3:30:10 pm
 * Author: Yannick Dreher (yannick.dreher@dremaxx.de)
 * -----
 * Last Modified: Sunday, 1st December 2024 7:54:16 pm
 * -----
 * MIT License
 * 
 * Copyright (c) 2024 Yannick Dreher
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * @endpreserve
 */

// Enums
const QR_NAMES = Object.freeze({
    0: 'QUERY',
    1: 'RESPONSE'
});

const OPCODE_NAMES = Object.freeze({
    0: 'QUERY',    // Standard query
    1: 'IQUERY',   // Inverse query (obsolete)
    2: 'STATUS',   // Server status request
    3: 'RESERVED', // Reserved for future use
    4: 'NOTIFY',   // Notify request
    5: 'UPDATE',   // Dynamic update
    6: 'DSO'       // DNS Stateful Operations
});

const RCODE_NAMES = Object.freeze({
    0: 'NOERROR',    // DNS Query completed successfully
    1: 'FORMERR',    // DNS Query Format Error
    2: 'SERVFAIL',   // Server failed to complete the DNS request
    3: 'NXDOMAIN',   // Domain name does not exist
    4: 'NOTIMP',     // Function not implemented
    5: 'REFUSED',    // The server refused to answer for the query
    6: 'YXDOMAIN',   // Name that should not exist, does exist
    7: 'XRRSET',     // RRset that should not exist, does exist
    8: 'NOTAUTH',    // Server not authoritative for the zone
    9: 'NOTZONE',    // Name not in zone
    10: 'BADVERS',   // Bad OPT Version
    11: 'BADSIG',    // TSIG Signature Failure
    12: 'BADKEY',    // Key not recognized
    13: 'BADTIME',   // Signature out of time window
    14: 'BADMODE',   // Bad TKEY Mode
    15: 'BADNAME',   // Duplicate key name
    16: 'BADALG',    // Algorithm not supported
    17: 'BADTRUNC',  // Bad truncation
    18: 'BADCOOKIE'  // Bad/missing server cookie
});

const TYPE_NAMES = Object.freeze({
    1: 'A',
    2: 'NS',
    3: 'MD',
    4: 'MF',
    5: 'CNAME',
    6: 'SOA',
    7: 'MB',
    8: 'MG',
    9: 'MR',
    10: 'NULL',
    11: 'WKS',
    12: 'PTR',
    13: 'HINFO',
    14: 'MINFO',
    15: 'MX',
    16: 'TXT',
    17: 'RP',
    18: 'AFSDB',
    19: 'X25',
    20: 'ISDN',
    21: 'RT',
    22: 'NSAP',
    23: 'NSAP_PTR',
    24: 'SIG',
    25: 'KEY',
    26: 'PX',
    27: 'GPOS',
    28: 'AAAA',
    29: 'LOC',
    30: 'NXT',
    31: 'EID',
    32: 'NIMLOC',
    33: 'SRV',
    34: 'ATMA',
    35: 'NAPTR',
    36: 'KX',
    37: 'CERT',
    38: 'A6',
    39: 'DNAME',
    40: 'SINK',
    41: 'OPT',
    42: 'APL',
    43: 'DS',
    44: 'SSHFP',
    45: 'IPSECKEY',
    46: 'RRSIG',
    47: 'NSEC',
    48: 'DNSKEY',
    49: 'DHCID',
    50: 'NSEC3',
    51: 'NSEC3PARAM',
    52: 'TLSA',
    53: 'SMIMEA',
    55: 'HIP',
    56: 'NINFO',
    57: 'RKEY',
    58: 'TALINK',
    59: 'CDS',
    60: 'CDNSKEY',
    61: 'OPENPGPKEY',
    62: 'CSYNC',
    63: 'ZONEMD',
    64: 'SVCB',
    65: 'HTTPS',
    99: 'SPF',
    100: 'UINFO',
    101: 'UID',
    102: 'GID',
    103: 'UNSPEC',
    104: 'NID',
    105: 'L32',
    106: 'L64',
    107: 'LP',
    108: 'EUI48',
    109: 'EUI64',
    249: 'TKEY',
    250: 'TSIG',
    251: 'IXFR',
    252: 'AXFR',
    253: 'MAILB',
    254: 'MAILA',
    255: 'ANY',
    256: 'URI',
    257: 'CAA',
    258: 'AVC',
    259: 'DOA',
    260: 'AMTRELAY',
    32768: 'TA',
    32769: 'DLV'
});

const CLASS_NAMES = Object.freeze({
    1: 'IN',       // Internet
    2: 'CS',       // CSNET (obsolete)
    3: 'CH',       // CHAOS
    4: 'HS',       // Hesiod
    254: 'NONE',   // QCLASS NONE
    255: 'ANY'     // QCLASS ANY
});

export const TYPE = Object.freeze({
    A: 1,
    NS: 2,
    CNAME: 5,
    SOA: 6,
    MX: 15,
    TXT: 16,
    AAAA: 28
});

export const CLAZZ = Object.freeze({
    IN: 1,
    CS: 2,
    CH: 3,
    HS: 4,
    NONE: 254,
    ANY: 255
})

// Models
export class Question {
    constructor(name, type, clazz) {
        this.name = name;
        this.type = type;
        this.clazz = clazz;
    }
}

// Functions
function parseHeaderFlags(buffer) {
    const qr = QR_NAMES[(buffer >> 15) & 1];
    const opcode = OPCODE_NAMES[(buffer >> 11) & 0xF];
    const aa = (buffer >> 10) & 1;
    const tc = (buffer >> 9) & 1;
    const rd = (buffer >> 8) & 1;
    const ra = (buffer >> 7) & 1;
    const rcode = RCODE_NAMES[buffer & 0xF]; 
    return {qr, opcode, aa, tc, rd, ra, rcode};
}

function parseResponseMessage(buffer) {
    const view = new DataView(buffer);
    const transactionID = view.getUint16(0);
    const flags = parseHeaderFlags(view.getUint16(2));
    const qdcount = view.getUint16(4);
    const ancount = view.getUint16(6);
    const arcount = view.getUint16(8);
    const adcount = view.getUint16(10);
    let offset = 12;

    const questions = [];
    for (let i = 0; i < qdcount; i++) {
        const name = parseName(view, offset);
        offset = name.offset;

        const type = TYPE_NAMES[view.getUint16(offset)];
        const clazz = CLASS_NAMES[view.getUint16(offset + 2)];
        offset += 4;

        questions.push({ name: name.name, type, clazz, });
    }

    const answers = [];
    for (let i = 0; i < ancount; i++) {
        const name = parseName(view, offset);
        offset = name.offset;

        const type = TYPE_NAMES[view.getUint16(offset)];
        const clazz = CLASS_NAMES[view.getUint16(offset + 2)];
        const ttl = view.getUint32(offset + 4);
        const dataLength = view.getUint16(offset + 8);
        offset += 10;

        let data = [{key: '', value: ''}];
        if (type === 'A') {
            if (dataLength !== 4) {
                throw new Error('Invalid IPv4 byte array length.');
            }
            const ipv4 = new Uint8Array(view.buffer.slice(offset, offset + dataLength)).join('.');
            data = [{key: 'ipv4', value: ipv4}];
        } else if (type === 'NS' || type === 'CNAME') {
            data = [{key: 'name', value: parseName(view, offset).name}];
        } else if (type === 'SOA') {
            const mname = parseName(view, offset);
            offset = mname.offset;
            const rname = parseName(view, offset);
            offset = rname.offset;
            const serial  = view.getUint32(offset +  0);
            const refresh = view.getUint32(offset +  4);
            const retry   = view.getUint32(offset +  8);
            const expire  = view.getUint32(offset + 12);
            const minimum = view.getUint32(offset + 16);
            offset += 20;
            data = [
                {key: 'mname', value: mname.name},
                {key: 'rname', value: rname.name},
                {key: 'serial', value: serial},
                {key: 'refresh', value: refresh},
                {key: 'retry', value: retry},
                {key: 'expire', value: expire},
                {key: 'minimum', value: minimum}
            ];
        } else if (type === 'MX') {
            const preference = view.getUint16(offset);
            offset += 2;
            const exchange = parseName(view, offset).name;
            data = [
                {key: 'preference', value: preference},
                {key: 'exchange', value: exchange}
            ];
        } else if (type === 'AAAA') {
            if (dataLength !== 16) {
                throw new Error('Invalid IPv6 byte array length.');
            }
            const bytes = new Uint8Array(view.buffer.slice(offset, offset + dataLength));
            const parts = [];
            for (let i = 0; i < 16; i += 2) {
                const part = (bytes[i] << 8) | bytes[i + 1];
                parts.push(part.toString(16));
            }
            const ipv6 = parts.join(':').replace(/(^|:)0(:0)*(:|$)/, '$1::$3').replace(/:{3,4}/, '::');
            data = [{key: 'ipv6', value: ipv6}];
        } else {
            const text = new TextDecoder().decode(view.buffer.slice(offset, offset + dataLength));
            data = [{key: 'text', value: text}];
        }
        offset += dataLength;
        answers.push({ name: name.name, type, clazz, ttl, data });
    }

    return { transactionID, flags, qdcount, ancount, arcount, adcount, questions, answers };
}

function parseQueryMessage(question) {
    const transactionId = crypto.getRandomValues(new Uint8Array(2));
    const flags = new Uint8Array([0x01, 0x00]);
    const qdcount = new Uint8Array([0x00, 0x01]);

    // Split domain name into labels (z.B. "example.com" -> [7, 'example', 3, 'com', 0])
    const labels = question.name.split('.').map(part => {
        const label = new Array(part.length + 1);
        label[0] = part.length;
        for (let i = 0; i < part.length; i++) {
            label[i + 1] = part.charCodeAt(i);
        }
        return label;
    }).flat(Infinity).concat([0]);

    const type = new Uint8Array([0x00, question.type]);
    const clazz = new Uint8Array([0x00, question.clazz]);

    return Uint8Array.from([
        ...transactionId, 
        ...flags, 
        ...qdcount, 
        0x00, 0x00, // ANCOUNT
        0x00, 0x00, // NSCOUNT
        0x00, 0x00, // ARCOUNT
        ...labels,
        ...type,
        ...clazz
    ]);
}

function parseName(view, offset) {
    let labels = [];
    let length = view.getUint8(offset);
    let jumped = false;
    let jumpOffset = 0;

    while (length !== 0) {
        if ((length & 0xc0) === 0xc0) {
            if (!jumped) {
                jumpOffset = offset + 2;
            }
            offset = ((length & 0x3f) << 8) | view.getUint8(offset + 1);
            length = view.getUint8(offset);
            jumped = true;
        } else {
            offset++;
            labels.push(
                new TextDecoder().decode(view.buffer.slice(offset, offset + length))
            );
            offset += length;
            length = view.getUint8(offset);
        }
    }

    if (!jumped) {
        jumpOffset = offset + 1;
    }
    
    return { name: labels.join("."), offset: jumpOffset };
}

export async function query(url, question) {
    let message = '';
    const query = parseQueryMessage(question);
    const start = performance.now();
    
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/dns-message",
        },
        body: query,
    });
    
    const end = performance.now();

    if (!response.ok) {
        throw new Error(`DNS query request failed with status code: ${response.status}`);
    } else {
        const buffer = await response.arrayBuffer();
        message = parseResponseMessage(buffer);
    }

    const latency = Math.round(end - start);
    return { message, latency };
}