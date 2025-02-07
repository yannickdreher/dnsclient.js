import * as dnsclient from '../src/dnsclient.js';

describe('Record type "AAAA" should return the correct data', () => {
    const data = new Uint8Array([
        0x20, 0x01, 0x0D, 0xB8,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x01 // 2001:db8::1
    ]);
    const view = new DataView(data.buffer);
    const result = dnsclient.DnsSerializer.AAAA.deserialize(view, 0, data.length);

    test('ipv6 is 2001:db8::1', () => {
        expect(result[0].value).toBe('2001:db8::1');
    });
});