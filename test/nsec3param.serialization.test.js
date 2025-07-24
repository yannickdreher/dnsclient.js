import * as dnsclient from '../dnsclient.js';

describe('Record type "NSEC3PARAM" should be serialized correctly', () => {
    const rdata = [
        {key: "algorithm", value: 1},
        {key: "flags", value: 0},
        {key: "iterations", value: 12},
        {key: "salt", value: "aabbcc"}
    ];
    const edata = new Uint8Array([
        0x01,                   // Algorithm: 1
        0x00,                   // Flags: 0
        0x00, 0x0C,             // Iterations: 12
        0x03,                   // Salt Length: 3
        0xaa, 0xbb, 0xcc        // Salt: aabbcc
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.NSEC3PARAM.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.NSEC3PARAM.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

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