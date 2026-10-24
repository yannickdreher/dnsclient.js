import * as dnsclient from '../dnsclient.js';

const {TYPE, CLAZZ} = dnsclient;

/**
 * Serializes a response with one answer and lets the caller patch its RDLENGTH.
 * Returns the message bytes and the offset of the RDLENGTH field.
 */
function answerMessage(record) {
    const message = new dnsclient.QueryMessage();
    message.flags.qr = 1;
    message.answers.push(record);
    const wire = dnsclient.DnsSerializer.serialize(message, {compress: false});
    const nameLength = dnsclient.DnsNameSerializer.serialize(record.name).byteLength;
    return {wire, rdlength: 12 + nameLength + 8};
}

describe('Record data is confined to its RDLENGTH', () => {
    test('Expect an MX whose RDLENGTH cuts the exchange short not to read the following bytes', () => {
        const {wire, rdlength} = answerMessage(
            new dnsclient.Record("a", TYPE.MX, CLAZZ.IN, 60, {preference: 10, exchange: "mail.example"})
        );
        new DataView(wire.buffer).setUint16(rdlength, 2);

        expect(() => dnsclient.DnsSerializer.deserialize(wire)).toThrow();
    });

    test('Expect trailing bytes after an NS name to be rejected', () => {
        const record = new dnsclient.Record("a", TYPE.NS, CLAZZ.IN, 60, {name: "ns.example"});
        const {wire, rdlength} = answerMessage(record);
        const padded = new Uint8Array(wire.byteLength + 2);
        padded.set(wire);
        const view = new DataView(padded.buffer);
        view.setUint16(rdlength, view.getUint16(rdlength) + 2);

        expect(() => dnsclient.DnsSerializer.deserialize(padded))
            .toThrow(/Record data is 14 bytes long, but its fields take 12/);
    });

    test('Expect a SOA with a short RDLENGTH to be rejected', () => {
        const {wire, rdlength} = answerMessage(new dnsclient.Record("a", TYPE.SOA, CLAZZ.IN, 60, {
            mname: "ns.example", rname: "admin.example", serial: 1, refresh: 2, retry: 3, expire: 4, minimum: 5
        }));
        const view = new DataView(wire.buffer);
        view.setUint16(rdlength, view.getUint16(rdlength) - 4);

        expect(() => dnsclient.DnsSerializer.deserialize(wire.subarray(0, wire.byteLength - 4))).toThrow();
    });

    test('Expect a compression pointer to an earlier name to still resolve', () => {
        const message = new dnsclient.QueryMessage();
        message.flags.qr = 1;
        message.questions.push(new dnsclient.Question("example.com", TYPE.MX, CLAZZ.IN));
        message.answers.push(new dnsclient.Record("example.com", TYPE.MX, CLAZZ.IN, 60, {preference: 10, exchange: "example.com"}));

        const parsed = dnsclient.DnsSerializer.deserialize(dnsclient.DnsSerializer.serialize(message));

        expect(parsed.answers[0].data).toEqual({preference: 10, exchange: "example.com"});
    });

    test('Expect an RDLENGTH beyond the message to be reported', () => {
        const {wire, rdlength} = answerMessage(new dnsclient.Record("a", TYPE.A, CLAZZ.IN, 60, {ipv4: "192.0.2.1"}));
        new DataView(wire.buffer).setUint16(rdlength, 40);

        expect(() => dnsclient.DnsSerializer.deserialize(wire)).toThrow(/exceeds the available/);
    });
});

describe('SVCB and HTTPS reject truncated SvcParams', () => {
    test.each(["SVCB", "HTTPS"])('Expect a truncated %s parameter value to throw', (type) => {
        const bytes = dnsclient.DnsRecordSerializer[type].serialize({priority: 1, target: ".", params: {1: "026832"}});
        const view = new DataView(bytes.buffer);

        expect(() => dnsclient.DnsRecordSerializer[type].deserialize(view, 0, bytes.byteLength - 1))
            .toThrow(/Truncated value of SvcParam 1/);
    });

    test.each(["SVCB", "HTTPS"])('Expect a truncated %s parameter header to throw', (type) => {
        const bytes = dnsclient.DnsRecordSerializer[type].serialize({priority: 1, target: ".", params: {1: ""}});
        const view = new DataView(bytes.buffer);

        expect(() => dnsclient.DnsRecordSerializer[type].deserialize(view, 0, bytes.byteLength - 2))
            .toThrow(/Truncated SvcParam header/);
    });
});

describe('Character-strings are limited to 255 bytes', () => {
    const long = "x".repeat(256);

    test.each([
        ["HINFO", {cpu: long, os: "y"}, /HINFO cpu is 256 bytes long/],
        ["HINFO", {cpu: "x", os: long}, /HINFO os is 256 bytes long/],
        ["NAPTR", {order: 1, preference: 1, flags: long, services: "", regexp: "", replacement: "."}, /NAPTR flags/],
        ["NAPTR", {order: 1, preference: 1, flags: "", services: long, regexp: "", replacement: "."}, /NAPTR services/],
        ["NAPTR", {order: 1, preference: 1, flags: "", services: "", regexp: long, replacement: "."}, /NAPTR regexp/],
        ["CAA", {flags: 0, tag: long, value: "v"}, /CAA tag/]
    ])('Expect an over-long %s field to be rejected instead of corrupting the wire', (type, rdata, error) => {
        expect(() => dnsclient.DnsRecordSerializer[type].serialize(rdata)).toThrow(error);
    });

    test('Expect a 255 byte HINFO cpu to round-trip', () => {
        const rdata = {cpu: "x".repeat(255), os: "y"};
        const bytes = dnsclient.DnsRecordSerializer.HINFO.serialize(rdata);

        expect(dnsclient.DnsRecordSerializer.HINFO.deserialize(new DataView(bytes.buffer), 0, bytes.byteLength))
            .toEqual(rdata);
    });
});
