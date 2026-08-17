import * as dnsclient from '../dnsclient.js';

describe('DNSKEY flags survive a round-trip for every value', () => {
    const publickey = "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIDEzIGxhenkgZG9ncy4=";

    const roundtrip = (flag) => {
        const rdata = {flag: flag, protocol: 3, algorithm: 8, publickey: publickey};
        const bytes = dnsclient.DnsRecordSerializer.DNSKEY.serialize(rdata);
        return {
            bytes,
            back: dnsclient.DnsRecordSerializer.DNSKEY.deserialize(new DataView(bytes.buffer), 0, bytes.byteLength)
        };
    };

    test('Expect "ZSK" to map to 256', () => {
        const {bytes, back} = roundtrip("ZSK");

        expect(bytes[0] << 8 | bytes[1]).toBe(256);
        expect(back.flag).toBe("ZSK");
    });

    test('Expect "KSK" to map to 257', () => {
        const {bytes, back} = roundtrip("KSK");

        expect(bytes[0] << 8 | bytes[1]).toBe(257);
        expect(back.flag).toBe("KSK");
    });

    test.each([0, 128, 384, 385])('Expect the numeric flags value %i to be preserved', (flag) => {
        const {bytes, back} = roundtrip(flag);

        expect(bytes[0] << 8 | bytes[1]).toBe(flag);
        expect(back.flag).toBe(flag);
    });

    test('Expect an invalid flags value to be rejected', () => {
        expect(() => roundtrip("nonsense")).toThrow(/Invalid DNSKEY flags value/);
    });
});

describe('RRSIG typeCovered survives a round-trip', () => {
    const rdata = {typeCovered: "A", algorithm: 8, labels: 2, originalTtl: 86400, expiration: new Date("1970-01-02T01:20:31.000Z"), inception: new Date("1970-01-02T01:11:57.000Z"), keyTag: 12345, signersName: "example.com", signature: "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIDEzIGxhenkgZG9ncy4="};

    test('Expect a type name from deserialize to be re-encoded as its code', () => {
        const bytes = dnsclient.DnsRecordSerializer.RRSIG.serialize(rdata);

        expect(bytes[0] << 8 | bytes[1]).toBe(dnsclient.TYPE.A);
    });

    test('Expect a full round-trip to preserve every field', () => {
        const bytes = dnsclient.DnsRecordSerializer.RRSIG.serialize(rdata);
        const back = dnsclient.DnsRecordSerializer.RRSIG.deserialize(new DataView(bytes.buffer), 0, bytes.byteLength);

        expect(back).toEqual(rdata);
    });

    test.each(["AAAA", "MX", "DNSKEY", "SOA"])('Expect typeCovered "%s" to round-trip', (type) => {
        const covered = {...rdata, typeCovered: type};
        const bytes = dnsclient.DnsRecordSerializer.RRSIG.serialize(covered);
        const back = dnsclient.DnsRecordSerializer.RRSIG.deserialize(new DataView(bytes.buffer), 0, bytes.byteLength);

        expect(back.typeCovered).toBe(type);
    });

    test('Expect an unknown numeric typeCovered to be preserved', () => {
        const covered = {...rdata, typeCovered: 54};
        const bytes = dnsclient.DnsRecordSerializer.RRSIG.serialize(covered);
        const back = dnsclient.DnsRecordSerializer.RRSIG.deserialize(new DataView(bytes.buffer), 0, bytes.byteLength);

        expect(back.typeCovered).toBe(54);
    });
});

describe('WKS handles an empty port list', () => {
    test('Expect an empty port list to produce an empty bitmap', () => {
        const rdata = {address: "192.0.2.1", protocol: 6, ports: []};
        const bytes = dnsclient.DnsRecordSerializer.WKS.serialize(rdata);

        expect(bytes.byteLength).toBe(5);

        const back = dnsclient.DnsRecordSerializer.WKS.deserialize(new DataView(bytes.buffer), 0, bytes.byteLength);
        expect(back).toEqual(rdata);
    });

    test('Expect port 0 to be encoded in a single bitmap byte', () => {
        const rdata = {address: "192.0.2.1", protocol: 17, ports: [0]};
        const bytes = dnsclient.DnsRecordSerializer.WKS.serialize(rdata);

        expect(bytes.byteLength).toBe(6);
        expect(bytes[5]).toBe(0x80);
    });
});

describe('TXT records carry several character-strings', () => {
    test('Expect a short text to round-trip', () => {
        const rdata = {text: "v=spf1 -all"};
        const bytes = dnsclient.DnsRecordSerializer.TXT.serialize(rdata);

        expect(bytes[0]).toBe(11);
        expect(dnsclient.DnsRecordSerializer.TXT.deserialize(new DataView(bytes.buffer), 0, bytes.byteLength))
            .toEqual(rdata);
    });

    test('Expect a text longer than 255 bytes to be split and rejoined', () => {
        const text = "x".repeat(600);
        const rdata = {text: text};
        const bytes = dnsclient.DnsRecordSerializer.TXT.serialize(rdata);

        // 255 + 255 + 90 bytes of payload plus one length byte per string.
        expect(bytes.byteLength).toBe(603);
        expect(bytes[0]).toBe(255);
        expect(bytes[256]).toBe(255);
        expect(bytes[512]).toBe(90);

        const back = dnsclient.DnsRecordSerializer.TXT.deserialize(new DataView(bytes.buffer), 0, bytes.byteLength);
        expect(back.text).toBe(text);
    });

    test('Expect a long TXT record in a message to round-trip', () => {
        const text = "k=rsa; p=".concat("A".repeat(500));
        const message = new dnsclient.QueryMessage();
        message.answers.push(new dnsclient.Record(
            "selector._domainkey.example.com", dnsclient.TYPE.TXT, dnsclient.CLAZZ.IN, 3600,
            {text: text}
        ));

        const result = dnsclient.DnsSerializer.deserialize(dnsclient.DnsSerializer.serialize(message).buffer);

        expect(result.answers[0].data.text).toBe(text);
    });

    test('Expect an empty text to round-trip', () => {
        const rdata = {text: ""};
        const bytes = dnsclient.DnsRecordSerializer.TXT.serialize(rdata);

        expect(bytes).toEqual(new Uint8Array([0]));
        expect(dnsclient.DnsRecordSerializer.TXT.deserialize(new DataView(bytes.buffer), 0, bytes.byteLength))
            .toEqual(rdata);
    });

    test('Expect UTF-8 text to round-trip byte-exactly', () => {
        const rdata = {text: "grüße=münchen"};
        const bytes = dnsclient.DnsRecordSerializer.TXT.serialize(rdata);

        expect(dnsclient.DnsRecordSerializer.TXT.deserialize(new DataView(bytes.buffer), 0, bytes.byteLength))
            .toEqual(rdata);
    });
});
