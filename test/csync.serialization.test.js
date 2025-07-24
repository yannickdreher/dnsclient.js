import * as dnsclient from '../dnsclient.js';

describe('Record type "CSYNC" should be serialized correctly', () => {
    const rdata = [
        {key: "serial", value: 12345},
        {key: "flags", value: 1},
        {key: "typeBitmaps", value: []}
    ];
    const edata = new Uint8Array([
        0x00, 0x00, 0x30, 0x39, // Serial: 12345
        0x00, 0x01              // Flags: 1
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.CSYNC.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.CSYNC.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

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