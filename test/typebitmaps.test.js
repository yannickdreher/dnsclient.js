import * as dnsclient from '../dnsclient.js';

describe('NSEC3 type bitmaps survive a round-trip', () => {
    const rdata = {algorithm: 1, flags: 0, iterations: 12, salt: "aabbcc", nextHashedOwnerName: "123456789abcdef0", typeBitmaps: ["A", "MX", "TXT", "AAAA"]};

    const serialized = dnsclient.DnsRecordSerializer.NSEC3.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.NSEC3.deserialize(
        new DataView(serialized.buffer), 0, serialized.byteLength
    );

    test('Expect deserialization to match original data', () => {
        expect(deserialized).toEqual(rdata);
    });

    test('Expect the type bitmap to be encoded, not zeroed', () => {
        // Header is 6 bytes + 3 bytes salt + 8 bytes hash, then the window block.
        const bitmap = serialized.subarray(6 + 3 + 8);

        expect(bitmap[0]).toBe(0x00); // Window Block: 0
        expect(bitmap[1]).toBe(0x04); // Bitmap Length: 4 (highest type is AAAA = 28)
        expect(Array.from(bitmap.subarray(2))).not.toEqual([0, 0, 0, 0]);
    });

    test('Expect an empty type bitmap to round-trip', () => {
        const empty = {...rdata, typeBitmaps: []};
        const bytes = dnsclient.DnsRecordSerializer.NSEC3.serialize(empty);
        const back = dnsclient.DnsRecordSerializer.NSEC3.deserialize(new DataView(bytes.buffer), 0, bytes.byteLength);

        expect(back).toEqual(empty);
    });

    test('Expect an empty salt to round-trip', () => {
        const noSalt = {...rdata, salt: ""};
        const bytes = dnsclient.DnsRecordSerializer.NSEC3.serialize(noSalt);
        const back = dnsclient.DnsRecordSerializer.NSEC3.deserialize(new DataView(bytes.buffer), 0, bytes.byteLength);

        expect(back).toEqual(noSalt);
    });
});

describe('CSYNC type bitmaps survive a round-trip', () => {
    const rdata = {serial: 66, flags: 3, typeBitmaps: ["A", "NS", "AAAA"]};
    // RFC 7477 §2.2.1 example bitmap for A, NS and AAAA.
    const edata = new Uint8Array([
        0x00, 0x00, 0x00, 0x42, // Serial: 66
        0x00, 0x03,             // Flags: 3
        0x00,                   // Window Block: 0
        0x04,                   // Bitmap Length: 4
        0x60, 0x00, 0x00, 0x08  // A | NS | AAAA
    ]);

    const serialized = dnsclient.DnsRecordSerializer.CSYNC.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.CSYNC.deserialize(
        new DataView(serialized.buffer), 0, serialized.byteLength
    );

    test('Expect buffer to be equal', () => {
        expect(serialized).toEqual(edata);
    });

    test('Expect deserialization to match original data', () => {
        expect(deserialized).toEqual(rdata);
    });

    test('Expect a CSYNC record in a message to round-trip', () => {
        const message = new dnsclient.QueryMessage();
        message.answers.push(new dnsclient.Record(
            "example.com", dnsclient.TYPE.CSYNC, dnsclient.CLAZZ.IN, 3600, rdata
        ));

        const result = dnsclient.DnsSerializer.deserialize(dnsclient.DnsSerializer.serialize(message).buffer);

        expect(result.answers[0].data).toEqual(rdata);
    });
});

describe('Type bitmaps report unnamed types without losing them', () => {
    test('Expect an unassigned type code to round-trip as TYPE<n>', () => {
        // Type 54 has no mnemonic in the registry.
        const rdata = {nextDomain: "example.com", typeBitmaps: ["TYPE54"]};
        const bytes = dnsclient.DnsRecordSerializer.NSEC.serialize(rdata);
        const back = dnsclient.DnsRecordSerializer.NSEC.deserialize(new DataView(bytes.buffer), 0, bytes.byteLength);

        expect(back).toEqual(rdata);
    });
});
