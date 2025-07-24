import * as dnsclient from '../dnsclient.js';

describe('Message should be serialized correctly', () => {
    const message    = new dnsclient.QueryMessage();
    message.id       = 1234;
    message.flags.rd = 1; // Recursion

    const question = new dnsclient.Question("example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN);
    const record   = new dnsclient.Record();
    record.name    = "example.com";
    record.type    = dnsclient.TYPE.A;
    record.clazz   = dnsclient.CLAZZ.IN;
    record.ttl     = 8600;
    record.data    = [{key: "ipv4", value: "192.0.2.1"}];

    message.questions.push(question);
    message.answers.push(record);
    message.authorities.push(record);
    message.additionals.push(record);

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
        0x00, 0x00, 0x21, 0x98,  // TTL 8600
        0x00, 0x04,              // Data Length
        0xC0, 0x00, 0x02, 0x01,  // 192.0.2.1
        //authorities
        0x07, 0x65, 0x78, 0x61,  // "example"
        0x6D, 0x70, 0x6C, 0x65,  
        0x03, 0x63, 0x6F, 0x6D,  // "com"
        0x00,                    // Nullterminierung der Domain
        0x00, 0x01,              // Typ A (IPv4-Adresse)
        0x00, 0x01,              // Klasse IN (Internet)
        0x00, 0x00, 0x21, 0x98,  // TTL 8600
        0x00, 0x04,              // Data Length
        0xC0, 0x00, 0x02, 0x01,  // 192.0.2.1
        //additionals
        0x07, 0x65, 0x78, 0x61,  // "example"
        0x6D, 0x70, 0x6C, 0x65,  
        0x03, 0x63, 0x6F, 0x6D,  // "com"
        0x00,                    // Nullterminierung der Domain
        0x00, 0x01,              // Typ A (IPv4-Adresse)
        0x00, 0x01,              // Klasse IN (Internet)
        0x00, 0x00, 0x21, 0x98,  // TTL 8600
        0x00, 0x04,              // Data Length
        0xC0, 0x00, 0x02, 0x01,  // 192.0.2.1
    ]);

    const serialized   = dnsclient.DnsSerializer.serialize(message);

    test('Expect buffer to be equal', () => {
        expect(serialized).toEqual(edata);
    });

    test('Expect buffer length to be correct', () => {
        expect(serialized.byteLength).toBe(edata.byteLength);
    });
});