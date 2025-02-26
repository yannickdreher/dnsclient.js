import * as dnsclient from '../src/dnsclient.js';

describe('Record type "SRV" should deserialize the data correct', () => {
    const data = new Uint8Array([
        0x00, 0x0A, // Priority = 10
        0x00, 0x05, // Weight = 5
        0x13, 0xC4, // Port = 5060
        0x03, 0x73, 0x69, 0x70, // "sip"
        0x07, 0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, // "example"
        0x03, 0x63, 0x6F, 0x6D, // "com"
        0x00 // Null-Terminator
    ]);
    const view = new DataView(data.buffer);
    const result = dnsclient.DnsRecordSerializer.SRV.deserialize(view, 0);

    test('priority is 10', () => {
        expect(result[0].value).toBe(10);
    });

    test('weight is 5', () => {
        expect(result[1].value).toBe(5);
    });

    test('port is 5060', () => {
        expect(result[2].value).toBe(5060);
    });

    test('target is sip.example.com', () => {
        expect(result[3].value).toBe('sip.example.com');
    });
});