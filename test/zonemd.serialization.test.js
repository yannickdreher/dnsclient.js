import * as dnsclient from '../dnsclient.js';

describe('Record type "ZONEMD" should be serialized correctly', () => {
    const rdata = { serial: 12345, scheme: 1, algorithm: 1, digest: "abcdef1234567890" };
    const edata = new Uint8Array([
        0x00, 0x00, 0x30, 0x39, // Serial: 12345
        0x01,                   // Scheme: 1
        0x01,                   // Algorithm: 1
        0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90 // Digest
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.ZONEMD.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.ZONEMD.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

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