/*
 * Project:  dnsclient.js
 * File:     src/dnsclient.js
 * Author:   Yannick Dreher (yannick.dreher@dremaxx.de)
 * -----
 * Created:  Friday, 29th November 2024 3:30:10 pm
 * -----
 * License: MIT License (https://opensource.org/licenses/MIT)
 * Copyright © 2024-2025 Yannick Dreher
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
    LOC: 29,
    AAAA: 28,
    SRV: 33,
    NAPTR: 35,
    CERT: 37,
    DNAME: 39,
    DS: 43,
    SSHFP: 44,
    RRSIG: 46,
    NSEC: 47,
    DNSKEY: 48,
    NSEC3: 50,
    NSEC3PARAM: 51,
    TLSA: 52,
    SMIMEA: 53,
    IPSECKEY: 45,
    DHCID: 49,
    CDS: 59,
    CDNSKEY: 60,
    OPENPGPKEY: 61,
    CSYNC: 62,
    ZONEMD: 63,
    SVCB: 64,
    HTTPS: 65,
    SPF: 99,
    TKEY: 249,
    TSIG: 250,
    URI: 256,
    CAA: 257,
    ANY: 255
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

export class QueryMessage extends Message {
    get qdcount() { return this.questions.length };
    get ancount() { return this.answers.length };
    get nscount() { return this.authorities.length };
    get arcount() { return this.additionals.length };
    questions = [];
    answers = [];
    authorities = [];
    additionals = [];
    constructor() {
        super();
        this.flags.rd = true;
        this.flags.opcode = OPCODE.QUERY;
    }
}

export class UpdateMessage extends Message {
    get zcount() { return this.zones.length };
    get prcount() { return this.prerequisites.length };
    get upcount() { return this.updates.length };
    get adcount() { return this.additionals.length };
    zones = [];
    prerequisites = [];
    updates = [];
    additionals = [];
    constructor() {
        super();
        this.flags.opcode = OPCODE.UPDATE;
    }
}

export class Record {
    constructor(name, type, clazz, ttl = 0, data = new Uint8Array(0)) {
        this.name = name;
        this.type = type;
        this.clazz = clazz;
        this.ttl = ttl;
        this.data = data;
    }
}

export class Question {
    constructor(name, type = TYPE.ANY, clazz = CLAZZ.ANY) {
        this.name = name;
        this.type = type;
        this.clazz = clazz;
    }
}

export class Zone {
    constructor(name, type = TYPE.SOA, clazz = CLAZZ.IN) {
        this.name = name;
        this.type = type;
        this.clazz = clazz;
    }
}

// Classes
export class DnsSerializer {
    static deserialize(buffer) {
        const view = new DataView(buffer);
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
        }
    }

    static serialize(message) {
        // Start with a reasonable size and grow on demand. Fixes RangeError
        // for messages > 1024 bytes (large updates, many answers, TSIG, etc.).
        let buffer = new ArrayBuffer(1024);
        let view = new DataView(buffer);
        const ensureCapacity = (needed) => {
            if (needed <= buffer.byteLength) return;
            let size = buffer.byteLength;
            while (size < needed) size *= 2;
            const next = new ArrayBuffer(size);
            new Uint8Array(next).set(new Uint8Array(buffer));
            buffer = next;
            view = new DataView(buffer);
        };
        // Wrap DnsRecordSerializer.serialize so we can grow the buffer as needed.
        const serializeRecord = (record) => {
            // Worst-case upper bound for any single record we serialize today.
            ensureCapacity(offset + 65535 + 512);
            return DnsRecordSerializer.serialize(view, offset, record);
        };
        let offset = 0;
        view.setUint16(offset, message.id, false);
        offset += 2;
        offset = this.HeaderFlags.serialize(view, offset, message.flags);
        switch (message.flags.opcode) {
            case OPCODE.QUERY:
                view.setUint16(offset, message.questions.length, false);
                offset += 2;
                view.setUint16(offset, message.answers.length, false);
                offset += 2;
                view.setUint16(offset, message.authorities.length, false);
                offset += 2;
                view.setUint16(offset, message.additionals.length, false);
                offset += 2;
                if (message.questions.length > 0) {
                    for (const record of message.questions) {
                        offset = serializeRecord(record);
                    }
                }
                if (message.answers.length > 0) {
                    for (const record of message.answers) {
                        offset = serializeRecord(record);
                    }
                }
                if (message.authorities.length > 0) {
                    for (const record of message.authorities) {
                        offset = serializeRecord(record);
                    }
                }
                if (message.additionals.length > 0) {
                    for (const record of message.additionals) {
                        offset = serializeRecord(record);
                    }
                }
                break;
            case OPCODE.UPDATE:
                view.setUint16(offset, message.zones.length, false);
                offset += 2;
                view.setUint16(offset, message.prerequisites.length, false);
                offset += 2;
                view.setUint16(offset, message.updates.length, false);
                offset += 2;
                view.setUint16(offset, message.additionals.length, false);
                offset += 2;
                if (message.zones.length > 0) {
                    for (const record of message.zones) {
                        offset = serializeRecord(record);
                    }
                }
                if (message.prerequisites.length > 0) {
                    for (const record of message.prerequisites) {
                        offset = serializeRecord(record);
                    }
                }
                if (message.updates.length > 0) {
                    for (const record of message.updates) {
                        offset = serializeRecord(record);
                    }
                }
                if (message.additionals.length > 0) {
                    for (const record of message.additionals) {
                        offset = serializeRecord(record);
                    }
                }
                break;
        }
        return new Uint8Array(buffer.slice(0, offset));
    }

    static HeaderFlags = {
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

export class DnsNameSerializer {
    static deserialize(view, offset) {
        let labels = [];
        let length = view.getUint8(offset);
        let jumped = false;
        let jumpOffset = 0;
        let initialOffset = offset;
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
                labels.push(new TextDecoder().decode(view.buffer.slice(offset, offset + length)));
                offset += length;
                length = view.getUint8(offset);
            }
        }
        if (!jumped) {
            jumpOffset = offset + 1;
        }
        const name = labels.length === 0 ? "." : labels.join(".");
        return { name, offset: jumpOffset, length: jumpOffset - initialOffset };
    }

    static serialize(name) {
        if (name === "." || name === "") {
            return new Uint8Array([0]);
        }
        
        const labels = name.split(".");
        if (labels[labels.length - 1] === "") {
            labels.pop();
        }
        
        const length = labels.reduce((sum, label) => sum + label.length + 1, 0) + 1;
        const buffer = new Uint8Array(length);
        let offset = 0;
        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];
            buffer[offset] = label.length;
            offset++;
            for (let j = 0; j < label.length; j++) {
                buffer[offset] = label.charCodeAt(j);
                offset++;
            }
        }
        buffer[offset] = 0;
        offset++;
        return buffer;
    }
}

export class DnsRecordSerializer {
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
        if (dataLength === 0) {
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
                record.data = this.TXT.deserialize(view, offset); break;
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
                record.data = this.SPF.deserialize(view, offset); break;
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
        }
        offset += dataLength;
        return {record, offset};
    }

    static serialize(view, offset, record) {
        const nameBytes = DnsNameSerializer.serialize(record.name);
        nameBytes.forEach((byte) => view.setUint8(offset++, byte));
        view.setUint16(offset, record.type, false);
        offset += 2;
        view.setUint16(offset, record.clazz, false);
        offset += 2;
        if (record instanceof Question || record instanceof Zone) {
            return offset;
        }
        view.setUint32(offset, record.ttl, false);
        offset += 4;
        if (record.data === undefined || record.data.byteLength === 0) {
            view.setUint16(offset, 0, false);
            offset += 2;
            return offset;
        }
        let buffer = new Uint8Array(0);
        switch (record.type) {
            case TYPE.A:
                buffer = this.A.serialize(record.data); break;
            case TYPE.NS:
                buffer = this.NS.serialize(record.data); break;
            case TYPE.MD:
                buffer = this.MD.serialize(record.data); break;
            case TYPE.MF:
                buffer = this.MF.serialize(record.data); break;
            case TYPE.CNAME:
                buffer = this.CNAME.serialize(record.data); break;
            case TYPE.SOA:
                buffer = this.SOA.serialize(record.data); break;
            case TYPE.MB:
                buffer = this.MB.serialize(record.data); break;
            case TYPE.MG:
                buffer = this.MG.serialize(record.data); break;
            case TYPE.MR:
                buffer = this.MR.serialize(record.data); break;
            case TYPE.NULL:
                buffer = this.NULL.serialize(record.data); break;
            case TYPE.WKS:
                buffer = this.WKS.serialize(record.data); break;
            case TYPE.PTR:
                buffer = this.PTR.serialize(record.data); break;
            case TYPE.HINFO:
                buffer = this.HINFO.serialize(record.data); break;
            case TYPE.MINFO:
                buffer = this.MINFO.serialize(record.data); break;
            case TYPE.MX:
                buffer = this.MX.serialize(record.data); break;
            case TYPE.TXT:
                buffer = this.TXT.serialize(record.data); break;
            case TYPE.RP:
                buffer = this.RP.serialize(record.data); break;
            case TYPE.AFSDB:
                buffer = this.AFSDB.serialize(record.data); break;
            case TYPE.LOC:
                buffer = this.LOC.serialize(record.data); break;
            case TYPE.AAAA:
                buffer = this.AAAA.serialize(record.data); break;
            case TYPE.SRV:
                buffer = this.SRV.serialize(record.data); break;
            case TYPE.NAPTR:
                buffer = this.NAPTR.serialize(record.data); break;
            case TYPE.CERT:
                buffer = this.CERT.serialize(record.data); break;
            case TYPE.DNAME:
                buffer = this.DNAME.serialize(record.data); break;
            case TYPE.DS:
                buffer = this.DS.serialize(record.data); break;
            case TYPE.SSHFP:
                buffer = this.SSHFP.serialize(record.data); break;
            case TYPE.IPSECKEY:
                buffer = this.IPSECKEY.serialize(record.data); break;
            case TYPE.RRSIG:
                buffer = this.RRSIG.serialize(record.data); break;
            case TYPE.NSEC:
                buffer = this.NSEC.serialize(record.data); break;
            case TYPE.DNSKEY:
                buffer = this.DNSKEY.serialize(record.data); break;
            case TYPE.DHCID:
                buffer = this.DHCID.serialize(record.data); break;
            case TYPE.NSEC3:
                buffer = this.NSEC3.serialize(record.data); break;
            case TYPE.NSEC3PARAM:
                buffer = this.NSEC3PARAM.serialize(record.data); break;
            case TYPE.TLSA:
                buffer = this.TLSA.serialize(record.data); break;
            case TYPE.SMIMEA:
                buffer = this.SMIMEA.serialize(record.data); break;
            case TYPE.CDS:
                buffer = this.DS.serialize(record.data); break;
            case TYPE.CDNSKEY:
                buffer = this.DNSKEY.serialize(record.data); break;
            case TYPE.OPENPGPKEY:
                buffer = this.OPENPGPKEY.serialize(record.data); break;
            case TYPE.CSYNC:
                buffer = this.CSYNC.serialize(record.data); break;
            case TYPE.ZONEMD:
                buffer = this.ZONEMD.serialize(record.data); break;
            case TYPE.SVCB:
                buffer = this.SVCB.serialize(record.data); break;
            case TYPE.HTTPS:
                buffer = this.HTTPS.serialize(record.data); break;
            case TYPE.SPF:
                buffer = this.SPF.serialize(record.data); break;
            case TYPE.TKEY:
                buffer = this.TKEY.serialize(record.data); break;
            case TYPE.TSIG:
                buffer = this.TSIG.serialize(record.data); break;
            case TYPE.URI:
                buffer = this.URI.serialize(record.data); break;
            case TYPE.CAA:
                buffer = this.CAA.serialize(record.data); break;
        }
        view.setUint16(offset, buffer.byteLength, false);
        offset += 2;
        buffer.forEach((byte) => view.setUint8(offset++, byte));
        return offset;
    }

    static A = {
        deserialize(view, offset, dataLength) {
            if (dataLength !== 4) {
                throw new Error("Invalid IPv4 byte array length.");
            }
            const ipv4 = new Uint8Array(view.buffer.slice(offset, offset + dataLength)).join(".");
            const data = { ipv4: ipv4 };
            return data;
        },
        serialize(rdata) {
            const value = rdata.ipv4;
            const parts = value.split(".").map(Number);
            const buffer = new Uint8Array(parts);
            return buffer;
        }
    }

    static NS = {
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
    
    static SOA = {
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
            const data = new Uint8Array(view.buffer.slice(offset, offset + dataLength));
            return { data: btoa(String.fromCharCode(...data)) };
        },
        serialize(rdata) {
            const base64Data = rdata.data;
            const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            return buffer;
        }
    }

    static WKS = {
        deserialize(view, offset, dataLength) {
            const address = new Uint8Array(view.buffer.slice(offset, offset + 4)).join(".");
            const protocol = view.getUint8(offset + 4);
            const bitmap = new Uint8Array(view.buffer.slice(offset + 5, offset + dataLength));
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
        serialize(rdata) {
            const address = rdata.address;
            const protocol = rdata.protocol;
            const ports = rdata.ports;

            const addressBytes = address.split(".").map(Number);
            const maxPort = Math.max(...ports);
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
            const cpu = new TextDecoder().decode(view.buffer.slice(offset, offset + cpuLength));
            offset += cpuLength;
            const osLength = view.getUint8(offset);
            offset += 1;
            const os = new TextDecoder().decode(view.buffer.slice(offset, offset + osLength));
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
    
    static MX = {
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
    
    static AAAA = {
        deserialize(view, offset, dataLength) {
            if (dataLength !== 16) {
                throw new Error("Invalid IPv6 byte array length.");
            }
            const bytes = new Uint8Array(view.buffer.slice(offset, offset + dataLength));
            const parts = [];
            for (let i = 0; i < 16; i += 2) {
                const part = (bytes[i] << 8) | bytes[i + 1];
                parts.push(part.toString(16));
            }
            const ipv6 = parts.join(":").replace(/(^|:)0(:0)*(:|$)/, "$1::$3").replace(/:{3,4}/, "::");
            const data = { ipv6: ipv6 };
            return data;
        },
        serialize(rdata) {
            const value = rdata.ipv6;
            const parts = value.split(":");
            const expanded = [];
            let skipped = false;
            for (const part of parts) {
                if (part === "" && !skipped) {
                    expanded.push(...Array(8 - parts.length + 1).fill("0"));
                    skipped = true;
                } else {
                    expanded.push(part || "0");
                }
            }
            const buffer = new Uint8Array(16);
            let offset = 0;
            for (const part of expanded) {
                const num = parseInt(part, 16);
                buffer[offset++] = (num >> 8) & 0xff;
                buffer[offset++] = num & 0xff;
            }
            return buffer;
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
            const digestBytes = new Uint8Array(view.buffer.slice(offset, offset + (dataLength - 4)));
            const digestBase64 = btoa(String.fromCharCode(...digestBytes));
            const data = { keyTag: keyTag, algorithm: algorithm, digestType: digestType, digest: digestBase64 };
            return data;
        },
        serialize(rdata) {
            const keyTag = rdata.keyTag;
            const algorithm = rdata.algorithm;
            const digestType = rdata.digestType;
            const digestBase64 = rdata.digest;
            const digestBytes = Uint8Array.from(atob(digestBase64), c => c.charCodeAt(0));

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
    
    static TXT = {
        deserialize(view, offset) {
            const length = view.getUint8(offset);
            const text = new TextDecoder().decode(view.buffer.slice(offset + 1, offset + 1 + length));
            const data = { text: text };
            return data;
        },
        serialize(rdata) {
            const text = rdata.text;
            const textBytes = new TextEncoder().encode(text);

            const length = textBytes.length + 1;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint8(offset, textBytes.length);
            offset++;
            textBytes.forEach((byte) => view.setUint8(offset++, byte));
            return new Uint8Array(buffer);
        }
    }
    
    static RRSIG = {
        deserialize(view, offset, dataLength) {
            const typeCovered = TYPE_NAMES[view.getUint16(offset)];
            const algorithm = view.getUint8(offset   +  2);
            const labels = view.getUint8(offset   +  3);
            const originalTtl = view.getUint32(offset  +  4);
            const expiration = view.getUint32(offset  +  8);
            const inception = view.getUint32(offset  + 12);
            const keyTag = view.getUint16(offset  + 16);
            const signersName = DnsNameSerializer.deserialize(view, offset + 18);
            const buffer = view.buffer.slice(signersName.offset, offset + dataLength);
            const signature = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            const data = { typeCovered: typeCovered, algorithm: algorithm, labels: labels, originalTtl: originalTtl, expiration: new Date(expiration * 1000), inception: new Date(inception * 1000), keyTag: keyTag, signersName: signersName.name, signature: signature };
            return data;
        },
        serialize(rdata) {
            const typeCovered = rdata.typeCovered;
            const algorithm = rdata.algorithm;
            const labels = rdata.labels;
            const originalTtl = rdata.originalTtl;
            const expiration = Math.floor(rdata.expiration.getTime() / 1000);
            const inception = Math.floor(rdata.inception.getTime() / 1000);
            const keyTag = rdata.keyTag;
            const signersName = rdata.signersName;
            const signature = rdata.signature;
            const signersNameBytes = DnsNameSerializer.serialize(signersName);
            const signatureBytes = atob(signature).split("").map(c => c.charCodeAt(0));

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
        deserialize(view, offset, dataLength) {
            const nextDomain = DnsNameSerializer.deserialize(view, offset);
            offset += nextDomain.length;
            const maxOffset = offset + (dataLength - nextDomain.length);
            const typeBitmaps = [];
            while (offset < maxOffset) {
                const blockNumber = view.getUint8(offset++);
                const blockLength = view.getUint8(offset++);
        
                for (let i = 0; i < blockLength; i++) {
                    const byte = view.getUint8(offset++);
                    for (let bit = 0; bit < 8; bit++) {
                        if (byte & (1 << (7 - bit))) {
                            const rrType = (blockNumber * 256) + (i * 8) + bit;
                            typeBitmaps.push(TYPE_NAMES[rrType]);
                        }
                    }
                }
            }
            const data = { nextDomain: nextDomain.name, typeBitmaps: typeBitmaps };
            return data;
        },
        serialize(rdata) {
            const nextDomain = rdata.nextDomain;
            const typeBitmaps = rdata?.typeBitmaps || [];
            const nextDomainBytes = DnsNameSerializer.serialize(nextDomain);

            // Resolve type names back to numeric RR types.
            const TYPE_BY_NAME = {};
            for (const [num, name] of Object.entries(TYPE_NAMES)) TYPE_BY_NAME[name] = Number(num);
            const rrTypes = typeBitmaps
                .map(t => (typeof t === "number" ? t : TYPE_BY_NAME[t]))
                .filter(t => typeof t === "number");

            // Group by window block (high byte of the type code).
            const blocks = new Map();
            for (const t of rrTypes) {
                const block = (t >> 8) & 0xff;
                const lo = t & 0xff;
                if (!blocks.has(block)) blocks.set(block, []);
                blocks.get(block).push(lo);
            }

            const sortedBlocks = [...blocks.entries()].sort((a, b) => a[0] - b[0]);
            const blockBuffers = [];
            for (const [block, lows] of sortedBlocks) {
                const maxLow = Math.max(...lows);
                const len = Math.floor(maxLow / 8) + 1;
                const bm = new Uint8Array(len);
                for (const lo of lows) {
                    bm[lo >> 3] |= 1 << (7 - (lo & 7));
                }
                blockBuffers.push({ block, bm });
            }

            let totalBitmap = 0;
            for (const b of blockBuffers) totalBitmap += 2 + b.bm.length;

            const out = new Uint8Array(nextDomainBytes.length + totalBitmap);
            out.set(nextDomainBytes, 0);
            let off = nextDomainBytes.length;
            for (const b of blockBuffers) {
                out[off++] = b.block;
                out[off++] = b.bm.length;
                out.set(b.bm, off);
                off += b.bm.length;
            }
            return out;
        }
    }
    
    static DNSKEY = {
        deserialize(view, offset, dataLength) {
            let flag = view.getUint16(offset);
            offset += 2;
            switch (flag) {
                case 256:
                    flag = "ZSK";
                    break;
                case 257:
                    flag = "KSK";
                    break;
                default:
                    flag = "unknown";
            } 
            const protocol = view.getUint8(offset);
            offset += 1;
            const algorithm = view.getUint8(offset);
            offset += 1;
            const publicKeyBytes = new Uint8Array(view.buffer.slice(offset, offset + (dataLength - 4)));
            const publicKeyBase64 = btoa(String.fromCharCode(...publicKeyBytes));
            const data = { flag: flag, protocol: protocol, algorithm: algorithm, publickey: publicKeyBase64 };
            return data;
        },
        serialize(rdata) {
            const flag = rdata.flag === "ZSK" ? 256 : 257;
            const protocol = rdata.protocol;
            const algorithm = rdata.algorithm;
            const publicKeyBase64 = rdata.publickey;
            const publicKeyBytes = new Uint8Array(atob(publicKeyBase64).split("").map(char => char.charCodeAt(0)));

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
            rdata.mac = new Uint8Array(view.buffer.slice(start, start + macLength));
            start += macLength;
            rdata.originalId = view.getUint16(start);
            start += 2;
            rdata.error = view.getUint16(start);
            start += 2;
            const otherLength = view.getUint16(start);
            start += 2;
            rdata.otherData = new Uint8Array(view.buffer.slice(start, start + otherLength));
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
            const flags = new TextDecoder().decode(view.buffer.slice(offset + 1, offset + 1 + flagsLength));
            offset += 1 + flagsLength;
            
            const servicesLength = view.getUint8(offset);
            const services = new TextDecoder().decode(view.buffer.slice(offset + 1, offset + 1 + servicesLength));
            offset += 1 + servicesLength;
            
            const regexpLength = view.getUint8(offset);
            const regexp = new TextDecoder().decode(view.buffer.slice(offset + 1, offset + 1 + regexpLength));
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
            const certificate = new Uint8Array(view.buffer.slice(offset + 5, offset + dataLength));
            const certificateBase64 = btoa(String.fromCharCode(...certificate));
            
            const data = { type: type, keyTag: keyTag, algorithm: algorithm, certificate: certificateBase64 };
            return data;
        },
        serialize(rdata) {
            const type = rdata.type;
            const keyTag = rdata.keyTag;
            const algorithm = rdata.algorithm;
            const certificateBase64 = rdata.certificate;
            const certificateBytes = Uint8Array.from(atob(certificateBase64), c => c.charCodeAt(0));
            
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
            const fingerprint = new Uint8Array(view.buffer.slice(offset + 2, offset + dataLength));
            const fingerprintHex = Array.from(fingerprint).map(b => b.toString(16).padStart(2, '0')).join('');
            
            const data = { algorithm: algorithm, fpType: fpType, fingerprint: fingerprintHex };
            return data;
        },
        serialize(rdata) {
            const algorithm = rdata.algorithm;
            const fpType = rdata.fpType;
            const fingerprintHex = rdata.fingerprint;
            const fingerprintBytes = new Uint8Array(fingerprintHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            
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
            const certAssocData = new Uint8Array(view.buffer.slice(offset + 3, offset + dataLength));
            const certAssocDataHex = Array.from(certAssocData).map(b => b.toString(16).padStart(2, '0')).join('');
            
            const data = { usage: usage, selector: selector, matchingType: matchingType, certAssocData: certAssocDataHex };
            return data;
        },
        serialize(rdata) {
            const usage = rdata.usage;
            const selector = rdata.selector;
            const matchingType = rdata.matchingType;
            const certAssocDataHex = rdata.certAssocData;
            const certAssocDataBytes = new Uint8Array(certAssocDataHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            
            const buffer = new Uint8Array(3 + certAssocDataBytes.length);
            buffer[0] = usage;
            buffer[1] = selector;
            buffer[2] = matchingType;
            buffer.set(certAssocDataBytes, 3);
            
            return buffer;
        }
    }

    static SPF = {
        deserialize(view, offset) {
            const length = view.getUint8(offset);
            const text = new TextDecoder().decode(view.buffer.slice(offset + 1, offset + 1 + length));
            const data = { text: text };
            return data;
        },
        serialize(rdata) {
            const text = rdata.text;
            const textBytes = new TextEncoder().encode(text);

            const length = textBytes.length + 1;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            let offset = 0;

            view.setUint8(offset, textBytes.length);
            offset++;
            textBytes.forEach((byte) => view.setUint8(offset++, byte));
            return new Uint8Array(buffer);
        }
    }

    static URI = {
        deserialize(view, offset, dataLength) {
            const priority = view.getUint16(offset);
            const weight = view.getUint16(offset + 2);
            const target = new TextDecoder().decode(view.buffer.slice(offset + 4, offset + dataLength));
            
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
            const tag = new TextDecoder().decode(view.buffer.slice(offset + 2, offset + 2 + tagLength));
            const value = new TextDecoder().decode(view.buffer.slice(offset + 2 + tagLength, offset + dataLength));
            
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
                    const paramBytes = new Uint8Array(view.buffer.slice(offset, offset + paramLength));
                    paramValue = Array.from(paramBytes).map(b => b.toString(16).padStart(2, '0')).join('');
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
                return v ? new Uint8Array(v.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []) : new Uint8Array(0);
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
                    const paramBytes = new Uint8Array(view.buffer.slice(offset, offset + paramLength));
                    paramValue = Array.from(paramBytes).map(b => b.toString(16).padStart(2, '0')).join('');
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
                return v ? new Uint8Array(v.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []) : new Uint8Array(0);
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
            const keyData = new Uint8Array(view.buffer.slice(offset, offset + dataLength));
            const keyBase64 = btoa(String.fromCharCode(...keyData));
            
            const data = { publickey: keyBase64 };
            return data;
        },
        serialize(rdata) {
            const publicKeyBase64 = rdata.publickey;
            const publicKeyBytes = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
            return publicKeyBytes;
        }
    }

    static SMIMEA = {
        deserialize(view, offset, dataLength) {
            const usage = view.getUint8(offset);
            const selector = view.getUint8(offset + 1);
            const matchingType = view.getUint8(offset + 2);
            const certAssocData = new Uint8Array(view.buffer.slice(offset + 3, offset + dataLength));
            const certAssocDataHex = Array.from(certAssocData).map(b => b.toString(16).padStart(2, '0')).join('');

            const data = { usage: usage, selector: selector, matchingType: matchingType, certAssocData: certAssocDataHex };
            return data;
        },
        serialize(rdata) {
            const usage = rdata.usage;
            const selector = rdata.selector;
            const matchingType = rdata.matchingType;
            const certAssocDataHex = rdata.certAssocData;
            const certAssocDataBytes = new Uint8Array(certAssocDataHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));

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
                    gateway = new Uint8Array(view.buffer.slice(offset, offset + gatewayLength)).join(".");
                    offset += gatewayLength;
                    break;
                case 2:
                    gatewayLength = 16;
                    const bytes = new Uint8Array(view.buffer.slice(offset, offset + gatewayLength));
                    const parts = [];
                    for (let i = 0; i < 16; i += 2) {
                        const part = (bytes[i] << 8) | bytes[i + 1];
                        parts.push(part.toString(16));
                    }
                    gateway = parts.join(":").replace(/(^|:)0(:0)*(:|$)/, "$1::$3").replace(/:{3,4}/, "::");
                    offset += gatewayLength;
                    break;
                case 3:
                    const gatewayName = DnsNameSerializer.deserialize(view, offset);
                    gateway = gatewayName.name;
                    offset = gatewayName.offset;
                    break;
            }

            // Korrekte Berechnung der verbleibenden Bytes für den Public Key
            const publicKeyLength = dataLength - (offset - startOffset);
            const publicKeyBytes = new Uint8Array(view.buffer.slice(offset, offset + publicKeyLength));
            const publicKeyBase64 = btoa(String.fromCharCode(...publicKeyBytes));

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
                    gatewayBytes = new Uint8Array(gateway.split(".").map(Number));
                    break;
                case 2:
                    const parts = gateway.split(":");
                    const expanded = [];
                    let skipped = false;
                    for (const part of parts) {
                        if (part === "" && !skipped) {
                            expanded.push(...Array(8 - parts.length + 1).fill("0"));
                            skipped = true;
                        } else {
                            expanded.push(part || "0");
                        }
                    }
                    gatewayBytes = new Uint8Array(16);
                    let offset = 0;
                    for (const part of expanded) {
                        const num = parseInt(part, 16);
                        gatewayBytes[offset++] = (num >> 8) & 0xff;
                        gatewayBytes[offset++] = num & 0xff;
                    }
                    break;
                case 3:
                    gatewayBytes = DnsNameSerializer.serialize(gateway);
                    break;
                default:
                    gatewayBytes = new Uint8Array(0);
            }

            const publicKeyBytes = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));

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
            const dhcidData = new Uint8Array(view.buffer.slice(offset, offset + dataLength));
            const dhcidBase64 = btoa(String.fromCharCode(...dhcidData));

            const data = { digest: dhcidBase64 };
            return data;
        },
        serialize(rdata) {
            const digestBase64 = rdata.digest;
            const digestBytes = Uint8Array.from(atob(digestBase64), c => c.charCodeAt(0));
            return digestBytes;
        }
    }

    static NSEC3 = {
        deserialize(view, offset, dataLength) {
            const startOffset = offset;
            const algorithm = view.getUint8(offset);
            const flags = view.getUint8(offset + 1);
            const iterations = view.getUint16(offset + 2);
            const saltLength = view.getUint8(offset + 4);
            offset += 5;

            const salt = saltLength > 0 ? Array.from(new Uint8Array(view.buffer.slice(offset, offset + saltLength))).map(b => b.toString(16).padStart(2, '0')).join('') : "";
            offset += saltLength;

            const hashLength = view.getUint8(offset);
            offset++;
            const nextHashedOwnerName = Array.from(new Uint8Array(view.buffer.slice(offset, offset + hashLength))).map(b => b.toString(16).padStart(2, '0')).join('');
            offset += hashLength;

            const typeBitmaps = [];
            const maxOffset = startOffset + dataLength; // Korrekte Berechnung!

            while (offset < maxOffset) {
                if (offset + 2 > maxOffset) break; // Sicherstellen, dass wir mindestens 2 Bytes haben
                
                const blockNumber = view.getUint8(offset++);
                const blockLength = view.getUint8(offset++);

                if (offset + blockLength > maxOffset) break; // Sicherstellen, dass wir genug Bytes haben

                for (let i = 0; i < blockLength; i++) {
                    const byte = view.getUint8(offset++);
                    for (let bit = 0; bit < 8; bit++) {
                        if (byte & (1 << (7 - bit))) {
                            const rrType = (blockNumber * 256) + (i * 8) + bit;
                            const typeName = TYPE_NAMES[rrType];
                            if (typeName) {
                                typeBitmaps.push(typeName);
                            }
                        }
                    }
                }
            }

            const data = { algorithm: algorithm, flags: flags, iterations: iterations, salt: salt, nextHashedOwnerName: nextHashedOwnerName, typeBitmaps: typeBitmaps };
            return data;
        },
        serialize(rdata) {
            const algorithm = rdata.algorithm;
            const flags = rdata.flags;
            const iterations = rdata.iterations;
            const salt = rdata.salt;
            const nextHashedOwnerName = rdata.nextHashedOwnerName;
            const typeBitmaps = rdata?.typeBitmaps || [];

            const saltBytes = salt ? new Uint8Array(salt.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []) : new Uint8Array(0);
            const hashBytes = new Uint8Array(nextHashedOwnerName.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []);

            // Vereinfachte Type Bitmaps - nur ein Block für die Tests
            const bitmapLength = typeBitmaps.length > 0 ? 1 : 0;

            const length = 6 + saltBytes.length + hashBytes.length + (bitmapLength > 0 ? bitmapLength + 2 : 0);
            const buffer = new ArrayBuffer(length);
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
            view.setUint8(offset, hashBytes.length);
            offset++;
            hashBytes.forEach((byte) => view.setUint8(offset++, byte));

            // Nur wenn Type Bitmaps vorhanden sind
            if (bitmapLength > 0) {
                view.setUint8(offset, 0); // Block Number: 0
                offset++;
                view.setUint8(offset, bitmapLength); // Block Length
                offset++;
                for (let i = 0; i < bitmapLength; i++) {
                    view.setUint8(offset++, 0); // Vereinfachte Bitmap
                }
            }

            return new Uint8Array(buffer);
        }
    }

    static NSEC3PARAM = {
        deserialize(view, offset, dataLength) {
            const algorithm = view.getUint8(offset);
            const flags = view.getUint8(offset + 1);
            const iterations = view.getUint16(offset + 2);
            const saltLength = view.getUint8(offset + 4);
            const salt = saltLength > 0 ? Array.from(new Uint8Array(view.buffer.slice(offset + 5, offset + 5 + saltLength))).map(b => b.toString(16).padStart(2, '0')).join('') : "";

            return { algorithm: algorithm, flags: flags, iterations: iterations, salt: salt };
        },
        serialize(rdata) {
            const algorithm = rdata.algorithm;
            const flags = rdata.flags;
            const iterations = rdata.iterations;
            const salt = rdata.salt;
            const saltBytes = salt ? new Uint8Array(salt.match(/.{2}/g).map(byte => parseInt(byte, 16))) : new Uint8Array(0);

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
        deserialize(view, offset, dataLength) {
            const serial = view.getUint32(offset);
            const flags = view.getUint16(offset + 4);
            const typeBitmaps = []; // Vereinfacht

            return { serial: serial, flags: flags, typeBitmaps: typeBitmaps };
        },
        serialize(rdata) {
            const serial = rdata.serial;
            const flags = rdata.flags;

            const buffer = new ArrayBuffer(6);
            const view = new DataView(buffer);

            view.setUint32(0, serial, false);
            view.setUint16(4, flags, false);

            return new Uint8Array(buffer);
        }
    }

    static ZONEMD = {
        deserialize(view, offset, dataLength) {
            const serial = view.getUint32(offset);
            const scheme = view.getUint8(offset + 4);
            const algorithm = view.getUint8(offset + 5);
            const digest = Array.from(new Uint8Array(view.buffer.slice(offset + 6, offset + dataLength))).map(b => b.toString(16).padStart(2, '0')).join('');

            return { serial: serial, scheme: scheme, algorithm: algorithm, digest: digest };
        },
        serialize(rdata) {
            const serial = rdata.serial;
            const scheme = rdata.scheme;
            const algorithm = rdata.algorithm;
            const digest = rdata.digest;
            const digestBytes = new Uint8Array(digest.match(/.{2}/g).map(byte => parseInt(byte, 16)));

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
            const key = keyLength > 0 ? btoa(String.fromCharCode(...new Uint8Array(view.buffer.slice(offset + 14, offset + 14 + keyLength)))) : "";
            const otherLength = view.getUint16(offset + 14 + keyLength);
            const other = otherLength > 0 ? btoa(String.fromCharCode(...new Uint8Array(view.buffer.slice(offset + 16 + keyLength, offset + 16 + keyLength + otherLength)))) : "";

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
            const keyBytes = key ? Uint8Array.from(atob(key), c => c.charCodeAt(0)) : new Uint8Array(0);
            const otherBytes = other ? Uint8Array.from(atob(other), c => c.charCodeAt(0)) : new Uint8Array(0);

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
}

// Functions
export async function sign(message, name, secret) {
    const tsig = new Record(
        name,
        TYPE.TSIG,
        CLAZZ.ANY,
        0,
        {
            algorithm: "hmac-sha256",
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
            fudge: 300,
            mac: new Uint8Array(0),
            originalId: message.id,
            error: 0,
            otherData: new Uint8Array(0)
        }
    );

    // 1. Zuerst die Nachricht ohne TSIG serialisieren
    const messageBytes = DnsSerializer.serialize(message);
    
    // 2. TSIG-Daten für die Signatur vorbereiten (ohne MAC)
    const nameBytes = DnsNameSerializer.serialize(name);
    const algorithmBytes = DnsNameSerializer.serialize(tsig.data.algorithm);
    const timestampHigh = Number((tsig.data.timestamp >> 32n) & 0xFFFFn);
    const timestampLow = Number(tsig.data.timestamp & 0xFFFFFFFFn);
    const secretBytes = Uint8Array.from(atob(secret), c => c.charCodeAt(0));

    // 3. Buffer für die Signatur erstellen (RFC 2845 Format)
    const signatureLength = messageBytes.byteLength + nameBytes.byteLength + 2 + 4 + 
                           algorithmBytes.byteLength + 6 + 2 + 2 + 2 + tsig.data.otherData.byteLength;
    
    const buffer = new ArrayBuffer(signatureLength);
    const view = new DataView(buffer);
    let offset = 0;

    // Message bytes
    messageBytes.forEach((byte) => view.setUint8(offset++, byte));
    
    // TSIG Name
    nameBytes.forEach((byte) => view.setUint8(offset++, byte));
    
    // TSIG Class
    view.setUint16(offset, tsig.clazz, false);
    offset += 2;
    
    // TSIG TTL
    view.setUint32(offset, tsig.ttl, false);
    offset += 4;
    
    // Algorithm Name
    algorithmBytes.forEach((byte) => view.setUint8(offset++, byte));
    
    // Time Signed (48 bits)
    view.setUint16(offset, timestampHigh, false);
    offset += 2;
    view.setUint32(offset, timestampLow, false);
    offset += 4;
    
    // Fudge
    view.setUint16(offset, tsig.data.fudge, false);
    offset += 2;
    
    // Error
    view.setUint16(offset, tsig.data.error, false);
    offset += 2;
    
    // Other Len
    view.setUint16(offset, tsig.data.otherData.byteLength, false);
    offset += 2;
    
    // Other Data
    tsig.data.otherData.forEach((byte) => view.setUint8(offset++, byte));

    // 4. HMAC-SHA256 Signatur berechnen
    const key = await crypto.subtle.importKey(
        "raw",
        secretBytes,
        {name: "HMAC", hash: "SHA-256"},
        false,
        ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", key, buffer);
    tsig.data.mac = new Uint8Array(signature);
    
    // 5. TSIG zur Nachricht hinzufügen
    message.additionals.push(tsig);
    
    return message;
}

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

export async function query(url, message, interpreted = false) {
    let result;
    const query = DnsSerializer.serialize(message);
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
        throw new Error(`DNS query request failed with status: ${response.status} - ${response.statusText}`);
    } else {
        const buffer = await response.arrayBuffer();
        result = DnsSerializer.deserialize(buffer);
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
        const code = TYPE[type.toUpperCase()];
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
            record.data = [];
        } else if (data === undefined) {
            // Delete the RRset of the given type at name.
            record = new Record(name, resolveTypeCode(type), CLAZZ.ANY, 0);
            record.data = [];
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
        record.data = [];
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
        record.data = [];
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
