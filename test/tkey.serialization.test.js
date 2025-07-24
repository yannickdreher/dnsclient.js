import * as dnsclient from '../dnsclient.js';

describe('Record type "TKEY" should be serialized correctly', () => {
    const rdata = [
        {key: "algorithm", value: "hmac-sha256"},
        {key: "inception", value: new Date('2024-01-01T00:00:00Z')},
        {key: "expiration", value: new Date('2024-12-31T23:59:59Z')},
        {key: "mode", value: 3},
        {key: "error", value: 0},
        {key: "key", value: "VGVzdEtleQ=="}, // "TestKey" in base64
        {key: "other", value: ""}
    ];
    const edata = new Uint8Array([
        0x0B, 0x68, 0x6D, 0x61, 0x63, 0x2D, 0x73, 0x68, 0x61, 0x32, 0x35, 0x36, // "hmac-sha256"
        0x00,                               // Null terminator
        0x65, 0x9F, 0xE8, 0x00,            // Inception: 1704067200 (2024-01-01)
        0x67, 0x76, 0x5F, 0xFF,            // Expiration: 1735689599 (2024-12-31)
        0x00, 0x03,                        // Mode: 3
        0x00, 0x00,                        // Error: 0
        0x00, 0x07,                        // Key Length: 7
        0x54, 0x65, 0x73, 0x74, 0x4B, 0x65, 0x79, // Key: "TestKey"
        0x00, 0x00                         // Other Length: 0
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.TKEY.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.TKEY.deserialize(new DataView(serialized.buffer), 0, serialized.byteLength);

    test('Expect buffer length to be correct', () => {
        expect(serialized.byteLength).toBe(edata.byteLength);
    });

    test('Expect deserialization to match original data', () => {
        expect(deserialized[0].value).toBe("hmac-sha256"); // algorithm
        expect(deserialized[3].value).toBe(3); // mode
        expect(deserialized[4].value).toBe(0); // error
        expect(deserialized[5].value).toBe("VGVzdEtleQ=="); // key
    });
});