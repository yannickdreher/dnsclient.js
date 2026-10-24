import * as dnsclient from '../dnsclient.js';

function headerOnly(flags) {
    const data = new Uint8Array(12);
    new DataView(data.buffer).setUint16(2, flags, false);
    return data;
}

describe('Header flags include the DNSSEC bits AD and CD', () => {
    test('Expect AD and CD to be decoded', () => {
        const message = dnsclient.DnsSerializer.deserialize(headerOnly(0x8000 | 0x0020 | 0x0010));

        expect(message.flags.ad).toBe(true);
        expect(message.flags.cd).toBe(true);
    });

    test('Expect AD and CD to survive a round-trip', () => {
        const wire = headerOnly(0x8000 | 0x0100 | 0x0080 | 0x0020 | 0x0010);
        const message = dnsclient.DnsSerializer.deserialize(wire);

        expect(dnsclient.DnsSerializer.serialize(message)).toEqual(wire);
    });

    test('Expect a new query to default to AD and CD unset', () => {
        const message = new dnsclient.QueryMessage();

        expect(message.flags.ad).toBe(false);
        expect(message.flags.cd).toBe(false);
    });

    test('Expect CD to be sent when requested', () => {
        const message = new dnsclient.QueryMessage();
        message.flags.cd = true;

        const flags = new DataView(dnsclient.DnsSerializer.serialize(message).buffer).getUint16(2);

        expect(flags & 0x0010).toBe(0x0010);
    });
});

describe('Opcodes sharing the query layout', () => {
    test('Expect a NOTIFY message to be deserialized like a query', () => {
        const message = new dnsclient.QueryMessage();
        message.flags.opcode = dnsclient.OPCODE.NOTIFY;
        message.flags.qr = 1;
        message.questions.push(new dnsclient.Question("example.com", dnsclient.TYPE.SOA, dnsclient.CLAZZ.IN));

        const parsed = dnsclient.DnsSerializer.deserialize(dnsclient.DnsSerializer.serialize(message));

        expect(parsed).toBeInstanceOf(dnsclient.QueryMessage);
        expect(parsed.flags.opcode).toBe(dnsclient.OPCODE.NOTIFY);
        expect(parsed.questions[0].name).toBe("example.com");
    });
});

describe('interpret() is idempotent', () => {
    test('Expect interpreting twice to keep every name', () => {
        const message = new dnsclient.QueryMessage();
        message.flags.qr = 1;
        message.answers.push(new dnsclient.Record("example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN, 60, {ipv4: "192.0.2.1"}));

        const twice = dnsclient.interpret(dnsclient.interpret(message));

        expect(twice.flags).toMatchObject({qr: "RESPONSE", opcode: "QUERY", rcode: "NOERROR"});
        expect(twice.answers[0]).toMatchObject({type: "A", clazz: "IN"});
    });

    test('Expect an rcode without a name to keep its number', () => {
        const message = new dnsclient.QueryMessage();
        message.flags.rcode = 12;

        expect(dnsclient.interpret(message).flags.rcode).toBe(12);
    });
});
