import * as dnsclient from '../dnsclient.js';

describe('Record type "SRV" should be serialized correctly', () => {
    const rdata = [
        {key: "priority", value: 10},
        {key: "weight", value: 5},
        {key: "port", value: 5060},
        {key: "target", value: "sip.example.com"},
    ];
    const edata = new Uint8Array([
        0x00, 0x0A, // Priority = 10
        0x00, 0x05, // Weight = 5
        0x13, 0xC4, // Port = 5060
        0x03, 0x73, 0x69, 0x70, // "sip"
        0x07, 0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, // "example"
        0x03, 0x63, 0x6F, 0x6D, // "com"
        0x00 // Null-Terminator
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.SRV.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.SRV.deserialize(new DataView(serialized.buffer), 0);

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