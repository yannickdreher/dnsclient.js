import * as dnsclient from '../src/dnsclient.js';

describe('Record type "HINFO" should deserialize the data correct', () => {
    const data = new Uint8Array([0x05, 0x49, 0x6E, 0x74, 0x65, 0x6C, 0x05, 0x4C, 0x69, 0x6E, 0x75, 0x78]);
    const view = new DataView(data.buffer);
    const result = dnsclient.DnsRecordSerializer.HINFO.deserialize(view, 0);

    test('cpu is "Intel"', () => {
        expect(result[0].key).toBe("cpu");
        expect(result[0].value).toBe("Intel");
    });

    test('os is "Linux"', () => {
        expect(result[1].key).toBe("os");
        expect(result[1].value).toBe("Linux");
    });
});