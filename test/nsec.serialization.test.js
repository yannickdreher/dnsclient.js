import * as dnsclient from '../dnsclient.js';

describe('Record type "NSEC" should be serialized correctly', () => {
    const rdata = {nextDomain: "host.example.com", typeBitmaps: ["A", "MX", "RRSIG", "NSEC"]};
    // RFC 4034 §4.3 example: window 0, 6 bytes, bits for A (1), MX (15),
    // RRSIG (46) and NSEC (47).
    const edata = new Uint8Array([
        0x04, 0x68, 0x6F, 0x73, 0x74,                   // "host"
        0x07, 0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, // "example"
        0x03, 0x63, 0x6F, 0x6D, 0x00,                   // "com" + root
        0x00,                                           // Window Block: 0
        0x06,                                           // Bitmap Length: 6
        0x40, 0x01, 0x00, 0x00, 0x00, 0x03              // A | MX | RRSIG | NSEC
    ]);

    const serialized = dnsclient.DnsRecordSerializer.NSEC.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.NSEC.deserialize(
        new DataView(serialized.buffer), 0, serialized.byteLength
    );

    test('Expect buffer to be equal', () => {
        expect(serialized).toEqual(edata);
    });

    test('Expect buffer length to be correct', () => {
        expect(serialized.byteLength).toBe(edata.byteLength);
    });

    test('Expect deserialization to match original data', () => {
        expect(deserialized).toEqual(rdata);
    });

    test('Expect a record with an NSEC answer to serialize', () => {
        const message = new dnsclient.QueryMessage();
        message.answers.push(new dnsclient.Record(
            "example.com", dnsclient.TYPE.NSEC, dnsclient.CLAZZ.IN, 3600, rdata
        ));

        const wire = dnsclient.DnsSerializer.serialize(message);
        const result = dnsclient.DnsSerializer.deserialize(wire.buffer);

        expect(result.answers[0].data).toEqual(rdata);
    });

    test('Expect types spanning several windows to round-trip', () => {
        const spanning = {nextDomain: "example.com", typeBitmaps: ["A", "CAA", "TA", "DLV"]};
        const bytes = dnsclient.DnsRecordSerializer.NSEC.serialize(spanning);
        const back = dnsclient.DnsRecordSerializer.NSEC.deserialize(
            new DataView(bytes.buffer), 0, bytes.byteLength
        );

        // CAA is 257 (window 1), TA is 32768 and DLV is 32769 (window 128).
        expect(back.typeBitmaps).toEqual(["A", "CAA", "TA", "DLV"]);
    });

    test('Expect an empty type bitmap to round-trip', () => {
        const empty = {nextDomain: "example.com", typeBitmaps: []};
        const bytes = dnsclient.DnsRecordSerializer.NSEC.serialize(empty);
        const back = dnsclient.DnsRecordSerializer.NSEC.deserialize(
            new DataView(bytes.buffer), 0, bytes.byteLength
        );

        expect(back).toEqual(empty);
    });
});
