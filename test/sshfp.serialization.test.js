import * as dnsclient from '../dnsclient.js';

describe('Record type "SSHFP" should be serialized correctly', () => {
    const rdata = [
        {key: "algorithm", value: 1},
        {key: "fpType", value: 1},
        {key: "fingerprint", value: "123456789abcdef0123456789abcdef012345678"}
    ];
    const edata = new Uint8Array([
        0x01,                   // Algorithm: 1 (RSA)
        0x01,                   // Fingerprint Type: 1 (SHA-1)
        0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, // Fingerprint
        0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
        0x12, 0x34, 0x56, 0x78
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.SSHFP.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.SSHFP.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

    test('Expect buffer to be equal', () => {
        expect(serialized).toEqual(edata);
    });

    test('Expect buffer length to be correct', () => {
        expect(serialized.byteLength).toBe(edata.byteLength);
    });

    test('Expect deserialization to match original data', () => {
        expect(deserialized).toEqual(rdata);
    });
});