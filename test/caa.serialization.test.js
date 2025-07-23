import * as dnsclient from '../dnsclient.js';

describe('Record type "CAA" should be serialized correctly', () => {
    const rdata = [
        {key: "flags", value: 0},
        {key: "tag", value: "issue"},
        {key: "value", value: "letsencrypt.org"}
    ];
    const edata = new Uint8Array([
        0x00,                   // Flags: 0
        0x05,                   // Tag Length: 5
        0x69, 0x73, 0x73, 0x75, 0x65, // Tag: "issue"
        0x6C, 0x65, 0x74, 0x73, 0x65, 0x6E, 0x63, 0x72, // Value: "letsencrypt.org"
        0x79, 0x70, 0x74, 0x2E, 0x6F, 0x72, 0x67
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.CAA.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.CAA.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

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