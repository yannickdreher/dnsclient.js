import * as dnsclient from '../dnsclient.js';

describe('Record type "SMIMEA" should be serialized correctly', () => {
    const rdata = [
        {key: "usage", value: 3},
        {key: "selector", value: 1},
        {key: "matchingType", value: 1},
        {key: "certAssocData", value: "abcdef1234567890"}
    ];
    const edata = new Uint8Array([
        0x03,                   // Usage: 3
        0x01,                   // Selector: 1
        0x01,                   // Matching Type: 1
        0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90 // Certificate Association Data
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.SMIMEA.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.SMIMEA.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

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