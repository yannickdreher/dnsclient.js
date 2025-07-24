import * as dnsclient from '../dnsclient.js';

describe('Record type "NSEC3" should be serialized correctly', () => {
    const rdata = [
        {key: "algorithm", value: 1},
        {key: "flags", value: 0},
        {key: "iterations", value: 12},
        {key: "salt", value: "aabbcc"},
        {key: "nextHashedOwnerName", value: "123456789abcdef0"},
        {key: "typeBitmaps", value: ["A", "NS"]}
    ];
    const edata = new Uint8Array([
        0x01,                   // Algorithm: 1
        0x00,                   // Flags: 0
        0x00, 0x0C,             // Iterations: 12
        0x03,                   // Salt Length: 3
        0xaa, 0xbb, 0xcc,       // Salt: aabbcc
        0x08,                   // Hash Length: 8
        0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, // Next Hashed Owner Name
        0x00,                   // Block Number: 0
        0x01,                   // Block Length: 1
        0x00                    // Type Bitmap (simplified)
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.NSEC3.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.NSEC3.deserialize(new DataView(serialized.buffer), 0, serialized.byteLength);

    test('Expect buffer length to be correct', () => {
        expect(serialized.byteLength).toBe(edata.byteLength);
    });

    test('Expect deserialization to match original data', () => {
        expect(deserialized[0].value).toBe(1); // algorithm
        expect(deserialized[1].value).toBe(0); // flags
        expect(deserialized[2].value).toBe(12); // iterations
        expect(deserialized[3].value).toBe("aabbcc"); // salt
        expect(deserialized[4].value).toBe("123456789abcdef0"); // nextHashedOwnerName
    });
});