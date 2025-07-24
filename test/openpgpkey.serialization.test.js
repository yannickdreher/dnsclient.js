import * as dnsclient from '../dnsclient.js';

describe('Record type "OPENPGPKEY" should be serialized correctly', () => {
    const rdata = [
        {key: "publickey", value: "VGVzdEtleURhdGE="} // "TestKeyData" in base64
    ];
    const edata = new Uint8Array([
        0x54, 0x65, 0x73, 0x74, 0x4B, 0x65, 0x79, 0x44, 0x61, 0x74, 0x61 // "TestKeyData"
    ]);

    const serialized   = dnsclient.DnsRecordSerializer.OPENPGPKEY.serialize(rdata);
    const deserialized = dnsclient.DnsRecordSerializer.OPENPGPKEY.deserialize(new DataView(serialized.buffer), 0, edata.byteLength);

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