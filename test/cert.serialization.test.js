import * as dnsclient from '../dnsclient.js';

describe('Record type "CERT" should be serialized correctly', () => {
    const rdata = [
        {key: "type", value: 1},
        {key: "keyTag", value: 12345},
        {key: "algorithm", value: 8},
        {key: "certificate", value: "VGVzdENlcnQ="}  // "TestCert" in base64
    ];
    const edata = new Uint8Array([
        0x00, 0x01,             // Type: 1
        0x30, 0x39,             // Key Tag: 12345
        0x08,                   // Algorithm: 8
        0x54, 0x65, 0x73, 0x74, 0x43, 0x65, 0x72, 0x74  // Certificate: "TestCert"
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.CERT.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.CERT.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

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