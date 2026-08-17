import { createHmac } from 'node:crypto';
import * as dnsclient from '../dnsclient.js';

describe('Fixed-length record types validate their rdata length', () => {
    const cases = [
        ["NID", dnsclient.TYPE.NID, 10],
        ["L32", dnsclient.TYPE.L32, 6],
        ["L64", dnsclient.TYPE.L64, 10],
        ["EUI48", dnsclient.TYPE.EUI48, 6],
        ["EUI64", dnsclient.TYPE.EUI64, 8]
    ];

    test.each(cases)('Expect a short %s rdata to be rejected instead of reading past it', (name, type, expected) => {
        // 32 bytes of buffer are available, but RDLENGTH claims fewer than needed.
        const view = new DataView(new Uint8Array(32).fill(0xAA).buffer);

        expect(() => dnsclient.DnsRecordSerializer[name].deserialize(view, 0, expected - 1))
            .toThrow(new RegExp(`Invalid ${name} record length`));
    });

    test.each(cases)('Expect a long %s rdata to be rejected', (name, type, expected) => {
        const view = new DataView(new Uint8Array(32).fill(0xAA).buffer);

        expect(() => dnsclient.DnsRecordSerializer[name].deserialize(view, 0, expected + 1))
            .toThrow(new RegExp(`Invalid ${name} record length`));
    });

    test('Expect a truncated EUI48 in a message not to borrow the next record bytes', () => {
        const data = new Uint8Array([
            0x04, 0xD2, 0x81, 0x80,
            0x00, 0x00, 0x00, 0x01, // ANCOUNT: 1
            0x00, 0x00, 0x00, 0x00,
            0x00,                   // Name: root
            0x00, 0x6C,             // Type: EUI48 (108)
            0x00, 0x01,             // Class: IN
            0x00, 0x00, 0x00, 0x3C, // TTL
            0x00, 0x04,             // RDLENGTH: 4 instead of 6
            0xAA, 0xBB, 0xCC, 0xDD,
            0x01, 0x02              // bytes belonging to whatever follows
        ]);

        expect(() => dnsclient.DnsSerializer.deserialize(data.buffer))
            .toThrow(/Invalid EUI48 record length/);
    });
});

describe('Hex-encoded rdata fields are validated', () => {
    const cases = [
        ["SSHFP", {algorithm: 1, fpType: 1, fingerprint: ""}],
        ["TLSA", {usage: 3, selector: 1, matchingType: 1, certAssocData: ""}],
        ["SMIMEA", {usage: 3, selector: 1, matchingType: 1, certAssocData: ""}],
        ["ZONEMD", {serial: 1, scheme: 1, algorithm: 1, digest: ""}]
    ];

    test.each(cases)('Expect an empty hex field in %s to serialize instead of crashing', (name, rdata) => {
        const bytes = dnsclient.DnsRecordSerializer[name].serialize(rdata);
        const back = dnsclient.DnsRecordSerializer[name].deserialize(
            new DataView(bytes.buffer), 0, bytes.byteLength
        );

        expect(back).toEqual(rdata);
    });

    test('Expect odd-length hex to be rejected rather than silently truncated', () => {
        const rdata = {algorithm: 1, fpType: 1, fingerprint: "abc"};

        expect(() => dnsclient.DnsRecordSerializer.SSHFP.serialize(rdata))
            .toThrow(/Invalid hex string/);
    });

    test('Expect non-hex characters to be rejected', () => {
        const rdata = {algorithm: 1, flags: 0, iterations: 1, salt: "zzzz", nextHashedOwnerName: "aabb", typeBitmaps: []};

        expect(() => dnsclient.DnsRecordSerializer.NSEC3.serialize(rdata))
            .toThrow(/Invalid hex string/);
    });
});

