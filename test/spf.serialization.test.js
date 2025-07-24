import * as dnsclient from '../dnsclient.js';

describe('Record type "SPF" should be serialized correctly', () => {
    const rdata = [
        {key: "text", value: "v=spf1 include:_spf.example.com ~all"}
    ];
    const edata = new Uint8Array([
        0x24, // Length: 36
        0x76, 0x3D, 0x73, 0x70, 0x66, 0x31, 0x20, 0x69, // "v=spf1 i"
        0x6E, 0x63, 0x6C, 0x75, 0x64, 0x65, 0x3A, 0x5F, // "nclude:_"
        0x73, 0x70, 0x66, 0x2E, 0x65, 0x78, 0x61, 0x6D, // "spf.exam"
        0x70, 0x6C, 0x65, 0x2E, 0x63, 0x6F, 0x6D, 0x20, // "ple.com "
        0x7E, 0x61, 0x6C, 0x6C                          // "~all"
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.SPF.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.SPF.deserialize(new DataView(serialized.buffer), 0);

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