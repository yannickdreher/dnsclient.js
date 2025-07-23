import * as dnsclient from '../dnsclient.js';

describe('Record type "MR" should be serialized correctly', () => {
    const rdata = [
        {key: "name", value: "rename.example.com"}
    ];
    const edata = new Uint8Array([
        0x06, 0x72, 0x65, 0x6E, 0x61, 0x6D, 0x65, // "rename"
        0x07, 0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, // "example"
        0x03, 0x63, 0x6F, 0x6D, // "com"
        0x00 // Null-Terminator
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.MR.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.MR.deserialize(new DataView(serialized.buffer), 0);

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