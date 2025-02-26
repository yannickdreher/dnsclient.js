import * as dnsclient from '../src/dnsclient.js';

describe('Record type "HINFO" should be serialized correct', () => {
    const rdata = [
        {key: "cpu", value: "Intel"},
        {key: "os", value: "Linux"}
    ];
    const edata = new Uint8Array([0x05, 0x49, 0x6E, 0x74, 0x65, 0x6C, 0x05, 0x4C, 0x69, 0x6E, 0x75, 0x78]);
    const buffer = dnsclient.DnsRecordSerializer.HINFO.serialize(rdata);

    test('Expect buffer to be equal', () => {
        expect(buffer).toEqual(edata);
    });

    test('Expect buffer length to be correct', () => {
        expect(buffer.byteLength).toBe(edata.byteLength);
    });
});