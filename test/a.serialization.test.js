import * as dnsclient from '../src/dnsclient.js';

describe('Record type "A" should be serialized correct', () => {
    const rdata  = [{key: "ipv4", value: "192.0.2.1"}];
    const edata  = new Uint8Array([0xC0, 0x00, 0x02, 0x01]);
    const buffer = dnsclient.DnsRecordSerializer.A.serialize(rdata);

    test('Expect buffer to be equal', () => {
        expect(buffer).toEqual(edata);
    });

    test('Expect buffer length to be correct', () => {
        expect(buffer.byteLength).toBe(4);
    });
});