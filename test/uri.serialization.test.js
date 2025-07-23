import * as dnsclient from '../dnsclient.js';

describe('Record type "URI" should be serialized correctly', () => {
    const rdata = [
        {key: "priority", value: 10},
        {key: "weight", value: 1},
        {key: "target", value: "https://example.com/"}
    ];
    const edata = new Uint8Array([
        0x00, 0x0A,             // Priority: 10
        0x00, 0x01,             // Weight: 1
        0x68, 0x74, 0x74, 0x70, 0x73, 0x3A, 0x2F, 0x2F, // "https://"
        0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, 0x2E, // "example."
        0x63, 0x6F, 0x6D, 0x2F                          // "com/"
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.URI.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.URI.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

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