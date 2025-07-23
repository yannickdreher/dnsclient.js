import * as dnsclient from '../dnsclient.js';

describe('Record type "RP" should be serialized correctly', () => {
    const rdata = [
        {key: "mbox", value: "admin.example.com"},
        {key: "txt", value: "info.example.com"}
    ];
    const edata = new Uint8Array([
        0x05, 0x61, 0x64, 0x6D, 0x69, 0x6E, // "admin"
        0x07, 0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, // "example"
        0x03, 0x63, 0x6F, 0x6D, // "com"
        0x00, // Null-Terminator
        0x04, 0x69, 0x6E, 0x66, 0x6F, // "info"
        0x07, 0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, // "example"
        0x03, 0x63, 0x6F, 0x6D, // "com"
        0x00 // Null-Terminator
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.RP.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.RP.deserialize(new DataView(serialized.buffer), 0);

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