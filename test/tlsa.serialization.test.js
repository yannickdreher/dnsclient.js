import * as dnsclient from '../dnsclient.js';

describe('Record type "TLSA" should be serialized correctly', () => {
    const rdata = [
        {key: "usage", value: 3},
        {key: "selector", value: 1},
        {key: "matchingType", value: 1},
        {key: "certAssocData", value: "0123456789abcdef0123456789abcdef01234567"}
    ];
    const edata = new Uint8Array([
        0x03,                   // Usage: 3 (Domain issued certificate)
        0x01,                   // Selector: 1 (SubjectPublicKeyInfo)
        0x01,                   // Matching Type: 1 (SHA-256)
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, // Certificate Association Data
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
        0x01, 0x23, 0x45, 0x67
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.TLSA.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.TLSA.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

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