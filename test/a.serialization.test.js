import * as dnsclient from '../src/dnsclient.js';

describe('Record type "A" should be serialized correctly', () => {
    const rdata  = [{key: "ipv4", value: "192.0.2.1"}];
    const edata  = new Uint8Array([0xC0, 0x00, 0x02, 0x01]);

    const serialized   = dnsclient.DnsRecordSerializer.A.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.A.deserialize(new DataView(edata.buffer), 0, edata.byteLength);

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