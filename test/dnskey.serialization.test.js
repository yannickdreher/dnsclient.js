import * as dnsclient from '../dnsclient.js';

describe('Record type "DNSKEY" should be serialized correctly', () => {
    const rdata = [
        {key: "flag", value: "ZSK"},
        {key: "protocol", value: 3},
        {key: "algorithm", value: 8},
        {key: "publickey", value: "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIDEzIGxhenkgZG9ncy4="}
    ];
    const edata = new Uint8Array([
        0x01, 0x00,       // Flags: 256 (ZSK)
        0x03,             // Protokoll: 3 (DNSSEC)
        0x08,             // Algorithmus: 8 (RSA/SHA-256)
        0x54, 0x68, 0x65, 0x20,
        0x71, 0x75, 0x69, 0x63,
        0x6b, 0x20, 0x62, 0x72,
        0x6f, 0x77, 0x6e, 0x20,
        0x66, 0x6f, 0x78, 0x20,
        0x6a, 0x75, 0x6d, 0x70,
        0x73, 0x20, 0x6f, 0x76,
        0x65, 0x72, 0x20, 0x31,
        0x33, 0x20, 0x6c, 0x61,
        0x7a, 0x79, 0x20, 0x64,
        0x6f, 0x67, 0x73, 0x2e
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.DNSKEY.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.DNSKEY.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

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