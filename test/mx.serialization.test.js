import * as dnsclient from '../dnsclient.js';

describe('Record type "MX" should be serialized correctly', () => {
    const rdata = [
        {key: "preference", value: 10},
        {key: "exchange", value: "mail.example.com"}
    ];
    const edata = new Uint8Array([
        0x00, 0x0A, // Preference: 10 (in hex)
        0x04, 0x6D, 0x61, 0x69, 0x6C, // "mail" (length 4 + 'm', 'a', 'i', 'l')
        0x07, 0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, // "example" (length 7 + 'e', 'x', 'a', 'm', 'p', 'l', 'e')
        0x03, 0x63, 0x6F, 0x6D, // "com" (length 3 + 'c', 'o', 'm')
        0x00
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.MX.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.MX.deserialize(new DataView(serialized.buffer), 0);

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