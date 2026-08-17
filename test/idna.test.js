import * as dnsclient from '../dnsclient.js';

const wire = (name) => dnsclient.DnsNameSerializer.serialize(name);
const bytes = (...values) => new Uint8Array(values);

describe('Internationalized names are encoded as IDNA A-labels', () => {
    test.each([
        ["münchen.de", "xn--mnchen-3ya.de"],
        ["日本.jp", "xn--wgv71a.jp"],
        ["grüße.example.com", "xn--gre-6ka8l.example.com"],
        ["ÖSTERREICH.at", "xn--sterreich-z7a.at"],
        ["café.example", "xn--caf-dma.example"]
    ])('Expect %s to be encoded like %s', (unicode, ascii) => {
        expect(wire(unicode)).toEqual(wire(ascii));
    });

    test('Expect the wire form to start with the xn-- prefix, not raw UTF-8', () => {
        const encoded = wire("münchen.de");

        // 0x0e length byte, then "xn--mnchen-3ya"; raw UTF-8 would put 0xc3 0xbc here.
        expect(encoded[0]).toBe(0x0e);
        expect(new TextDecoder().decode(encoded.subarray(1, 15))).toBe("xn--mnchen-3ya");
        expect(Array.from(encoded)).not.toContain(0xc3);
    });

    test('Expect an already converted A-label to pass through unchanged', () => {
        expect(wire("xn--mnchen-3ya.de")).toEqual(wire("xn--mnchen-3ya.de"));
        expect(new TextDecoder().decode(wire("xn--mnchen-3ya.de").subarray(1, 15))).toBe("xn--mnchen-3ya");
    });

    test('Expect a query for an internationalized name to round-trip', () => {
        const message = new dnsclient.QueryMessage();
        message.questions.push(new dnsclient.Question("münchen.de", dnsclient.TYPE.A, dnsclient.CLAZZ.IN));

        const result = dnsclient.DnsSerializer.deserialize(dnsclient.DnsSerializer.serialize(message).buffer);

        // Deserialization reports what is actually on the wire, without guessing.
        expect(result.questions[0].name).toBe("xn--mnchen-3ya.de");
    });

    test('Expect a label whose A-label exceeds 63 bytes to be rejected', () => {
        expect(() => wire(`${"ä".repeat(60)}.de`)).toThrow(/exceeds 63 bytes/);
    });
});

describe('ASCII names are never rewritten', () => {
    test.each([
        "example.com",
        "EXAMPLE.COM",
        "ExAmPlE.CoM",
        "_dmarc.example.com",
        "_sip._tcp.example.com",
        "*.example.com",
        "a_b-c.example.com",
        "1.2.0.192.in-addr.arpa",
        "xn--mnchen-3ya.de"
    ])('Expect "%s" to be encoded byte-for-byte', (name) => {
        const labels = name.split(".");
        const expected = [];
        for (const label of labels) {
            expected.push(label.length, ...new TextEncoder().encode(label));
        }
        expected.push(0);

        expect(wire(name)).toEqual(bytes(...expected));
    });

    test('Expect mixed case to be preserved, so 0x20 encoding survives', () => {
        // The URL host parser would lower-case this; per-label conversion must not.
        expect(new TextDecoder().decode(wire("ExAmPlE.CoM").subarray(1, 8))).toBe("ExAmPlE");
    });

    test('Expect an ASCII TSIG key name not to be altered by name encoding', () => {
        expect(wire("update-key")).toEqual(bytes(10, ...new TextEncoder().encode("update-key"), 0));
    });
});

describe('Internationalized names work in the records that carry names', () => {
    test('Expect an MX exchange to be converted', () => {
        const rdata = {preference: 10, exchange: "poßt.münchen.de"};
        const encoded = dnsclient.DnsRecordSerializer.MX.serialize(rdata);
        const back = dnsclient.DnsRecordSerializer.MX.deserialize(new DataView(encoded.buffer), 0);

        // "ß" is kept rather than mapped to "ss": UTS #46 non-transitional processing.
        expect(back.exchange).toBe("xn--pot-6ka.xn--mnchen-3ya.de");
    });

    test('Expect an SOA rname to be converted', () => {
        const rdata = {mname: "ns.münchen.de", rname: "hostmaster.münchen.de", serial: 1, refresh: 2, retry: 3, expire: 4, minimum: 5};
        const encoded = dnsclient.DnsRecordSerializer.SOA.serialize(rdata);
        const back = dnsclient.DnsRecordSerializer.SOA.deserialize(new DataView(encoded.buffer), 0);

        expect(back.mname).toBe("ns.xn--mnchen-3ya.de");
        expect(back.rname).toBe("hostmaster.xn--mnchen-3ya.de");
    });
});
