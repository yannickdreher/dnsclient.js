import * as dnsclient from '../dnsclient.js';

describe('Record type "IPSECKEY" should be serialized correctly', () => {
    const rdata = [
        {key: "precedence", value: 10},
        {key: "gatewayType", value: 1}, // IPv4
        {key: "algorithm", value: 2},
        {key: "gateway", value: "192.0.2.1"},
        {key: "publickey", value: "VGVzdEtleQ=="} // "TestKey" in base64
    ];
    const edata = new Uint8Array([
        0x0A,                   // Precedence: 10
        0x01,                   // Gateway Type: 1 (IPv4)
        0x02,                   // Algorithm: 2
        0xC0, 0x00, 0x02, 0x01, // Gateway: 192.0.2.1
        0x54, 0x65, 0x73, 0x74, 0x4B, 0x65, 0x79 // Public Key: "TestKey"
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.IPSECKEY.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.IPSECKEY.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

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