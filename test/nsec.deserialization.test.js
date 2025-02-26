import * as dnsclient from '../src/dnsclient.js';

describe('Reecord type "NSEC" should deserialize the data correct', () => {
    const data = new Uint8Array([
        0x07, 0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, // "example"
        0x03, 0x6E, 0x65, 0x74, 0x00, // "net" + NULL byte for the domain name end
        0x00, 0x02, // 2 Bytes length for Type Bit Map
        0x01, 0x01, // Type Bit Map: A (0x01) and MX (0x02)
    ]);
    const view = new DataView(data.buffer);
    const result = dnsclient.DnsRecordSerializer.NSEC.deserialize(view, 0, data.length);

    test('nextDomain is example.net', () => {
        expect(result[0].value).toBe('example.net');
    });

    test('typeBitmap 1 is MB', () => {
        expect(result[1].value[0]).toBe('MB');
    });

    test('typeBitmap 2 is MX', () => {
        expect(result[1].value[1]).toBe('MX');
    });
});