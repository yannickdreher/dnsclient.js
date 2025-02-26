import * as dnsclient from '../src/dnsclient.js';

describe('Record type "TSIG" should be serialized correctly', () => {
    const rdata = [
        {key: "algorithm", value: "hmac-sha256"},
        {key: "timestamp", value: 1708780800n},
        {key: "fudge", value: 300},
        {key: "mac", value: new Uint8Array([1, 2, 3, 4, 5, 6])},
        {key: "originalId", value: 12345},
        {key: "error", value: 0},
        {key: "otherData", value: new Uint8Array([])}
    ];

    const edata = new Uint8Array([
        0x0B, 0x68, 0x6D, 0x61, 0x63, 0x2D, // "hmac-"
        0x73, 0x68, 0x61, 0x32, 0x35, 0x36, // "sha256"
        0x00, // Null-Terminierung
        0x00, 0x00, // Zeitstempel (48 Bit = 6 Byte, Beispielwert 1708780800n) High 16 Bit
        0x65, 0xD9, 0xED, 0x00, // Low 32 Bit
        0x01, 0x2C, // Fudge (2 Bytes)
        0x00, 0x06, // MAC Länge (2 Bytes)
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, // MAC (6 Bytes)
        0x30, 0x39, // Original-ID (2 Bytes)
        0x00, 0x00, // Error-Code (2 Bytes)
        0x00, 0x00 // Andere Daten Länge (2 Bytes)
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.TSIG.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.TSIG.deserialize(new DataView(serialized.buffer), 0);
    
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
