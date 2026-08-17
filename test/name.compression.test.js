import * as dnsclient from '../dnsclient.js';

describe('DNS name compression pointers are followed safely', () => {
    test('A backwards pointer is resolved to the full name', () => {
        // "example.com" at offset 0, then a pointer back to it at offset 13.
        const data = new Uint8Array([
            0x07, 0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, // "example"
            0x03, 0x63, 0x6F, 0x6D, 0x00,                   // "com" + root
            0x03, 0x77, 0x77, 0x77, 0xC0, 0x00              // "www" + pointer to offset 0
        ]);
        const result = dnsclient.DnsNameSerializer.deserialize(new DataView(data.buffer), 13);

        expect(result.name).toBe('www.example.com');
        expect(result.offset).toBe(19);
        expect(result.length).toBe(6);
    });

    test('A self-referencing pointer throws instead of looping forever', () => {
        // The pointer at offset 0 points back at offset 0.
        const data = new Uint8Array([0xC0, 0x00]);

        expect(() => dnsclient.DnsNameSerializer.deserialize(new DataView(data.buffer), 0))
            .toThrow(/Cyclic DNS name compression pointer/);
    });

    test('Two pointers referencing each other throw instead of looping forever', () => {
        const data = new Uint8Array([
            0xC0, 0x02, // offset 0 -> offset 2
            0xC0, 0x00  // offset 2 -> offset 0
        ]);

        expect(() => dnsclient.DnsNameSerializer.deserialize(new DataView(data.buffer), 0))
            .toThrow(/Cyclic DNS name compression pointer/);
    });

    test('A whole message with a cyclic question name throws instead of hanging', () => {
        const data = new Uint8Array([
            0x04, 0xD2,             // ID
            0x01, 0x00,             // Flags
            0x00, 0x01,             // QDCOUNT: 1
            0x00, 0x00, 0x00, 0x00, // ANCOUNT / NSCOUNT
            0x00, 0x00,             // ARCOUNT
            0xC0, 0x0C              // Question name: pointer to itself (offset 12)
        ]);

        expect(() => dnsclient.DnsSerializer.deserialize(data.buffer))
            .toThrow(/Cyclic DNS name compression pointer/);
    });

    test('A pointer past the end of the message throws', () => {
        const data = new Uint8Array([0xC0, 0xFF]);

        expect(() => dnsclient.DnsNameSerializer.deserialize(new DataView(data.buffer), 0))
            .toThrow(/runs past the end of the message/);
    });

    test('A reserved label type throws', () => {
        const data = new Uint8Array([0x80, 0x00]);

        expect(() => dnsclient.DnsNameSerializer.deserialize(new DataView(data.buffer), 0))
            .toThrow(/Reserved DNS label type/);
    });
});

describe('Deserialization honours the byteOffset of the DataView', () => {
    test('A name is decoded correctly through a DataView over a sub-region', () => {
        // Two leading bytes emulate a TCP length prefix in front of the name.
        const data = new Uint8Array([
            0xFF, 0xFF,                                     // prefix outside the view
            0x07, 0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, // "example"
            0x03, 0x63, 0x6F, 0x6D, 0x00                    // "com" + root
        ]);
        const view = new DataView(data.buffer, 2);

        expect(dnsclient.DnsNameSerializer.deserialize(view, 0).name).toBe('example.com');
    });

    test('An A record is decoded correctly through a DataView over a sub-region', () => {
        const data = new Uint8Array([0xFF, 0xFF, 0xFF, 0xC0, 0x00, 0x02, 0x01]);
        const view = new DataView(data.buffer, 3);

        expect(dnsclient.DnsRecordSerializer.A.deserialize(view, 0, 4).ipv4).toBe('192.0.2.1');
    });

    test('A whole message is deserialized correctly through a sub-region view', () => {
        const message = new dnsclient.QueryMessage();
        message.id = 4711;
        message.questions.push(new dnsclient.Question('example.com', dnsclient.TYPE.A, dnsclient.CLAZZ.IN));
        const wire = dnsclient.DnsSerializer.serialize(message);

        // Embed the message behind a 2-byte length prefix, as DNS over TCP does.
        const framed = new Uint8Array(2 + wire.byteLength);
        new DataView(framed.buffer).setUint16(0, wire.byteLength, false);
        framed.set(wire, 2);

        const result = dnsclient.DnsSerializer.deserialize(framed.subarray(2));

        expect(result.id).toBe(4711);
        expect(result.questions[0].name).toBe('example.com');
    });
});

describe('DNS name serialization validates its input', () => {
    test('A label longer than 63 bytes is rejected', () => {
        expect(() => dnsclient.DnsNameSerializer.serialize(`${'a'.repeat(64)}.com`))
            .toThrow(/exceeds 63 bytes/);
    });

    test('An empty label is rejected', () => {
        expect(() => dnsclient.DnsNameSerializer.serialize('example..com'))
            .toThrow(/Empty label/);
    });

    test('A name longer than 255 bytes in wire format is rejected', () => {
        const name = Array(20).fill('a'.repeat(15)).join('.');

        expect(() => dnsclient.DnsNameSerializer.serialize(name))
            .toThrow(/exceeds 255 bytes/);
    });

    test('The root name serializes to a single zero byte', () => {
        expect(dnsclient.DnsNameSerializer.serialize('.')).toEqual(new Uint8Array([0]));
        expect(dnsclient.DnsNameSerializer.serialize('')).toEqual(new Uint8Array([0]));
    });

    test('A trailing dot is accepted and does not add an empty label', () => {
        expect(dnsclient.DnsNameSerializer.serialize('example.com.'))
            .toEqual(dnsclient.DnsNameSerializer.serialize('example.com'));
    });
});
