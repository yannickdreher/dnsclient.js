import * as dnsclient from '../src/dnsclient.js';

describe('Record type "AAAA" should be serialized correct', () => {
    const rdata  = [{key: "ipv6", value: "2001:db8::1"}];
    const edata  = new Uint8Array([0x20, 0x01, 0x0D, 0xB8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]);
    const buffer = dnsclient.DnsRecordSerializer.AAAA.serialize(rdata);

    test('Expect buffer to be equal', () => {
        expect(buffer).toEqual(edata);
    });

    test('Expect buffer length to be correct', () => {
        expect(buffer.byteLength).toBe(16);
    });
});