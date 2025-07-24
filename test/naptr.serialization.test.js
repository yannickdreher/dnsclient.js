import * as dnsclient from '../dnsclient.js';

describe('Record type "NAPTR" should be serialized correctly', () => {
    const rdata = [
        {key: "order", value: 100},
        {key: "preference", value: 10},
        {key: "flags", value: "u"},
        {key: "services", value: "E2U+sip"},
        {key: "regexp", value: "!^.*$!sip:info@example.com!"},
        {key: "replacement", value: "."}
    ];
    const edata = new Uint8Array([
        0x00, 0x64,             // Order: 100
        0x00, 0x0A,             // Preference: 10
        0x01, 0x75,             // Flags: "u" (length 1 + 'u')
        0x07, 0x45, 0x32, 0x55, 0x2B, 0x73, 0x69, 0x70, // Services: "E2U+sip" (length 7 + bytes)
        0x1B,                   // Regexp length: 27
        0x21, 0x5E, 0x2E, 0x2A, 0x24, 0x21, 0x73, 0x69, // "!^.*$!si"
        0x70, 0x3A, 0x69, 0x6E, 0x66, 0x6F, 0x40, 0x65, // "p:info@e"
        0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, 0x2E, 0x63, // "xample.c"
        0x6F, 0x6D, 0x21,       // "om!"
        0x00                    // Replacement: "." (root domain - just null byte)
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.NAPTR.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.NAPTR.deserialize(new DataView(serialized.buffer), 0);

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