describe('IPSECKEY gateways are validated and rendered consistently', () => {
    const base = (gatewayType, gateway) => ({precedence: 10, gatewayType: gatewayType, algorithm: 2, gateway: gateway, publickey: "AQNRU3mG7TVTO2BkR47usntb102uFJtugbo6BSGvgqt4AQ=="});

    test.each([
        [0, "."],
        [1, "192.0.2.38"],
        [2, "2001:db8:0:8002::2000:1"],
        [3, "gateway.example.com"]
    ])('Expect gateway type %i to round-trip', (gatewayType, gateway) => {
        const rdata = base(gatewayType, gateway);
        const bytes = dnsclient.DnsRecordSerializer.IPSECKEY.serialize(rdata);
        const back = dnsclient.DnsRecordSerializer.IPSECKEY.deserialize(
            new DataView(bytes.buffer), 0, bytes.byteLength
        );

        expect(back).toEqual(rdata);
    });

    test('Expect an IPv6 gateway to use the same compression as AAAA', () => {
        const address = "1:0:2:0:0:3:0:4";
        const viaAAAA = dnsclient.DnsRecordSerializer.AAAA.serialize({ipv6: address});
        const decodedAAAA = dnsclient.DnsRecordSerializer.AAAA.deserialize(new DataView(viaAAAA.buffer), 0, 16).ipv6;

        const rdata = base(2, address);
        const bytes = dnsclient.DnsRecordSerializer.IPSECKEY.serialize(rdata);
        const decodedGateway = dnsclient.DnsRecordSerializer.IPSECKEY.deserialize(
            new DataView(bytes.buffer), 0, bytes.byteLength
        ).gateway;

        expect(decodedGateway).toBe(decodedAAAA);
    });

    test.each(["1.2.3", "a.b.c.d"])('Expect the malformed IPv4 gateway "%s" to be rejected', (gateway) => {
        expect(() => dnsclient.DnsRecordSerializer.IPSECKEY.serialize(base(1, gateway)))
            .toThrow(/Invalid IPv4 address/);
    });

    test('Expect a malformed IPv6 gateway to be rejected', () => {
        expect(() => dnsclient.DnsRecordSerializer.IPSECKEY.serialize(base(2, "1:2:3:4:5:6:7:8:9")))
            .toThrow(/Invalid IPv6 address/);
    });

    test('Expect an unknown gateway type to be rejected', () => {
        expect(() => dnsclient.DnsRecordSerializer.IPSECKEY.serialize(base(7, "x")))
            .toThrow(/Unknown IPSECKEY gateway type 7/);
    });
});

describe('Multi-byte text survives the character-string split', () => {
    test.each([
        ["ä", 200],
        ["€", 100],
        ["😀", 80],
        ["日本語", 120]
    ])('Expect "%s" repeated %i times to round-trip', (char, times) => {
        const text = char.repeat(times);
        const rdata = {text: text};
        const bytes = dnsclient.DnsRecordSerializer.TXT.serialize(rdata);
        const back = dnsclient.DnsRecordSerializer.TXT.deserialize(
            new DataView(bytes.buffer), 0, bytes.byteLength
        );

        expect(back.text).toBe(text);
        expect(back.text).not.toContain("�");
    });

    test('Expect no character-string to exceed 255 bytes', () => {
        const bytes = dnsclient.DnsRecordSerializer.TXT.serialize({text: "ä".repeat(400)});

        let offset = 0;
        while (offset < bytes.byteLength) {
            expect(bytes[offset]).toBeLessThanOrEqual(255);
            offset += 1 + bytes[offset];
        }
        expect(offset).toBe(bytes.byteLength);
    });

    test('Expect text a peer split mid-sequence to still decode', () => {
        // Two character-strings that cut a 2-byte UTF-8 sequence in half.
        const data = new Uint8Array([0x01, 0xC3, 0x01, 0xA4]);
        const back = dnsclient.DnsRecordSerializer.TXT.deserialize(new DataView(data.buffer), 0, data.byteLength);

        expect(back.text).toBe("ä");
    });
});

