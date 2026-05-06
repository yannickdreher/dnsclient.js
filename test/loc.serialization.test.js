import * as dnsclient from '../dnsclient.js';

describe('Record type "LOC" should be serialized correctly', () => {
    const rdata = { version: 0, size: 18, horizPre: 22, vertPre: 20, latitude: 2147483648, longitude: 2147483648, altitude: 10000000 };
    const edata = new Uint8Array([
        0x00,                   // Version: 0
        0x12,                   // Size: 18
        0x16,                   // Horizontal Precision: 22
        0x14,                   // Vertical Precision: 20
        0x80, 0x00, 0x00, 0x00, // Latitude: 2147483648
        0x80, 0x00, 0x00, 0x00, // Longitude: 2147483648
        0x00, 0x98, 0x96, 0x80  // Altitude: 10000000
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.LOC.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.LOC.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

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