import * as dnsclient from '../dnsclient.js';

describe('Record type "DHCID" should be serialized correctly', () => {
    const rdata = [
        {key: "digest", value: "VGVzdERpZ2VzdA=="} // "TestDigest" in base64
    ];
    const edata = new Uint8Array([
        0x54, 0x65, 0x73, 0x74, 0x44, 0x69, 0x67, 0x65, 0x73, 0x74 // "TestDigest"
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.DHCID.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.DHCID.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

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