describe('An interpreted message can still be serialized', () => {
    test('Expect a full interpret/serialize round-trip to preserve the wire bytes', () => {
        const message = new dnsclient.QueryMessage();
        message.id = 4711;
        message.flags.qr = 1;
        message.questions.push(new dnsclient.Question("example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN));
        message.answers.push(new dnsclient.Record(
            "example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN, 300, {ipv4: "192.0.2.1"}
        ));
        message.additionals.push(new dnsclient.Record(
            "mail.example.com", dnsclient.TYPE.MX, dnsclient.CLAZZ.IN, 300,
            {preference: 10, exchange: "mx.example.com"}
        ));

        const before = dnsclient.DnsSerializer.serialize(message);
        const after = dnsclient.DnsSerializer.serialize(dnsclient.interpret(message));

        expect(after).toEqual(before);
    });

    test('Expect an interpreted update message to serialize', () => {
        const message = new dnsclient.UpdateMessage();
        message.id = 99;
        message.zones.push(new dnsclient.Zone("example.com"));
        message.updates.push(new dnsclient.Record(
            "test.example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN, 60, {ipv4: "192.0.2.9"}
        ));

        const before = dnsclient.DnsSerializer.serialize(message);
        const after = dnsclient.DnsSerializer.serialize(dnsclient.interpret(message));

        expect(after).toEqual(before);
    });
});

describe('Bare EDNS(0) records keep a structured option list', () => {
    test('Expect an OPT record with RDLENGTH 0 to yield an empty option list', () => {
        const message = new dnsclient.QueryMessage();
        message.questions.push(new dnsclient.Question("example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN));
        message.additionals.push(new dnsclient.Record(".", dnsclient.TYPE.OPT, 1232, 0, new Uint8Array(0)));

        const result = dnsclient.DnsSerializer.deserialize(dnsclient.DnsSerializer.serialize(message).buffer);

        expect(result.additionals[0].data).toEqual({options: []});
    });

    test('Expect a record of another type with RDLENGTH 0 to keep empty raw data', () => {
        const message = new dnsclient.QueryMessage();
        message.answers.push(new dnsclient.Record("example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN, 60, new Uint8Array(0)));

        const result = dnsclient.DnsSerializer.deserialize(dnsclient.DnsSerializer.serialize(message).buffer);

        expect(result.answers[0].data).toEqual(new Uint8Array(0));
    });
});

describe('Name length limits agree between the two directions', () => {
    test('Expect the longest acceptable name to both parse and re-serialize', () => {
        // 4 labels of 49 bytes plus one of 53 -> 255 bytes on the wire.
        const name = [...Array(4).fill("a".repeat(49)), "b".repeat(53)].join(".");
        const wire = dnsclient.DnsNameSerializer.serialize(name);

        expect(wire.byteLength).toBe(255);
        expect(dnsclient.DnsNameSerializer.deserialize(new DataView(wire.buffer), 0).name).toBe(name);
    });

    test('Expect a name one byte too long to be rejected in both directions', () => {
        const name = [...Array(4).fill("a".repeat(49)), "b".repeat(54)].join(".");

        expect(() => dnsclient.DnsNameSerializer.serialize(name)).toThrow(/exceeds 255 bytes/);

        // Hand-build the 256 byte wire form the serializer refuses to produce.
        const labels = name.split(".");
        const wire = new Uint8Array(256);
        let offset = 0;
        for (const label of labels) {
            wire[offset++] = label.length;
            wire.set(new TextEncoder().encode(label), offset);
            offset += label.length;
        }

        expect(() => dnsclient.DnsNameSerializer.deserialize(new DataView(wire.buffer), 0))
            .toThrow(/exceeds 255 bytes/);
    });
});

describe('TSIG names are hashed in canonical form', () => {
    test('Expect a mixed-case key name to produce the same MAC as its lower-case form', async () => {
        const secret = "RGFzSXN0RWluVGVzdA==";
        const timestamp = 1708780800n;

        const build = () => {
            const message = new dnsclient.QueryMessage();
            message.id = 1234;
            message.questions.push(new dnsclient.Question("example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN));
            return message;
        };

        const upper = await dnsclient.sign(build(), "Test.Key", secret, {timestamp});
        const lower = await dnsclient.sign(build(), "test.key", secret, {timestamp});

        expect(upper.additionals[0].name).toBe("test.key");
        expect(upper.additionals[0].data.mac).toEqual(lower.additionals[0].data.mac);
    });

    test('Expect a mixed-case algorithm name to be canonicalised', async () => {
        const message = new dnsclient.QueryMessage();
        message.questions.push(new dnsclient.Question("example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN));

        const signed = await dnsclient.sign(message, "test.key", "RGFzSXN0RWluVGVzdA==", {
            algorithm: "HMAC-SHA256",
            timestamp: 1708780800n
        });

        expect(signed.additionals[0].data.algorithm).toBe("hmac-sha256");
    });

    test('Expect the canonical MAC to match an independent HMAC computation', async () => {
        const secret = "RGFzSXN0RWluVGVzdA==";
        const message = new dnsclient.QueryMessage();
        message.id = 1234;
        message.questions.push(new dnsclient.Question("example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN));
        const unsigned = dnsclient.DnsSerializer.serialize(message);

        const signed = await dnsclient.sign(message, "MiXeD.Key", secret, {timestamp: 1708780800n});

        const encoder = new TextEncoder();
        const label = (text) => [text.length, ...encoder.encode(text)];
        const expected = createHmac('sha256', Buffer.from(secret, 'base64')).update(new Uint8Array([
            ...unsigned,
            ...label("mixed"), ...label("key"), 0x00, // canonical: lower case
            0x00, 0xFF,                               // Class ANY
            0x00, 0x00, 0x00, 0x00,                   // TTL 0
            ...label("hmac-sha256"), 0x00,
            0x00, 0x00, 0x65, 0xD9, 0xED, 0x00,       // Time Signed
            0x01, 0x2C,                               // Fudge
            0x00, 0x00,                               // Error
            0x00, 0x00                                // Other Len
        ])).digest();

        expect(Buffer.from(signed.additionals[0].data.mac)).toEqual(expected);
    });
});
