import * as dnsclient from '../dnsclient.js';

describe('Record type "NSEC3" should be serialized correctly', () => {
    const rdata = { algorithm: 1, flags: 0, iterations: 12, salt: "aabbcc", nextHashedOwnerName: "123456789abcdef0", typeBitmaps: ["A", "NS"] };
    const edata = new Uint8Array([
        0x01,                   // Algorithm: 1
        0x00,                   // Flags: 0
        0x00, 0x0C,             // Iterations: 12
        0x03,                   // Salt Length: 3
        0xaa, 0xbb, 0xcc,       // Salt: aabbcc
        0x08,                   // Hash Length: 8
        0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, // Next Hashed Owner Name
        0x00,                   // Window Block: 0
        0x01,                   // Bitmap Length: 1
        0x60                    // Type Bitmap: A (1) | NS (2)
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.NSEC3.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.NSEC3.deserialize(new DataView(serialized.buffer), 0, serialized.byteLength);

    test('Expect buffer to be equal', () => {
        expect(serialized).toEqual(edata);
    });

    test('Expect buffer length to be correct', () => {
        expect(serialized.byteLength).toBe(edata.byteLength);
    });

    test('Expect deserialization to match original data', () => {
        expect(deserialized).toEqual(rdata);
    });

    test('Expect the type bitmap to be encoded, not zeroed', () => {
        // The bitmap follows the 6 byte header, 3 bytes of salt and 8 bytes of hash.
        expect(Array.from(serialized.subarray(6 + 3 + 8))).toEqual([0x00, 0x01, 0x60]);
        expect(deserialized.typeBitmaps).toEqual(["A", "NS"]);
    });
});
