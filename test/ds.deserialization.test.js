import * as dnsclient from '../src/dnsclient.js';

describe('Record type "DS" should deserialize the data correct', () => {
    const data = new Uint8Array([
        0x30, 0x39, // Key Tag: 12345
        0x05,       // Algorithm: SHA-1 (RSA/SHA-1)
        0x01,       // Digest Type: SHA-1
        0x8f, 0x44, 0x77, 0xc3, 0x8c, 0x3b, 0x67, 0xf1, 0x0f, 0xf4, 0x1b, 0x61, 0x64, 0x0e, 0xf7, 0xc7, 0xb0, 0x1d, 0x27, 0x0e
    ]);
    const view = new DataView(data.buffer);
    const result = dnsclient.DnsRecordSerializer.DS.deserialize(view, 0, data.length);

    test('keyTag is 12345', () => {
        expect(result[0].value).toBe(12345);
    });

    test('algorithm is 5', () => {
        expect(result[1].value).toBe(5);
    });

    test('digestType is 1', () => {
        expect(result[2].value).toBe(1);
    });

    test('digest is correct', () => {
        expect(result[3].value).toBe('j0R3w4w7Z/EP9BthZA73x7AdJw4=');
    });
});