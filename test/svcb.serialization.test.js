import * as dnsclient from '../dnsclient.js';

describe('Record type "SVCB" should be serialized correctly', () => {
    const rdata = { priority: 1, target: "svc.example.com", params: { 1: "6832", 3: "01bb" } };
    const edata = new Uint8Array([
        0x00, 0x01,             // Priority: 1
        0x03, 0x73, 0x76, 0x63, // "svc"
        0x07, 0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, // "example"
        0x03, 0x63, 0x6F, 0x6D, // "com"
        0x00,                   // Null-Terminator
        0x00, 0x01,             // Param Key: 1 (alpn)
        0x00, 0x02,             // Param Length: 2
        0x68, 0x32,             // Param Value: "h2"
        0x00, 0x03,             // Param Key: 3 (port)
        0x00, 0x02,             // Param Length: 2
        0x01, 0xbb              // Param Value: 443
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.SVCB.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.SVCB.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

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
