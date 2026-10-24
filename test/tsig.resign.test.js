import { jest, describe, test, expect, afterEach } from '@jest/globals';
import * as dnsclient from '../dnsclient.js';

const SECRET = "RGFzSXN0RWluVGVzdA==";
const TIMESTAMP = 1_700_000_000n;

function makeUpdate() {
    const message = new dnsclient.UpdateMessage();
    message.id = 0x1234;
    message.zones.push(new dnsclient.Zone("example.com"));
    message.updates.push(new dnsclient.Record("host.example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN, 60, {ipv4: "192.0.2.1"}));
    return message;
}

function tsigRecords(message) {
    return message.additionals.filter(record => record.type === dnsclient.TYPE.TSIG);
}

afterEach(() => {
    delete globalThis.fetch;
});

describe('sign() replaces an earlier signature', () => {
    test('Expect signing twice to leave exactly one TSIG record', async () => {
        const message = makeUpdate();

        await dnsclient.sign(message, "key.", SECRET, {timestamp: TIMESTAMP});
        await dnsclient.sign(message, "key.", SECRET, {timestamp: TIMESTAMP});

        expect(tsigRecords(message)).toHaveLength(1);
        expect(message.additionals.at(-1).type).toBe(dnsclient.TYPE.TSIG);
    });

    test('Expect a re-signed message to carry the same MAC as a freshly signed one', async () => {
        const resigned = makeUpdate();
        await dnsclient.sign(resigned, "key.", SECRET, {timestamp: TIMESTAMP});
        await dnsclient.sign(resigned, "key.", SECRET, {timestamp: TIMESTAMP});

        const fresh = makeUpdate();
        await dnsclient.sign(fresh, "key.", SECRET, {timestamp: TIMESTAMP});

        expect(tsigRecords(resigned)[0].data.mac).toEqual(tsigRecords(fresh)[0].data.mac);
    });

    test('Expect an interpreted TSIG record ("TSIG" by name) to be replaced as well', async () => {
        const message = makeUpdate();
        await dnsclient.sign(message, "key.", SECRET, {timestamp: TIMESTAMP});
        message.additionals[0].type = "TSIG";

        await dnsclient.sign(message, "key.", SECRET, {timestamp: TIMESTAMP});

        expect(message.additionals).toHaveLength(1);
    });

    test('Expect sending an UpdateBuilder twice to send one TSIG record each time', async () => {
        const bodies = [];
        globalThis.fetch = jest.fn(async (url, init) => {
            bodies.push(init.body);
            const request = dnsclient.DnsSerializer.deserialize(init.body);
            request.flags.qr = 1;
            request.additionals = [];
            const bytes = dnsclient.DnsSerializer.serialize(request);
            return {ok: true, status: 200, statusText: "OK", arrayBuffer: async () => bytes.buffer};
        });
        const builder = new dnsclient.DnsClient("https://dns.example/dns-query")
            .update("example.com")
            .add("host.example.com", "A", {ipv4: "192.0.2.1"});

        await builder.send({tsig: {name: "key.", secret: SECRET}});
        await builder.send({tsig: {name: "key.", secret: SECRET}});

        for (const body of bodies) {
            const sent = dnsclient.DnsSerializer.deserialize(body);
            expect(tsigRecords(sent)).toHaveLength(1);
        }
    });
});
