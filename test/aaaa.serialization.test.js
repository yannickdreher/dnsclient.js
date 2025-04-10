import * as dnsclient from '../src/dnsclient.js';

describe('Record type "AAAA" should be serialized correctly', () => {
    const rdata  = [{key: "ipv6", value: "2001:db8::1"}];
    const edata  = new Uint8Array([0x20, 0x01, 0x0D, 0xB8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]);
    const view   = new DataView(edata.buffer);

    const serialized = dnsclient.DnsRecordSerializer.AAAA.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.AAAA.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

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