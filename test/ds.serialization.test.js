import * as dnsclient from '../src/dnsclient.js';

describe('Record type "DS" should be serialized correct', () => {
    const rdata = [
        {key: "keyTag", value: 12345},
        {key: "algorithm", value: 5},
        {key: "digestType", value: 1},
        {key: "digest", value: "j0R3w4w7Z/EP9BthZA73x7AdJw4="},
    ];
    const edata = new Uint8Array([
        0x30, 0x39, // Key Tag: 12345
        0x05,       // Algorithm: SHA-1 (RSA/SHA-1)
        0x01,       // Digest Type: SHA-1
        0x8f, 0x44, 0x77, 0xc3, 0x8c, 0x3b, 0x67, 0xf1, 0x0f, 0xf4, 0x1b, 0x61, 0x64, 0x0e, 0xf7, 0xc7, 0xb0, 0x1d, 0x27, 0x0e
    ]);
    const buffer = dnsclient.DnsRecordSerializer.DS.serialize(rdata);

    test('Expect buffer to be equal', () => {
        expect(buffer).toEqual(edata);
    });

    test('Expect buffer length to be correct', () => {
        expect(buffer.byteLength).toBe(edata.byteLength);
    });
});