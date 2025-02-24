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
const QR_NAMES = Object.freeze({
    0: "QUERY",
    1: "RESPONSE"
});

const OPCODE_NAMES = Object.freeze({
    0: "QUERY",    // Standard query
    1: "IQUERY",   // Inverse query (obsolete)
    2: "STATUS",   // Server status request
    3: "RESERVED", // Reserved for future use
    4: "NOTIFY",   // Notify request
    5: "UPDATE",   // Dynamic update
    6: "DSO"       // DNS Stateful Operations
});

const RCODE_NAMES = Object.freeze({
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

const TYPE_NAMES = Object.freeze({
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

const CLASS_NAMES = Object.freeze({
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
    id = crypto.getRandomValues(new Uint8Array(2));
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

export class Question {
    constructor(name, type, clazz) {
        this.name = name;
        this.type = type;
        this.clazz = clazz;
    }
}

// Classes
export class DnsSerializer {
    static deserialize(buffer) {
        const view = new DataView(buffer);
        const transactionID = view.getUint16(0);
        const flags = this.HeaderFlags.deserialize(view.getUint16(2));
        const qdcount = view.getUint16(4);
        const ancount = view.getUint16(6);
        const arcount = view.getUint16(8);
        const adcount = view.getUint16(10);
        let offset = 12;
        const questions = [];
        for (let i = 0; i < qdcount; i++) {
            const record = DnsRecordSerilaizer.deserialize(view, offset);
            offset = record.offset;
            questions.push(record.record);
        }
        const answers = [];
        for (let i = 0; i < ancount; i++) {
            const record = DnsRecordSerilaizer.deserialize(view, offset);
            offset = record.offset;
            answers.push(record.record);
        }
        const authorities = [];
        for (let i = 0; i < ancount; i++) {
            const record = DnsRecordSerilaizer.deserialize(view, offset);
            offset = record.offset;
            authorities.push(record.record);
        }
        const additionals = [];
        for (let i = 0; i < ancount; i++) {
            const record = DnsRecordSerilaizer.deserialize(view, offset);
            offset = record.offset;
            additionals.push(record.record);
        }
        return {
            transactionID,
            flags,
            qdcount,
            ancount,
            arcount,
            adcount,
            questions,
            answers,
            authorities,
            additionals
        };
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
                offset = DnsRecordSerilaizer.serialize(record);
            }
        }
        if (message.authorities.length > 0) {
            for (const record of message.authorities) {
                offset = DnsRecordSerilaizer.serialize(record);
            }
        }
        if (message.additionals.length > 0) {
            for (const record of message.additionals) {
                offset = DnsRecordSerilaizer.serialize(record);
            }
        }
        return buffer.slice(0, offset);
    }

    // static serialize(question) {
    //     const transactionId = crypto.getRandomValues(new Uint8Array(2));
    //     const flags   = new Uint8Array([0x01, 0x00]);
    //     const qdcount = new Uint8Array([0x00, 0x01]);
    //     const labels = question.name.split(".").map(part => {
    //         const label = new Array(part.length + 1);
    //         label[0] = part.length;
    //         for (let i = 0; i < part.length; i++) {
    //             label[i + 1] = part.charCodeAt(i);
    //         }
    //         return label;
    //     }).flat(Infinity).concat([0]);
    //     const type = new Uint8Array([0x00, question.type]);
    //     const clazz = new Uint8Array([0x00, question.clazz]);
    //     return Uint8Array.from([
    //         ...transactionId, 
    //         ...flags, 
    //         ...qdcount, 
    //         0x00, 0x00, // ANCOUNT
    //         0x00, 0x00, // NSCOUNT
    //         0x00, 0x00, // ARCOUNT
    //         ...labels,
    //         ...type,
    //         ...clazz
    //     ]);
    // }

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
                (flags.qr << 15) |
                (flags.opcode << 11) |
                (flags.aa << 10) |
                (flags.tc << 9) |
                (flags.rd << 8) |
                (flags.ra << 7) |
                (flags.rcode & 0xF);
            view.setUint16(offset, buffer, false);
            return offset + 2;
        }
    }

    static DomainName = {
        deserialize(view, offset) {
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
        },
        serialize(view, offset, name) {
            const labels = name.split(".");
            for (let i = 0; i < labels.length; i++) {
                const label = labels[i];
                view.setUint8(offset, label.length); offset += 1;
                for (let j = 0; j < label.length; j++) {
                    view.setUint8(offset, label.charCodeAt(j));
                    offset += 1;
                }
            }
            view.setUint8(offset, 0); offset += 1;
            return offset;
        }
    }
}

export class DnsRecordSerilaizer {
    static deserialize(view, offset) {
        const name = this.DomainName.deserialize(view, offset);
            offset = name.offset;
            const type = TYPE_NAMES[view.getUint16(offset)];
            offset += 2;
            const clazz = CLASS_NAMES[view.getUint16(offset)];
            offset += 2;
            const ttl = view.getUint32(offset);
            offset += 4;
            const dataLength = view.getUint16(offset);
            offset += 2;
            if (dataLength === 0) {
                const record = { name: name.name, type, clazz, ttl }
                return {record, offset};
            }
            let data = [{key: "", value: ""}];
            switch (type) {
                case "A":
                    data = this.A.deserialize(view, offset, dataLength); break;
                case "NS":
                    data = this.NS.deserialize(view, offset); break;
                case "CNAME":
                    data = this.CNAME.deserialize(view, offset); break;
                case "SOA":
                    data = this.SOA.deserialize(view, offset); break;
                case "HINFO":
                    data = this.HINFO.deserialize(view, offset); break;
                case "MX":
                    data = this.MX.deserialize(view, offset); break;
                case "AAAA":
                    data = this.AAAA.deserialize(view, offset, dataLength); break;
                case "SRV":
                    data = this.SRV.deserialize(view, offset); break;
                case "DS":
                    data = this.DS.deserialize(view, offset, dataLength); break;
                case "TXT":
                    data = this.TXT.deserialize(view, offset); break;
                case "RRSIG":
                    data = this.RRSIG.deserialize(view, offset, dataLength); break;
                case "NSEC":
                    data = this.NSEC.deserialize(view, offset, dataLength); break;
                case "DNSKEY":
                    data = this.DNSKEY.deserialize(view, offset, dataLength); break;
                case "CDS":
                    data = this.DS.deserialize(view, offset, dataLength); break;
                case "CDNSKEY":
                    data = this.DNSKEY.deserialize(view, offset, dataLength); break;
                default:
                    data = [{key: "info", value: "this RR type is not yet taken into account by dnsclient.js."}];
            }
            const record = { name: name.name, type, clazz, ttl, data }
            offset += dataLength;
            return {record, offset};
    }

    static serialize(view, offset, record) {
        offset = this.DomainName.serialize(view, offset, record.name);
        view.setUint16(offset, record.type,  false);
        offset += 2;
        view.setUint16(offset, record.clazz, false);
        offset += 2;
        if (record.data.length === 0) {
            return offset;
        }
        switch (record.type) {
            case "A":
                offset = this.A.serialize(view, offset, data); break;
            case "NS":
                offset = this.NS.serialize(view, offset, data); break;
            case "CNAME":
                offset = this.CNAME.serialize(view, offset, data); break;
            case "SOA":
                offset = this.SOA.serialize(view, offset, data); break;
            case "HINFO":
                offset = this.HINFO.serialize(view, offset, data); break;
            case "MX":
                offset = this.MX.serialize(view, offset, data); break;
            case "AAAA":
                offset = this.AAAA.serialize(view, offset, data); break;
            case "SRV":
                offset = this.SRV.serialize(view, offset, data); break;
            case "DS":
                offset = this.DS.serialize(view, offset, data); break;
            case "TXT":
                offset = this.TXT.serialize(view, offset, data); break;
            case "RRSIG":
                offset = this.RRSIG.serialize(view, offset, data); break;
            case "DNSKEY":
                offset = this.DNSKEY.serialize(view, offset, data); break;
            case "CDS":
                offset = this.DS.serialize(view, offset, data); break;
            case "CDNSKEY":
                offset = this.DNSKEY.serialize(view, offset, data); break;
        }
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
        serialize(view, offset, rdata) {
            const value = rdata.find(item => item.key === "ipv4").value;
            const parts = value.split(".").map(Number);
            parts.forEach((part) => {
                view.setUint8(offset, part); offset++;
            });
            return offset;
        }
    }

    static NS = {
        deserialize(view, offset) {
            const value = DnsSerializer.DomainName.deserialize(view, offset);
            const data  = [{key: "name", value: value.name}];
            return data;
        },
        serialize(view, offset, rdata) {
            const name = rdata.find(item => item.key === "name").value;
            return DnsSerializer.DomainName.serialize(view, offset, name);
        }
    }

    static CNAME = {
        deserialize(view, offset) {
            const value = DnsSerializer.DomainName.deserialize(view, offset);
            const data = [{key: "name", value: value.name}];
            return data;
        },
        serialize(view, offset, rdata) {
            const name = rdata.find(item => item.key === "name").value;
            return DnsSerializer.DomainName.serialize(view, offset, name);
        }
    }
    
    static SOA = {
        deserialize(view, offset) {
            const mname = DnsSerializer.DomainName.deserialize(view, offset);
            offset = mname.offset;
            const rname = DnsSerializer.DomainName.deserialize(view, offset);
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
        serialize(view, offset, rdata) {
            const mname = rdata.find(item => item.key === "mname").value;
            offset = DnsSerializer.DomainName.serialize(view, offset, mname);
            const rname = rdata.find(item => item.key === "rname").value;
            offset = DnsSerializer.DomainName.serialize(view, offset, rname);
            view.setUint32(offset +  0, rdata.find(item => item.key === "serial").value,  false);
            view.setUint32(offset +  4, rdata.find(item => item.key === "refresh").value, false);
            view.setUint32(offset +  8, rdata.find(item => item.key === "retry").value,   false);
            view.setUint32(offset + 12, rdata.find(item => item.key === "expire").value,  false);
            view.setUint32(offset + 16, rdata.find(item => item.key === "minimum").value, false);
            return offset + 20;
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
        serialize(view, offset, rdata) {
            const cpu = rdata.find(item => item.key === "cpu").value;
            const os  = rdata.find(item => item.key === "os").value;
            const cpuBytes = new TextEncoder().encode(cpu);
            const osBytes  = new TextEncoder().encode(os);
            view.setUint8(offset, cpuBytes.length);
            offset += 1;
            cpuBytes.forEach((byte) => view.setUint8(offset++, byte));
            view.setUint8(offset, osBytes.length);
            offset += 1;
            osBytes.forEach((byte) => view.setUint8(offset++, byte));
            return offset;
        }
    }
    
    static MX = {
        deserialize(view, offset) {
            const preference = view.getUint16(offset);
            const exchange   = DnsSerializer.DomainName.deserialize(view, offset + 2);
            const data = [
                {key: "preference", value: preference},
                {key: "exchange", value: exchange.name}
            ];
            return data;
        },
        serialize(view, offset, rdata) {
            const preference = rdata.find(item => item.key === "preference").value;
            const exchange   = rdata.find(item => item.key === "exchange").value;
            view.setUint16(offset, preference, false);
            offset += 2;
            offset = DnsSerializer.DomainName.serialize(view, offset, exchange);
            return offset;
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
        serialize(view, offset, rdata) {
            const value = rdata.find(item => item.key === "ipv6").value;
            const parts = value.split(":").map(part => parseInt(part, 16));
            const bytes = new Uint8Array(16);
            let byteOffset = 0;
            for (let part of parts) {
                bytes[byteOffset++] = (part >> 8) & 0xff;
                bytes[byteOffset++] = part & 0xff;
            }
            for (let i = 0; i < 16; i++) {
                view.setUint8(offset + i, bytes[i]);
            }
            return offset + 16;
        }
    }
    
    static SRV = {
        deserialize(view, offset) {
            const priority = view.getUint16(offset + 0);
            const weight   = view.getUint16(offset + 2);
            const port     = view.getUint16(offset + 4);
            const target   = DnsSerializer.DomainName.deserialize(view, offset + 6);
            const data = [
                {key: "priority", value: priority},
                {key: "weight", value: weight},
                {key: "port", value: port},
                {key: "target", value: target.name},
            ];
            return data;
        },
        serialize(view, offset, rdata) {
            const priority = rdata.find(item => item.key === "priority").value;
            const weight   = rdata.find(item => item.key === "weight").value;
            const port     = rdata.find(item => item.key === "port").value;
            const target   = rdata.find(item => item.key === "target").value;
            view.setUint16(offset, priority);
            offset += 2;
            view.setUint16(offset, weight);
            offset += 2;
            view.setUint16(offset, port);
            offset += 2;
            offset = DnsSerializer.DomainName.serialize(view, offset, target);
            return offset;
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
        serialize(view, offset, rdata) {
            const keyTag       = rdata.find(item => item.key === "keyTag").value;
            const algorithm    = rdata.find(item => item.key === "algorithm").value;
            const digestType   = rdata.find(item => item.key === "digestType").value;
            const digestBase64 = rdata.find(item => item.key === "digest").value;
            const digestBytes  = Uint8Array.from(atob(digestBase64), c => c.charCodeAt(0));
            view.setUint16(offset, keyTag);
            offset += 2;
            view.setUint8(offset, algorithm);
            offset += 1;
            view.setUint8(offset, digestType);
            offset += 1;
            view.set(new Uint8Array(digestBytes.buffer), offset);
            offset += digestBytes.length;
            return offset;
        }
    }
    
    static TXT = {
        deserialize(view, offset) {
            const length = view.getUint8(offset);
            const text   = new TextDecoder().decode(view.buffer.slice(offset + 1, offset + 1 + length));
            const data   = [{key: "text", value: text}];
            return data;
        },
        serialize(view, offset, rdata) {
            const text = rdata.find(item => item.key === "text").value;
            const textBytes = new TextEncoder().encode(text);
            view.setUint8(offset, textBytes.length);
            offset += 1;
            view.set(new Uint8Array(textBytes.buffer), offset);
            offset += textBytes.length;
            return offset;
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
            const signersName   = DnsSerializer.DomainName.deserialize(view, offset + 18);
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
        serialize(view, offset, rdata) {
            const typeCovered = rdata.find(item => item.key === "typeCovered").value;
            const algorithm = rdata.find(item => item.key === "algorithm").value;
            const labels = rdata.find(item => item.key === "labels").value;
            const originalTtl = rdata.find(item => item.key === "originalTtl").value;
            const expiration = rdata.find(item => item.key === "expiration").value;
            const inception = rdata.find(item => item.key === "inception").value;
            const keyTag = rdata.find(item => item.key === "keyTag").value;
            const signersName = rdata.find(item => item.key === "signersName").value;
            const signature = rdata.find(item => item.key === "signature").value;
            view.setUint16(offset, TYPE_NAMES.indexOf(typeCovered));
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
            offset = DnsSerializer.DomainName.serialize(view, offset, signersName);
            const signatureBytes = atob(signature).split("").map(c => c.charCodeAt(0));
            view.set(new Uint8Array(signatureBytes), offset);
            offset += signatureBytes.length;
            return offset;
        }
    }
    
    static NSEC = {
        deserialize(view, offset, dataLength) {
            const nextDomain  = DnsSerializer.DomainName.deserialize(view, offset);
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
        serialize(view, offset, data) {
            const flag = data.find(item => item.key === "flag").value === "ZSK" ? 256 : 257;
            view.setUint16(offset, flag, false);
            offset += 2;
            const protocol = data.find(item => item.key === "protocol").value;
            view.setUint8(offset, protocol);
            offset += 1;
            const algorithm = data.find(item => item.key === "algorithm").value;
            view.setUint8(offset, algorithm);
            offset += 1;
            const publicKeyBase64 = data.find(item => item.key === "publickey").value;
            const publicKeyBytes = new Uint8Array(atob(publicKeyBase64).split("").map(char => char.charCodeAt(0)));
            view.set(new Uint8Array(publicKeyBytes.buffer), offset);
            offset += publicKeyBytes.length;
            return offset;
        }
    }
}

// Functions
export async function query(url, question) {
    let result = "";
    const message = new Message();
    message.flags.opcode = 1;
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
