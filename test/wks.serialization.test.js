import * as dnsclient from '../dnsclient.js';

describe('Record type "WKS" should be serialized correctly', () => {
    const rdata = [
        {key: "address", value: "192.0.2.1"},
        {key: "protocol", value: 6},  // TCP
        {key: "ports", value: [80, 443]}
    ];
    const edata = new Uint8Array([
        0xC0, 0x00, 0x02, 0x01, // IP Address: 192.0.2.1
        0x06,                   // Protocol: TCP (6)
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, // Port bitmap for ports 80 and 443
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x01
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.WKS.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.WKS.deserialize(new DataView(serialized.buffer), 0, serialized.byteLength);

    test('Expect buffer length to be correct', () => {
        expect(serialized.byteLength).toBe(61); // 4 (IP) + 1 (protocol) + 56 (bitmap for port 443)
    });

    test('Expect deserialization to match original data', () => {
        expect(deserialized).toEqual(rdata);
    });
});