import * as dnsclient from '../dnsclient.js';

const {TYPE, CLAZZ} = dnsclient;

function responseFor(name, answers) {
    const message = new dnsclient.QueryMessage();
    message.flags.qr = 1;
    message.questions.push(new dnsclient.Question(name, TYPE.A, CLAZZ.IN));
    message.answers.push(...answers);
    return message;
}

describe('DnsSerializer.serialize() compresses repeated names', () => {
    test('Expect an answer owner equal to the question name to become a pointer to offset 12', () => {
        const message = responseFor("example.com", [
            new dnsclient.Record("example.com", TYPE.A, CLAZZ.IN, 60, {ipv4: "192.0.2.1"})
        ]);

        const wire = dnsclient.DnsSerializer.serialize(message);
        // Header (12) + question name (13) + type/class (4): the answer starts at 29.
        expect(Array.from(wire.subarray(29, 31))).toEqual([0xc0, 0x0c]);
        expect(wire.byteLength).toBe(dnsclient.DnsSerializer.serialize(message, {compress: false}).byteLength - 11);
    });

    test('Expect a shared suffix to be compressed after the differing labels', () => {
        const message = responseFor("example.com", [
            new dnsclient.Record("www.example.com", TYPE.A, CLAZZ.IN, 60, {ipv4: "192.0.2.1"})
        ]);

        const wire = dnsclient.DnsSerializer.serialize(message);
        expect(Array.from(wire.subarray(29, 35))).toEqual([3, 0x77, 0x77, 0x77, 0xc0, 0x0c]);
    });

    test('Expect names inside well-known rdata (MX, CNAME, SOA) to be compressed', () => {
        const records = [
            new dnsclient.Record("example.com", TYPE.MX, CLAZZ.IN, 60, {preference: 10, exchange: "mail.example.com"}),
            new dnsclient.Record("example.com", TYPE.CNAME, CLAZZ.IN, 60, {name: "example.com"}),
            new dnsclient.Record("example.com", TYPE.SOA, CLAZZ.IN, 60, {
                mname: "ns.example.com", rname: "hostmaster.example.com",
                serial: 1, refresh: 2, retry: 3, expire: 4, minimum: 5
            })
        ];
        const message = responseFor("example.com", records);

        const compressed = dnsclient.DnsSerializer.serialize(message);
        const plain = dnsclient.DnsSerializer.serialize(message, {compress: false});
        expect(compressed.byteLength).toBeLessThan(plain.byteLength);

        const parsed = dnsclient.DnsSerializer.deserialize(compressed);
        expect(parsed.answers.map(record => record.data)).toEqual(records.map(record => record.data));
    });

    test.each([
        ["SRV", {priority: 1, weight: 2, port: 443, target: "example.com"}],
        ["RRSIG", {typeCovered: "A", algorithm: 13, labels: 2, originalTtl: 60, expiration: new Date("2030-01-01T00:00:00Z"), inception: new Date("2029-01-01T00:00:00Z"), keyTag: 1, signersName: "example.com", signature: "AAAA"}],
        ["NSEC", {nextDomain: "example.com", typeBitmaps: ["A"]}],
        ["DNAME", {name: "example.com"}]
    ])('Expect names in %s rdata to stay uncompressed (RFC 3597 §4)', (type, data) => {
        const record = new dnsclient.Record("a.example.com", TYPE[type], CLAZZ.IN, 60, data);
        const message = responseFor("example.com", [record]);

        const wire = dnsclient.DnsSerializer.serialize(message);
        const rdata = dnsclient.DnsRecordSerializer.serializeRData(record);

        // The rdata is the tail of the message and must equal its plain encoding.
        expect(Array.from(wire.subarray(wire.byteLength - rdata.byteLength))).toEqual(Array.from(rdata));
    });

    test('Expect names differing only in case to stay separate, preserving the case on the wire', () => {
        const message = responseFor("example.com", [
            new dnsclient.Record("EXAMPLE.com", TYPE.A, CLAZZ.IN, 60, {ipv4: "192.0.2.1"})
        ]);

        const parsed = dnsclient.DnsSerializer.deserialize(dnsclient.DnsSerializer.serialize(message));

        expect(parsed.answers[0].name).toBe("EXAMPLE.com");
    });

    test('Expect estimateMessageSize() to match the compressed length', () => {
        const message = responseFor("example.com", [
            new dnsclient.Record("example.com", TYPE.A, CLAZZ.IN, 60, {ipv4: "192.0.2.1"}),
            new dnsclient.Record("example.com", TYPE.A, CLAZZ.IN, 60, {ipv4: "192.0.2.2"})
        ]);

        expect(dnsclient.DnsSerializer.estimateMessageSize(message))
            .toBe(dnsclient.DnsSerializer.serialize(message).byteLength);
    });

    test('Expect the TSIG-signed prefix to be byte-identical to what was signed', async () => {
        const message = new dnsclient.UpdateMessage();
        message.zones.push(new dnsclient.Zone("example.com"));
        message.updates.push(new dnsclient.Record("host.example.com", TYPE.A, CLAZZ.IN, 60, {ipv4: "192.0.2.1"}));
        const unsigned = dnsclient.DnsSerializer.serialize(message);

        await dnsclient.sign(message, "key.example.com", "c2VjcmV0");
        const signed = dnsclient.DnsSerializer.serialize(message);

        // Only ARCOUNT (bytes 10-11) differs; the records before the TSIG record
        // must compress exactly as they did when the MAC was computed.
        const prefix = signed.slice(0, unsigned.byteLength);
        prefix.set(unsigned.subarray(10, 12), 10);
        expect(prefix).toEqual(unsigned);
    });
});
