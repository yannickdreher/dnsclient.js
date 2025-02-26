/*
 * Project:  dnsclient.js
 * File:     src/dnsclient.js
 * Author:   Yannick Dreher (yannick.dreher@dremaxx.de)
 * -----
 * Created:  Friday, 29th November 2024 3:30:10 pm
 * Modified: Friday, 07th February 2025 06:35:26 pm
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
    CNAME: 5,
    SOA: 6,
    HINFO: 13,
    MX: 15,
    TXT: 16,
    AAAA: 28,
    SRV: 33,
    DS: 43,
    RRSIG: 46,
    NSEC: 47,
    DNSKEY: 48,
    CDS: 59,
    CDNSKEY: 60,
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

// Models
export class Message {
    id = Math.floor(Math.random() * 0x10000);
    flags = {
        qr: 0,
        opcode: 0,
        aa: 0,
        tc: 0,
        rd: 0,
        ra: 0,
        rcode: 0
    };
    questions = [];
    answers = [];
    authorities = [];
    additionals = [];
}

export class Record {
    name = "";
    type = TYPE.ANY;
    clazz = CLAZZ.ANY;
    ttl = 0;
    data  = [];
}

export class Question {
    constructor(name = "", type = TYPE.ANY, clazz = CLAZZ.ANY) {
        this.name = name;
        this.type = type;
        this.clazz = clazz;
    }
}

// Classes
export class DnsSerializer {
    static deserialize(buffer) {
        const view = new DataView(buffer);
        const message = new Message();
        message.id = view.getUint16(0);
        message.flags = this.HeaderFlags.deserialize(view.getUint16(2));
        const qdcount = view.getUint16(4);
        const ancount = view.getUint16(6);
        const arcount = view.getUint16(8);
        const adcount = view.getUint16(10);
        let offset = 12;
        for (let i = 0; i < qdcount; i++) {
            const question = DnsQuestionSerializer.deserialize(view, offset);
            offset = question.offset;
            message.questions.push(question.question);
        }
        for (let i = 0; i < ancount; i++) {
            const record = DnsRecordSerializer.deserialize(view, offset);
            offset = record.offset;
            message.answers.push(record.record);
        }
        for (let i = 0; i < arcount; i++) {
            const record = DnsRecordSerializer.deserialize(view, offset);
            offset = record.offset;
            message.authorities.push(record.record);
        }
        for (let i = 0; i < adcount; i++) {
            const record = DnsRecordSerializer.deserialize(view, offset);
            offset = record.offset;
            message.additionals.push(record.record);
        }
        return message;
    }

    static serialize(message) {
        let buffer = new ArrayBuffer(1024);
        let view = new DataView(buffer);
        let offset = 0;
        view.setUint16(offset, message.id, false);
        offset += 2;
        offset = this.HeaderFlags.serialize(view, offset, message.flags);
        view.setUint16(offset, message.questions.length,   false);
        offset += 2;
        view.setUint16(offset, message.answers.length,     false);
        offset += 2;
        view.setUint16(offset, message.authorities.length, false);
        offset += 2;
        view.setUint16(offset, message.additionals.length, false);
        offset += 2;
        if (message.questions.length > 0) {
            for (const record of message.questions) {
                offset = DnsQuestionSerializer.serialize(view, offset, record);
            }
        }
        if (message.answers.length > 0) {
            for (const record of message.answers) {
                offset = DnsRecordSerializer.serialize(view, offset, record);
            }
        }
        if (message.authorities.length > 0) {
            for (const record of message.authorities) {
                offset = DnsRecordSerializer.serialize(view, offset, record);
            }
        }
        if (message.additionals.length > 0) {
            for (const record of message.additionals) {
                offset = DnsRecordSerializer.serialize(view, offset, record);
            }
        }
        return new Uint8Array(buffer.slice(0, offset));
    }

    static HeaderFlags = {
        deserialize(buffer) {
            const qr = QR_NAMES[(buffer >> 15) & 1];
            const opcode = OPCODE_NAMES[(buffer >> 11) & 0xF];
            const aa = (buffer >> 10) & 1;
            const tc = (buffer >> 9) & 1;
            const rd = (buffer >> 8) & 1;
            const ra = (buffer >> 7) & 1;
            const rcode = RCODE_NAMES[buffer & 0xF]; 
            return {qr, opcode, aa, tc, rd, ra, rcode};
        },
        serialize(view, offset, flags) {
            const buffer =
                (flags.qr & 1) << 15 |
                (flags.opcode & 0xF) << 11 |
                (flags.aa & 1) << 10 |
                (flags.tc & 1) << 9 |
                (flags.rd & 1) << 8 |
                (flags.ra & 1) << 7 |
                (flags.rcode & 0xF);
            view.setUint16(offset, buffer, false);
            return offset + 2;
        }
    }
}

class DnsNameSerializer {
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
        return { name: labels.join("."), offset: jumpOffset, length: jumpOffset - initialOffset };
    }

    static serialize(name) {
        const labels = name.split(".");
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
    static deserialize(view, offset) {
        const name = DnsNameSerializer.deserialize(view, offset);
        offset = name.offset;
        const type = view.getUint16(offset);
        offset += 2;
        const clazz = view.getUint16(offset);
        offset += 2;
        const ttl = view.getUint16(offset);
        offset += 2;
        const dataLength = view.getUint16(offset);
        offset += 2;

        const record = new Record();
        record.name = name.name;
        record.type = TYPE_NAMES[type];
        record.clazz = CLASS_NAMES[clazz];
        record.ttl = ttl;
        if (dataLength === 0) {
            return {record, offset};
        }
        switch (record.type) {
            case "A":
                record.data = this.A.deserialize(view, offset, dataLength); break;
            case "NS":
                record.data = this.NS.deserialize(view, offset); break;
            case "CNAME":
                record.data = this.CNAME.deserialize(view, offset); break;
            case "SOA":
                record.data = this.SOA.deserialize(view, offset); break;
            case "HINFO":
                record.data = this.HINFO.deserialize(view, offset); break;
            case "MX":
                record.data = this.MX.deserialize(view, offset); break;
            case "AAAA":
                record.data = this.AAAA.deserialize(view, offset, dataLength); break;
            case "SRV":
                record.data = this.SRV.deserialize(view, offset); break;
            case "DS":
                record.data = this.DS.deserialize(view, offset, dataLength); break;
            case "TXT":
                record.data = this.TXT.deserialize(view, offset); break;
            case "RRSIG":
                record.data = this.RRSIG.deserialize(view, offset, dataLength); break;
            case "NSEC":
                record.data = this.NSEC.deserialize(view, offset, dataLength); break;
            case "DNSKEY":
                record.data = this.DNSKEY.deserialize(view, offset, dataLength); break;
            case "CDS":
                record.data = this.DS.deserialize(view, offset, dataLength); break;
            case "CDNSKEY":
                record.data = this.DNSKEY.deserialize(view, offset, dataLength); break;
        }
        offset += dataLength;
        return {record, offset};
    }

    static serialize(view, offset, record) {
        const nameBytes = DnsNameSerializer.serialize(record.name);
        nameBytes.forEach((byte) => view.setUint8(offset++, byte));
        view.setUint16(offset, record.type,  false);
        offset += 2;
        view.setUint16(offset, record.clazz, false);
        offset += 2;
        view.setUint16(offset, record.ttl, false);
        offset += 2;
        let buffer = new Uint8Array(0);
        switch (TYPE_NAMES[record.type]) {
            case "A":
                buffer = this.A.serialize(record.data); break;
            case "NS":
                buffer = this.NS.serialize(record.data); break;
            case "CNAME":
                buffer = this.CNAME.serialize(record.data); break;
            case "SOA":
                buffer = this.SOA.serialize(record.data); break;
            case "HINFO":
                buffer = this.HINFO.serialize(record.data); break;
            case "MX":
                buffer = this.MX.serialize(record.data); break;
            case "AAAA":
                buffer = this.AAAA.serialize(record.data); break;
            case "SRV":
                buffer = this.SRV.serialize(record.data); break;
            case "DS":
                buffer = this.DS.serialize(record.data); break;
            case "TXT":
                buffer = this.TXT.serialize(record.data); break;
            case "RRSIG":
                buffer = this.RRSIG.serialize(record.data); break;
            case "DNSKEY":
                buffer = this.DNSKEY.serialize(record.data); break;
            case "CDS":
                buffer = this.DS.serialize(record.data); break;
            case "CDNSKEY":
                buffer = this.DNSKEY.serialize(record.data); break;
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
            const data = [{key: "ipv4", value: ipv4}];
            return data;
        },
        serialize(rdata) {
            const value  = rdata.find(item => item.key === "ipv4").value;
            const parts  = value.split(".").map(Number);
            const buffer = new Uint8Array(parts);
            return buffer;
        }
    }

    static NS = {
        deserialize(view, offset) {
            const value = DnsNameSerializer.deserialize(view, offset);
            const data  = [{key: "name", value: value.name}];
            return data;
        },
        serialize(rdata) {
            const name   = rdata.find(item => item.key === "name").value;
            const buffer = DnsNameSerializer.serialize(name);
            return buffer;
        }
    }

    static CNAME = {
        deserialize(view, offset) {
            const value = DnsNameSerializer.deserialize(view, offset);
            const data = [{key: "name", value: value.name}];
            return data;
        },
        serialize(rdata) {
            const name   = rdata.find(item => item.key === "name").value;
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
            const serial  = view.getUint32(offset +  0);
            const refresh = view.getUint32(offset +  4);
            const retry   = view.getUint32(offset +  8);
            const expire  = view.getUint32(offset + 12);
            const minimum = view.getUint32(offset + 16);
            const data = [
                {key: "mname", value: mname.name},
                {key: "rname", value: rname.name},
                {key: "serial", value: serial},
                {key: "refresh", value: refresh},
                {key: "retry", value: retry},
                {key: "expire", value: expire},
                {key: "minimum", value: minimum}
            ];
            return data;
        },
        serialize(rdata) {
            const mname = rdata.find(item => item.key === "mname").value;
            const mnameBytes = DnsNameSerializer.serialize(mname);
            const rname = rdata.find(item => item.key === "rname").value;
            const rnameBytes = DnsNameSerializer.serialize(rname);

            const length = mnameBytes.length + rnameBytes.length + 20;
            const buffer = new ArrayBuffer(length);
            const view   = new DataView(buffer);
            let offset   = 0;

            mnameBytes.forEach((byte) => view.setUint8(offset++, byte));
            rnameBytes.forEach((byte) => view.setUint8(offset++, byte));
            view.setUint32(offset +  0, rdata.find(item => item.key === "serial").value,  false);
            view.setUint32(offset +  4, rdata.find(item => item.key === "refresh").value, false);
            view.setUint32(offset +  8, rdata.find(item => item.key === "retry").value,   false);
            view.setUint32(offset + 12, rdata.find(item => item.key === "expire").value,  false);
            view.setUint32(offset + 16, rdata.find(item => item.key === "minimum").value, false);
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
            const data   = [
                {key: "cpu", value: cpu},
                {key: "os", value: os}
            ];
            return data;
        },
        serialize(rdata) {
            const cpu = rdata.find(item => item.key === "cpu").value;
            const os  = rdata.find(item => item.key === "os").value;
            const cpuBytes = new TextEncoder().encode(cpu);
            const osBytes  = new TextEncoder().encode(os);

            const length = cpuBytes.length + osBytes.length + 2;
            const buffer = new ArrayBuffer(length);
            const view   = new DataView(buffer);
            let offset   = 0;

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
            const exchange   = DnsNameSerializer.deserialize(view, offset + 2);
            const data = [
                {key: "preference", value: preference},
                {key: "exchange", value: exchange.name}
            ];
            return data;
        },
        serialize(rdata) {
            const preference = rdata.find(item => item.key === "preference").value;
            const exchange   = rdata.find(item => item.key === "exchange").value;
            const exchangeBytes = DnsNameSerializer.serialize(exchange);

            const length = exchangeBytes.length + 2;
            const buffer = new ArrayBuffer(length);
            const view   = new DataView(buffer);
            let offset   = 0;

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
            const data = [{key: "ipv6", value: ipv6}];
            return data;
        },
        serialize(rdata) {
            const value = rdata.find(item => item.key === "ipv6").value;
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
            const weight   = view.getUint16(offset + 2);
            const port     = view.getUint16(offset + 4);
            const target   = DnsNameSerializer.deserialize(view, offset + 6);
            const data = [
                {key: "priority", value: priority},
                {key: "weight", value: weight},
                {key: "port", value: port},
                {key: "target", value: target.name},
            ];
            return data;
        },
        serialize(rdata) {
            const priority    = rdata.find(item => item.key === "priority").value;
            const weight      = rdata.find(item => item.key === "weight").value;
            const port        = rdata.find(item => item.key === "port").value;
            const target      = rdata.find(item => item.key === "target").value;
            const targetBytes = DnsNameSerializer.serialize(target);

            const length = targetBytes.length + 6;
            const buffer = new ArrayBuffer(length);
            const view   = new DataView(buffer);
            let offset   = 0;

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
            const keyTag     = view.getUint16(offset);
            offset += 2;
            const algorithm  = view.getUint8(offset);
            offset += 1;
            const digestType = view.getUint8(offset);
            offset += 1;
            const digestBytes  = new Uint8Array(view.buffer.slice(offset, offset + (dataLength - 4)));
            const digestBase64 = btoa(String.fromCharCode(...digestBytes));
            const data = [
                {key: "keyTag", value: keyTag},
                {key: "algorithm", value: algorithm},
                {key: "digestType", value: digestType},
                {key: "digest", value: digestBase64},
            ];
            return data;
        },
        serialize(rdata) {
            const keyTag       = rdata.find(item => item.key === "keyTag").value;
            const algorithm    = rdata.find(item => item.key === "algorithm").value;
            const digestType   = rdata.find(item => item.key === "digestType").value;
            const digestBase64 = rdata.find(item => item.key === "digest").value;
            const digestBytes  = Uint8Array.from(atob(digestBase64), c => c.charCodeAt(0));

            const length = digestBytes.length + 4;
            const buffer = new ArrayBuffer(length);
            const view   = new DataView(buffer);
            let offset   = 0;

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
            const text   = new TextDecoder().decode(view.buffer.slice(offset + 1, offset + 1 + length));
            const data   = [{key: "text", value: text}];
            return data;
        },
        serialize(rdata) {
            const text = rdata.find(item => item.key === "text").value;
            const textBytes = new TextEncoder().encode(text);

            const length = textBytes.length + 1;
            const buffer = new ArrayBuffer(length);
            const view   = new DataView(buffer);
            let offset   = 0;

            view.setUint8(offset, textBytes.length);
            offset++;
            textBytes.forEach((byte) => view.setUint8(offset++, byte));
            return new Uint8Array(buffer);
        }
    }
    
    static RRSIG = {
        deserialize(view, offset, dataLength) {
            const typeCovered   = TYPE_NAMES[view.getUint16(offset)];
            const algorithm     = view.getUint8(offset   +  2);
            const labels        = view.getUint8(offset   +  3);
            const originalTtl   = view.getUint32(offset  +  4);
            const expiration    = view.getUint32(offset  +  8);
            const inception     = view.getUint32(offset  + 12);
            const keyTag        = view.getUint16(offset  + 16);
            const signersName   = DnsNameSerializer.deserialize(view, offset + 18);
            const buffer        = view.buffer.slice(signersName.offset, offset + dataLength);
            const signature     = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            const data = [
                {key: "typeCovered", value: typeCovered},
                {key: "algorithm", value: algorithm},
                {key: "labels", value: labels},
                {key: "originalTtl", value: originalTtl},
                {key: "expiration", value: new Date(expiration * 1000)},
                {key: "inception", value: new Date(inception * 1000)},
                {key: "keyTag", value: keyTag},
                {key: "signersName", value: signersName.name},
                {key: "signature", value: signature}
            ];
            return data;
        },
        serialize(rdata) {
            const typeCovered = rdata.find(item => item.key === "typeCovered").value;
            const algorithm = rdata.find(item => item.key === "algorithm").value;
            const labels = rdata.find(item => item.key === "labels").value;
            const originalTtl = rdata.find(item => item.key === "originalTtl").value;
            const expiration = Math.floor(rdata.find(item => item.key === "expiration").value.getTime() / 1000);
            const inception = Math.floor(rdata.find(item => item.key === "inception").value.getTime() / 1000);
            const keyTag = rdata.find(item => item.key === "keyTag").value;
            const signersName = rdata.find(item => item.key === "signersName").value;
            const signature = rdata.find(item => item.key === "signature").value;
            const signersNameBytes = DnsNameSerializer.serialize(signersName);
            const signatureBytes = atob(signature).split("").map(c => c.charCodeAt(0));

            const length = signersNameBytes.length + signatureBytes.length + 18;
            const buffer = new ArrayBuffer(length);
            const view   = new DataView(buffer);
            let offset   = 0;

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
            const nextDomain  = DnsNameSerializer.deserialize(view, offset);
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
            const data = [
                {key: "nextDomain", value: nextDomain.name},
                {key: "typeBitmaps", value: typeBitmaps}
            ];
            return data;
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
            const protocol  = view.getUint8(offset);
            offset += 1;
            const algorithm = view.getUint8(offset);
            offset += 1;
            const publicKeyBytes  = new Uint8Array(view.buffer.slice(offset, offset + (dataLength - 4)));
            const publicKeyBase64 = btoa(String.fromCharCode(...publicKeyBytes));
            const data = [
                {key: "flag", value: flag},
                {key: "protocol", value: protocol},
                {key: "algorithm", value: algorithm},
                {key: "publickey", value: publicKeyBase64}
            ];
            return data;
        },
        serialize(rdata) {
            const flag      = rdata.find(item => item.key === "flag").value === "ZSK" ? 256 : 257;
            const protocol  = rdata.find(item => item.key === "protocol").value;
            const algorithm = rdata.find(item => item.key === "algorithm").value;
            const publicKeyBase64 = rdata.find(item => item.key === "publickey").value;
            const publicKeyBytes = new Uint8Array(atob(publicKeyBase64).split("").map(char => char.charCodeAt(0)));

            const length = publicKeyBytes.length + 4;
            const buffer = new ArrayBuffer(length);
            const view   = new DataView(buffer);
            let offset   = 0;

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
            let start = offset;
            const algorithm = DnsNameSerializer.deserialize(view, offset);
            start = algorithm.offset;
            const timestampHigh = view.getUint16(start); // Obere 16 Bit
            const timestampLow  = view.getUint32(start + 2); // Untere 32 Bit
            const timestamp     = (BigInt(timestampHigh) << 32n) | BigInt(timestampLow);
            start += 6;
            const fudge = view.getUint16(start);
            start += 2;
            const macLength = view.getUint16(start);
            start += 2;
            const mac = new Uint8Array(view.buffer.slice(start, start + macLength));
            start += macLength;
            const originalId = view.getUint16(start);
            start += 2;
            const error = view.getUint16(start);
            start += 2;
            const otherLength = view.getUint16(start);
            start += 2;
            const otherData = new Uint8Array(view.buffer.slice(start, start + otherLength));
            start += otherLength;
            const data = [
                {key: "algorithm", value: algorithm.name},
                {key: "timestamp", value: timestamp},
                {key: "fudge", value: fudge},
                {key: "mac", value: mac},
                {key: "originalId", value: originalId},
                {key: "error", value: error},
                {key: "otherData", value: otherData}
            ];
            return data;
        },
        serialize(rdata) {
            const algorithm      = rdata.find(item => item.key === "algorithm").value;
            const timestamp      = rdata.find(item => item.key === "timestamp").value;
            const fudge          = rdata.find(item => item.key === "fudge").value;
            const mac            = rdata.find(item => item.key === "mac").value;
            const originalId     = rdata.find(item => item.key === "originalId").value;
            const error          = rdata.find(item => item.key === "error").value;
            const otherData      = rdata.find(item => item.key === "otherData").value;
            const algorithmBytes = DnsNameSerializer.serialize(algorithm);
            const timestampHigh  = Number(timestamp >> 32n) & 0xFFFF;
            const timestampLow   = Number(timestamp & 0xFFFFFFFFn);

            const length = algorithmBytes.length + mac.length + 16 + otherData.length;
            const buffer = new ArrayBuffer(length);
            const view   = new DataView(buffer);
            let offset   = 0;
    
            algorithmBytes.forEach((byte) => view.setUint8(offset++, byte));
            view.setUint16(offset, timestampHigh);
            offset += 2;
            view.setUint32(offset, timestampLow);
            offset += 4;
            view.setUint16(offset, fudge);
            offset += 2;
            view.setUint16(offset, mac.length);
            offset += 2;
            mac.forEach((byte) => view.setUint8(offset++, byte));
            view.setUint16(offset, originalId);
            offset += 2;
            view.setUint16(offset, error);
            offset += 2;
            view.setUint16(offset, otherData.length);
            offset += 2;
            otherData.forEach((byte) => view.setUint8(offset++, byte));
            return new Uint8Array(buffer);
        }
    }
}

export class DnsQuestionSerializer {
    static deserialize(view, offset) {
        const name = DnsNameSerializer.deserialize(view, offset);
        offset = name.offset;
        const type = TYPE_NAMES[view.getUint16(offset)];
        offset += 2;
        const clazz = CLASS_NAMES[view.getUint16(offset)];
        offset += 2;
        const question = new Question(name.name, type, clazz);
        return {question, offset};
    }

    static serialize(view, offset, record) {
        const nameBytes = DnsNameSerializer.serialize(record.name);
        nameBytes.forEach((byte) => view.setUint8(offset++, byte));
        view.setUint16(offset, record.type,  false);
        offset += 2;
        view.setUint16(offset, record.clazz, false);
        offset += 2;
        return offset;
    }
}

// Functions
export async function query(url, question) {
    let result = "";
    const message = new Message();
    message.flags.rd = 1;
    message.questions = [question];
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
        throw new Error(`DNS query request failed with status code: ${response.status}`);
    } else {
        const buffer = await response.arrayBuffer();
        result = DnsSerializer.deserialize(buffer);
    }
    const latency = Math.round(end - start);
    return { result, latency };
}
