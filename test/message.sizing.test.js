import * as dnsclient from '../dnsclient.js';

/**
 * Builds a base64 payload of the requested byte length.
 */
function payload(byteLength) {
    return Buffer.from(new Uint8Array(byteLength).fill(0x5A)).toString('base64');
}

describe('Messages with large record data are sized correctly', () => {
    test('Expect a 512 byte DNSKEY to serialize and round-trip', () => {
        const rdata = {flag: "KSK", protocol: 3, algorithm: 8, publickey: payload(512)};
        const message = new dnsclient.QueryMessage();
        message.questions.push(new dnsclient.Question("example.com", dnsclient.TYPE.DNSKEY, dnsclient.CLAZZ.IN));
        message.answers.push(new dnsclient.Record(
            "example.com", dnsclient.TYPE.DNSKEY, dnsclient.CLAZZ.IN, 3600, rdata
        ));

        const wire = dnsclient.DnsSerializer.serialize(message);
        const result = dnsclient.DnsSerializer.deserialize(wire.buffer);

        expect(result.answers[0].data).toEqual(rdata);
    });

    test('Expect a 2048 byte RRSIG signature to serialize and round-trip', () => {
        const rdata = {typeCovered: "A", algorithm: 8, labels: 2, originalTtl: 86400, expiration: new Date("2030-01-01T00:00:00.000Z"), inception: new Date("2029-01-01T00:00:00.000Z"), keyTag: 12345, signersName: "example.com", signature: payload(2048)};
        const message = new dnsclient.QueryMessage();
        message.answers.push(new dnsclient.Record(
            "example.com", dnsclient.TYPE.RRSIG, dnsclient.CLAZZ.IN, 3600, rdata
        ));

        const result = dnsclient.DnsSerializer.deserialize(dnsclient.DnsSerializer.serialize(message).buffer);

        expect(result.answers[0].data).toEqual(rdata);
    });

    test('Expect several large records in one message to serialize', () => {
        const message = new dnsclient.QueryMessage();
        for (let i = 0; i < 8; i++) {
            message.answers.push(new dnsclient.Record(
                `key${i}.example.com`, dnsclient.TYPE.DNSKEY, dnsclient.CLAZZ.IN, 3600,
                {flag: "ZSK", protocol: 3, algorithm: 8, publickey: payload(1024)}
            ));
        }

        const wire = dnsclient.DnsSerializer.serialize(message);
        const result = dnsclient.DnsSerializer.deserialize(wire.buffer);

        expect(result.answers).toHaveLength(8);
        expect(result.answers[7].data.publickey).toBe(payload(1024));
    });

    test('Expect the reported size to match the serialized length exactly', () => {
        const message = new dnsclient.QueryMessage();
        message.questions.push(new dnsclient.Question("example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN));
        message.answers.push(new dnsclient.Record(
            "example.com", dnsclient.TYPE.DNSKEY, dnsclient.CLAZZ.IN, 3600,
            {flag: "KSK", protocol: 3, algorithm: 8, publickey: payload(300)}
        ));

        expect(dnsclient.DnsSerializer.estimateMessageSize(message))
            .toBe(dnsclient.DnsSerializer.serialize(message).byteLength);
    });

    test('Expect a base64 payload beyond the call-stack limit to encode', () => {
        // Spreading an array this large into String.fromCharCode would overflow.
        const bytes = new Uint8Array(200_000).fill(0x41);
        const rdata = {publickey: Buffer.from(bytes).toString('base64')};

        const serialized = dnsclient.DnsRecordSerializer.OPENPGPKEY.serialize(rdata);
        const back = dnsclient.DnsRecordSerializer.OPENPGPKEY.deserialize(
            new DataView(serialized.buffer), 0, serialized.byteLength
        );

        expect(back).toEqual(rdata);
    });
});

describe('Malformed messages are rejected with a clear error', () => {
    test('Expect a message shorter than the header to be rejected', () => {
        expect(() => dnsclient.DnsSerializer.deserialize(new ArrayBuffer(4)))
            .toThrow(/too short/);
    });

    test('Expect a non-buffer argument to be rejected', () => {
        expect(() => dnsclient.DnsSerializer.deserialize("not a buffer"))
            .toThrow(/Expected an ArrayBuffer/);
    });

    test('Expect an unsupported opcode to be reported instead of returning undefined', () => {
        const data = new Uint8Array(12);
        new DataView(data.buffer).setUint16(2, 2 << 11, false); // opcode STATUS

        expect(() => dnsclient.DnsSerializer.deserialize(data.buffer))
            .toThrow(/Unsupported DNS opcode 2/);
    });

    test('Expect serializing an unsupported opcode to be reported', () => {
        const message = new dnsclient.QueryMessage();
        message.flags.opcode = dnsclient.OPCODE.STATUS;

        expect(() => dnsclient.DnsSerializer.serialize(message))
            .toThrow(/Unsupported DNS opcode 2/);
    });

    test('Expect a truncated rdata read to be reported as out of bounds', () => {
        const data = new Uint8Array([
            0x04, 0xD2, 0x81, 0x80,
            0x00, 0x00, 0x00, 0x01, // ANCOUNT: 1
            0x00, 0x00, 0x00, 0x00,
            0x00,                   // Name: root
            0x00, 0x01,             // Type: A
            0x00, 0x01,             // Class: IN
            0x00, 0x00, 0x00, 0x3C, // TTL
            0x00, 0x04,             // RDLENGTH: 4, but only 2 bytes follow
            0xC0, 0x00
        ]);

        expect(() => dnsclient.DnsSerializer.deserialize(data.buffer))
            .toThrow(/exceeds the available/);
    });

    test('Expect a DataView too small for a record to be reported', () => {
        const record = new dnsclient.Record(
            "example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN, 60, {ipv4: "192.0.2.1"}
        );

        expect(() => dnsclient.DnsRecordSerializer.serialize(new DataView(new ArrayBuffer(8)), 0, record))
            .toThrow(/are left in the buffer/);
    });
});

describe('Message identifiers are drawn from the full 16 bit range', () => {
    test('Expect ids to be integers within 0..65535', () => {
        for (let i = 0; i < 50; i++) {
            const {id} = new dnsclient.QueryMessage();

            expect(Number.isInteger(id)).toBe(true);
            expect(id).toBeGreaterThanOrEqual(0);
            expect(id).toBeLessThanOrEqual(0xFFFF);
        }
    });

    test('Expect ids to vary between messages', () => {
        const ids = new Set(Array.from({length: 50}, () => new dnsclient.QueryMessage().id));

        expect(ids.size).toBeGreaterThan(1);
    });
});
