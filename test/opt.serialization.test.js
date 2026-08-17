import * as dnsclient from '../dnsclient.js';

describe('Record type "OPT" (EDNS(0)) should be serialized correctly', () => {
    const rdata = {options: [
            {code: 10, data: "0123456789abcdef"}, // COOKIE
            {code: 12, data: "0000"}              // PADDING
        ]};
    const edata = new Uint8Array([
        0x00, 0x0A,                                     // Option Code: 10 (COOKIE)
        0x00, 0x08,                                     // Option Length: 8
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, // Option Data
        0x00, 0x0C,                                     // Option Code: 12 (PADDING)
        0x00, 0x02,                                     // Option Length: 2
        0x00, 0x00                                      // Option Data
    ]);

    const serialized = dnsclient.DnsRecordSerializer.OPT.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.OPT.deserialize(
        new DataView(serialized.buffer), 0, serialized.byteLength
    );

    test('Expect buffer to be equal', () => {
        expect(serialized).toEqual(edata);
    });

    test('Expect deserialization to match original data', () => {
        expect(deserialized).toEqual(rdata);
    });

    test('Expect an OPT record without options to round-trip', () => {
        const empty = {options: []};
        const bytes = dnsclient.DnsRecordSerializer.OPT.serialize(empty);

        expect(bytes.byteLength).toBe(0);
        expect(dnsclient.DnsRecordSerializer.OPT.deserialize(new DataView(new ArrayBuffer(0)), 0, 0))
            .toEqual(empty);
    });

    test('Expect an OPT record in the additional section to be parsed, not discarded', () => {
        // An OPT record repurposes the class field as the UDP payload size and
        // the TTL field as the extended rcode and flags.
        const message = new dnsclient.QueryMessage();
        message.questions.push(new dnsclient.Question("example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN));
        message.additionals.push(new dnsclient.Record(".", dnsclient.TYPE.OPT, 4096, 0, rdata));

        const result = dnsclient.DnsSerializer.deserialize(dnsclient.DnsSerializer.serialize(message).buffer);

        expect(result.additionals[0].name).toBe(".");
        expect(result.additionals[0].type).toBe(dnsclient.TYPE.OPT);
        expect(result.additionals[0].clazz).toBe(4096);
        expect(result.additionals[0].data).toEqual(rdata);
    });

    test('Expect a truncated option to be reported', () => {
        const data = new Uint8Array([0x00, 0x0A, 0x00, 0xFF, 0x01]);

        expect(() => dnsclient.DnsRecordSerializer.OPT.deserialize(new DataView(data.buffer), 0, data.byteLength))
            .toThrow(/Truncated EDNS\(0\) option/);
    });
});

describe('Records without a dedicated codec keep their raw data', () => {
    test('Expect the rdata of an unassigned type to survive a round-trip', () => {
        const raw = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
        const message = new dnsclient.QueryMessage();
        message.answers.push(new dnsclient.Record("example.com", 54, dnsclient.CLAZZ.IN, 3600, raw));

        const result = dnsclient.DnsSerializer.deserialize(dnsclient.DnsSerializer.serialize(message).buffer);

        expect(result.answers[0].type).toBe(54);
        expect(result.answers[0].data).toEqual(raw);
    });

    test.each([
        ["APL", 42],
        ["HIP", 55],
        ["A6", 38],
        ["SIG", 24]
    ])('Expect the rdata of a %s record to survive a round-trip', (name, type) => {
        const raw = new Uint8Array([0x01, 0x02, 0x03]);
        const message = new dnsclient.QueryMessage();
        message.answers.push(new dnsclient.Record("example.com", type, dnsclient.CLAZZ.IN, 60, raw));

        const result = dnsclient.DnsSerializer.deserialize(dnsclient.DnsSerializer.serialize(message).buffer);

        expect(result.answers[0].data).toEqual(raw);
    });

    test('Expect a record with empty rdata to stay empty', () => {
        const message = new dnsclient.QueryMessage();
        message.answers.push(new dnsclient.Record("example.com", 54, dnsclient.CLAZZ.IN, 60, new Uint8Array(0)));

        const result = dnsclient.DnsSerializer.deserialize(dnsclient.DnsSerializer.serialize(message).buffer);

        expect(result.answers[0].data).toEqual(new Uint8Array(0));
    });

    test('Expect structured rdata for an unsupported type to be rejected clearly', () => {
        const record = new dnsclient.Record("example.com", 54, dnsclient.CLAZZ.IN, 60, {x: 1});

        expect(() => dnsclient.DnsRecordSerializer.toBytes(record))
            .toThrow(/pass raw bytes as a Uint8Array instead/);
    });
});

describe('The newly supported record types round-trip', () => {
    const cases = [
        ["KX", dnsclient.TYPE.KX, {preference: 10, exchanger: "kx.example.com"}],
        ["X25", dnsclient.TYPE.X25, {address: "311061700956"}],
        ["NID", dnsclient.TYPE.NID, {preference: 10, nodeId: "0014 4fff 2000 0000".replace(/ /g, "")}],
        ["L32", dnsclient.TYPE.L32, {preference: 10, locator32: "10.1.2.0"}],
        ["L64", dnsclient.TYPE.L64, {preference: 10, locator64: "2001 0db8 1140 1000".replace(/ /g, "")}],
        ["LP", dnsclient.TYPE.LP, {preference: 10, fqdn: "l64-subnet1.example.com"}],
        ["EUI48", dnsclient.TYPE.EUI48, {address: "00-00-5e-00-53-2a"}],
        ["EUI64", dnsclient.TYPE.EUI64, {address: "00-00-5e-ef-10-00-00-2a"}]
    ];

    test.each(cases)('Expect a %s record to round-trip through a message', (name, type, rdata) => {
        const message = new dnsclient.QueryMessage();
        message.answers.push(new dnsclient.Record("example.com", type, dnsclient.CLAZZ.IN, 3600, rdata));

        const result = dnsclient.DnsSerializer.deserialize(dnsclient.DnsSerializer.serialize(message).buffer);

        expect(result.answers[0].data).toEqual(rdata);
    });
});
