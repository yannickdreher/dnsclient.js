import * as dnsclient from '../dnsclient.js';

describe('Record type "HINFO" should be serialized correctly', () => {
    const rdata = [
        {key: "cpu", value: "Intel"},
        {key: "os", value: "Linux"}
    ];
    const edata = new Uint8Array([0x05, 0x49, 0x6E, 0x74, 0x65, 0x6C, 0x05, 0x4C, 0x69, 0x6E, 0x75, 0x78]);
    
    const serialized   = dnsclient.DnsRecordSerializer.HINFO.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.HINFO.deserialize(new DataView(serialized.buffer), 0);

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