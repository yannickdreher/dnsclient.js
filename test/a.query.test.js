import * as dnsclient from '../src/dnsclient.js';

describe('Record type "A" should return the correct data', () => {
    const data = new Uint8Array([
        0xC0, 0x00, 0x02, 0x01 // 192.0.2.1
    ]);
    const view = new DataView(data.buffer);
    const result = dnsclient.DnsSerializer.A.deserialize(view, 0, data.length);

    test('ipv4 is 192.0.2.1', () => {
        expect(result[0].value).toBe('192.0.2.1');
    });
});