import * as dnsclient from '../src/dnsclient.js';

describe('Message should be serialized correctly', () => {
    let message = {
        id: 1234,
        flags: {
            qr: 0,
            opcode: dnsclient.OPCODE.UPDATE,
            aa: 0,
            tc: 0,
            rd: 0,
            ra: 0,
            rcode: 0
        },
        zone: {
            name: "example.com",
            type: dnsclient.TYPE.SOA,
            clazz: dnsclient.CLAZZ.IN
        },
        prerequisites: [
            {
                name: "test.example.com",
                type: dnsclient.TYPE.A,
                clazz: dnsclient.CLAZZ.ANY,
                ttl: 0
            }
        ],
        updates: [
            {
                name: "test.example.com",
                type: dnsclient.TYPE.A,
                clazz: dnsclient.CLAZZ.ANY,
                ttl: 0
            },
            {
                name: "test.example.com",
                type: dnsclient.TYPE.A,
                clazz: dnsclient.CLAZZ.IN,
                ttl: 8600,
                data: [{key: "ipv4", value: "192.0.2.1"}]
            }
        ],
        additionals: []
    };

    const edata = new Uint8Array([
        0x04, 0xD2, 0x01, 0x00,  // Header
        0x00, 0x01, 0x00, 0x01,  // Fragen / Antworten
        0x00, 0x01, 0x00, 0x01,  // Autorität / Zusatz
        //questions
        0x07, 0x65, 0x78, 0x61,  // "example"
        0x6D, 0x70, 0x6C, 0x65,  
        0x03, 0x63, 0x6F, 0x6D,  // "com"
        0x00,                    // Nullterminierung der Domain
        0x00, 0x01,              // Typ A (IPv4-Adresse)
        0x00, 0x01,              // Klasse IN (Internet)
        //answer
        0x07, 0x65, 0x78, 0x61,  // "example"
        0x6D, 0x70, 0x6C, 0x65,  
        0x03, 0x63, 0x6F, 0x6D,  // "com"
        0x00,                    // Nullterminierung der Domain
        0x00, 0x01,              // Typ A (IPv4-Adresse)
        0x00, 0x01,              // Klasse IN (Internet)
        0x21, 0x98,              // TTL 8600
        0x00, 0x04,              // Data Length
        0xC0, 0x00, 0x02, 0x01,  // 192.0.2.1
        //authorities
        0x07, 0x65, 0x78, 0x61,  // "example"
        0x6D, 0x70, 0x6C, 0x65,  
        0x03, 0x63, 0x6F, 0x6D,  // "com"
        0x00,                    // Nullterminierung der Domain
        0x00, 0x01,              // Typ A (IPv4-Adresse)
        0x00, 0x01,              // Klasse IN (Internet)
        0x21, 0x98,              // TTL 8600
        0x00, 0x04,              // Data Length
        0xC0, 0x00, 0x02, 0x01,  // 192.0.2.1
        //additionals
        0x07, 0x65, 0x78, 0x61,  // "example"
        0x6D, 0x70, 0x6C, 0x65,  
        0x03, 0x63, 0x6F, 0x6D,  // "com"
        0x00,                    // Nullterminierung der Domain
        0x00, 0x01,              // Typ A (IPv4-Adresse)
        0x00, 0x01,              // Klasse IN (Internet)
        0x21, 0x98,              // TTL 8600
        0x00, 0x04,              // Data Length
        0xC0, 0x00, 0x02, 0x01,  // 192.0.2.1
    ]);
    
    beforeAll(async () => {
        message = await dnsclient.sign(message, "test", "RGFzSXN0RWluVGVzdA==");
        console.dir(message, {depth: null});
    });

    const serialized = dnsclient.DnsSerializer.serialize(message);
    console.log(serialized);

    test('Expect buffer to be equal', () => {
        expect(serialized).toEqual(edata);
    });

    test('Expect buffer length to be correct', () => {
        expect(serialized.byteLength).toBe(edata.byteLength);
    });
});