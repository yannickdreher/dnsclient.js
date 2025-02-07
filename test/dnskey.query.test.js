import * as dnsclient from '../src/dnsclient.js';

describe('Record type "DNSKEY" should return the correct data', () => {
    const data = new Uint8Array([
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
    const view = new DataView(data.buffer);
    const result = dnsclient.DnsSerializer.DNSKEY.deserialize(view, 0, data.length);

    test('flag is ZSK', () => {
        expect(result[0].value).toBe('ZSK');
    });

    test('protocol is 3', () => {
        expect(result[1].value).toBe(3);
    });

    test('algorithm is 8', () => {
        expect(result[2].value).toBe(8);
    });

    test('publickey is correct', () => {
        expect(result[3].value).toBe('VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIDEzIGxhenkgZG9ncy4=');
    });
});