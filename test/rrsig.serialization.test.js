import * as dnsclient from '../dnsclient.js';

describe('Record type "RRSIG" should be serialized correctly', () => {
    const rdata = { typeCovered: dnsclient.TYPE.A, algorithm: 8, labels: 2, originalTtl: 86400, expiration: new Date("1970-01-02T01:20:31.000Z"), inception: new Date("1970-01-02T01:11:57.000Z"), keyTag: 12345, signersName: "example.com", signature: "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIDEzIGxhenkgZG9ncy4=" };
    const edata = new Uint8Array([
        0x00, 0x01, // Type 1 (A Record)
        0x08, // Algorithm 8 (RSA/SHA-256)
        0x02, // 2 Labels (example.com)
        0x00, 0x01, 0x51, 0x80, // 86400 in big endian
        0x00, 0x01, 0x64, 0x5F, // 1970-01-02T01:20:31.000Z
        0x00, 0x01, 0x62, 0x5D, // 1970-01-02T01:11:57.000Z
        0x30, 0x39, // Key Tag 12345
        0x07, 0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, // "example"
        0x03, 0x63, 0x6F, 0x6D, 0x00, // "com" + NULL byte
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

    const serialized = dnsclient.DnsRecordSerializer.RRSIG.serialize(rdata);

    test('Expect buffer to be equal', () => {
        expect(serialized).toEqual(edata);
    });

    test('Expect buffer length to be correct', () => {
        expect(serialized.byteLength).toBe(edata.byteLength);
    });
});