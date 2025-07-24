import * as dnsclient from '../dnsclient.js';

describe('Record type "MF" should be serialized correctly', () => {
    const rdata = [
        {key: "name", value: "forwarder.example.com"}
    ];
    const edata = new Uint8Array([
        0x09, 0x66, 0x6F, 0x72, 0x77, 0x61, 0x72, 0x64, 0x65, 0x72, // "forwarder" (length 9 + 'f', 'o', 'r', 'w', 'a', 'r', 'd', 'e', 'r')
        0x07, 0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, // "example" (length 7 + 'e', 'x', 'a', 'm', 'p', 'l', 'e')
        0x03, 0x63, 0x6F, 0x6D, // "com" (length 3 + 'c', 'o', 'm')
        0x00 // Null-Terminator
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.MF.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.MF.deserialize(new DataView(serialized.buffer), 0);

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