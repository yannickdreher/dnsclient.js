import { jest, describe, test, expect, afterEach } from '@jest/globals';
import * as dnsclient from '../dnsclient.js';

const URL = 'https://dns.example/dns-query';

/**
 * Builds a synthesized DNS-over-HTTPS response for a given request body.
 * Echoes the transaction id and questions, sets QR=1 and adds the supplied
 * answer records.
 */
function buildResponseBuffer(requestBody, answers = [], rcode = 0) {
    const reqView = new DataView(requestBody.buffer, requestBody.byteOffset, requestBody.byteLength);
    const id = reqView.getUint16(0);
    const req = dnsclient.DnsSerializer.deserialize(requestBody.buffer.slice(
        requestBody.byteOffset, requestBody.byteOffset + requestBody.byteLength));

    const resp = new dnsclient.QueryMessage();
    resp.id = id;
    resp.flags.qr = 1;
    resp.flags.rd = true;
    resp.flags.ra = true;
    resp.flags.rcode = rcode;
    resp.questions = req.questions;
    resp.answers = answers;
    return dnsclient.DnsSerializer.serialize(resp);
}

function installFetchMock(handler) {
    const calls = [];
    globalThis.fetch = jest.fn(async (url, init) => {
        const body = new Uint8Array(init.body);
        calls.push({ url, init, body });
        const responseBytes = handler(body);
        return {
            ok: true,
            status: 200,
            statusText: 'OK',
            arrayBuffer: async () => responseBytes.buffer.slice(
                responseBytes.byteOffset,
                responseBytes.byteOffset + responseBytes.byteLength)
        };
    });
    return calls;
}

afterEach(() => {
    delete globalThis.fetch;
});

describe('DnsClient constructor', () => {
    test('throws when serverUrl is missing', () => {
        expect(() => new dnsclient.DnsClient()).toThrow(TypeError);
    });

    test('throws when serverUrl is not a string', () => {
        expect(() => new dnsclient.DnsClient(123)).toThrow(TypeError);
    });

    test('stores serverUrl', () => {
        const c = new dnsclient.DnsClient(URL);
        expect(c.serverUrl).toBe(URL);
    });
});

describe('DnsClient.resolve', () => {
    test('throws when name is missing', async () => {
        const c = new dnsclient.DnsClient(URL);
        await expect(c.resolve()).rejects.toThrow(TypeError);
    });

    test('throws on unknown record type', async () => {
        const c = new dnsclient.DnsClient(URL);
        await expect(c.resolve('example.com', 'BOGUS')).rejects.toThrow(/Unknown DNS record type/);
    });

    test('builds an A query and parses the answer', async () => {
        const calls = installFetchMock(reqBody => {
            const answer = new dnsclient.Record('example.com', dnsclient.TYPE.A, dnsclient.CLAZZ.IN, 300);
            answer.data = { ipv4: '93.184.216.34' };
            return buildResponseBuffer(reqBody, [answer]);
        });

        const c = new dnsclient.DnsClient(URL);
        const res = await c.resolve('example.com', 'A');

        expect(calls).toHaveLength(1);
        expect(calls[0].url).toBe(URL);
        expect(calls[0].init.method).toBe('POST');
        expect(calls[0].init.headers['Content-Type']).toBe('application/dns-message');

        // The serialized request must be a valid DNS query for example.com / A / IN.
        const parsedReq = dnsclient.DnsSerializer.deserialize(calls[0].body.buffer.slice(
            calls[0].body.byteOffset, calls[0].body.byteOffset + calls[0].body.byteLength));
        expect(parsedReq.questions).toHaveLength(1);
        expect(parsedReq.questions[0].name).toBe('example.com');
        expect(parsedReq.questions[0].type).toBe(dnsclient.TYPE.A);
        expect(parsedReq.questions[0].clazz).toBe(dnsclient.CLAZZ.IN);

        // The high-level response object uses friendly names.
        expect(res.rcode).toBe('NOERROR');
        expect(res.question).toEqual({ name: 'example.com', type: 'A', class: 'IN' });
        expect(res.answers).toHaveLength(1);
        expect(res.answers[0]).toEqual({
            name: 'example.com',
            type: 'A',
            class: 'IN',
            ttl: 300,
            data: { ipv4: '93.184.216.34' }
        });
        expect(typeof res.latency).toBe('number');
    });

    test('accepts numeric record types', async () => {
        installFetchMock(reqBody => buildResponseBuffer(reqBody, []));
        const c = new dnsclient.DnsClient(URL);
        const res = await c.resolve('example.com', dnsclient.TYPE.AAAA);
        expect(res.question.type).toBe('AAAA');
    });

    test('propagates non-NOERROR rcodes', async () => {
        installFetchMock(reqBody => buildResponseBuffer(reqBody, [], 3 /* NXDOMAIN */));
        const c = new dnsclient.DnsClient(URL);
        const res = await c.resolve('does-not-exist.example', 'A');
        expect(res.rcode).toBe('NXDOMAIN');
        expect(res.answers).toEqual([]);
    });

    test('throws when fetch returns a non-OK response', async () => {
        globalThis.fetch = jest.fn(async () => ({
            ok: false, status: 500, statusText: 'Server Error'
        }));
        const c = new dnsclient.DnsClient(URL);
        await expect(c.resolve('example.com', 'A')).rejects.toThrow(/500/);
    });
});

describe('DnsClient.reverse', () => {
    test('builds the correct in-addr.arpa name for IPv4', async () => {
        const calls = installFetchMock(reqBody => buildResponseBuffer(reqBody, []));
        const c = new dnsclient.DnsClient(URL);
        await c.reverse('192.0.2.42');

        const parsedReq = dnsclient.DnsSerializer.deserialize(calls[0].body.buffer.slice(
            calls[0].body.byteOffset, calls[0].body.byteOffset + calls[0].body.byteLength));
        expect(parsedReq.questions[0].name).toBe('42.2.0.192.in-addr.arpa');
        expect(parsedReq.questions[0].type).toBe(dnsclient.TYPE.PTR);
    });

    test('builds the correct ip6.arpa name for IPv6', async () => {
        const calls = installFetchMock(reqBody => buildResponseBuffer(reqBody, []));
        const c = new dnsclient.DnsClient(URL);
        await c.reverse('2001:db8::1');

        const parsedReq = dnsclient.DnsSerializer.deserialize(calls[0].body.buffer.slice(
            calls[0].body.byteOffset, calls[0].body.byteOffset + calls[0].body.byteLength));
        const expected =
            '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa';
        expect(parsedReq.questions[0].name).toBe(expected);
        expect(parsedReq.questions[0].type).toBe(dnsclient.TYPE.PTR);
    });

    test('throws for an invalid IPv4 address', async () => {
        const c = new dnsclient.DnsClient(URL);
        await expect(c.reverse('300.1.2.3')).rejects.toThrow(/Invalid IPv4/);
    });
});

describe('UpdateBuilder', () => {
    test('constructor rejects missing zone', () => {
        const c = new dnsclient.DnsClient(URL);
        expect(() => c.update()).toThrow(TypeError);
        expect(() => c.update('')).toThrow(TypeError);
    });

    test('add() appends a record with the supplied data and TTL', () => {
        const c = new dnsclient.DnsClient(URL);
        const b = c.update('example.com')
            .add('host.example.com', 'A', { ipv4: '1.2.3.4' }, 600);
        const msg = b.toMessage();

        expect(msg).toBeInstanceOf(dnsclient.UpdateMessage);
        expect(msg.zones).toHaveLength(1);
        expect(msg.zones[0].name).toBe('example.com');
        expect(msg.updates).toHaveLength(1);
        expect(msg.updates[0].name).toBe('host.example.com');
        expect(msg.updates[0].type).toBe(dnsclient.TYPE.A);
        expect(msg.updates[0].clazz).toBe(dnsclient.CLAZZ.IN);
        expect(msg.updates[0].ttl).toBe(600);
        expect(msg.updates[0].data).toEqual({ ipv4: '1.2.3.4' });
    });

    test('delete(name) removes all RRsets at a name (CLASS=ANY, TYPE=ANY)', () => {
        const msg = new dnsclient.DnsClient(URL).update('example.com')
            .delete('host.example.com').toMessage();
        expect(msg.updates[0].clazz).toBe(dnsclient.CLAZZ.ANY);
        expect(msg.updates[0].type).toBe(dnsclient.TYPE.ANY);
        expect(msg.updates[0].ttl).toBe(0);
        expect(msg.updates[0].data).toEqual([]);
    });

    test('delete(name, type) removes a single RRset (CLASS=ANY)', () => {
        const msg = new dnsclient.DnsClient(URL).update('example.com')
            .delete('host.example.com', 'A').toMessage();
        expect(msg.updates[0].clazz).toBe(dnsclient.CLAZZ.ANY);
        expect(msg.updates[0].type).toBe(dnsclient.TYPE.A);
        expect(msg.updates[0].data).toEqual([]);
    });

    test('delete(name, type, data) removes a specific RR (CLASS=NONE)', () => {
        const msg = new dnsclient.DnsClient(URL).update('example.com')
            .delete('host.example.com', 'A', { ipv4: '1.2.3.4' }).toMessage();
        expect(msg.updates[0].clazz).toBe(dnsclient.CLAZZ.NONE);
        expect(msg.updates[0].type).toBe(dnsclient.TYPE.A);
        expect(msg.updates[0].data).toEqual({ ipv4: '1.2.3.4' });
    });

    test('replace() emits a delete-RRset followed by an add', () => {
        const msg = new dnsclient.DnsClient(URL).update('example.com')
            .replace('host.example.com', 'A', { ipv4: '5.6.7.8' }, 60).toMessage();
        expect(msg.updates).toHaveLength(2);
        expect(msg.updates[0].clazz).toBe(dnsclient.CLAZZ.ANY);  // delete RRset
        expect(msg.updates[1].clazz).toBe(dnsclient.CLAZZ.IN);   // add
        expect(msg.updates[1].ttl).toBe(60);
        expect(msg.updates[1].data).toEqual({ ipv4: '5.6.7.8' });
    });

    test('requirePresent(name) -> CLASS=ANY, TYPE=ANY, empty rdata', () => {
        const msg = new dnsclient.DnsClient(URL).update('example.com')
            .requirePresent('host.example.com').toMessage();
        expect(msg.prerequisites[0].clazz).toBe(dnsclient.CLAZZ.ANY);
        expect(msg.prerequisites[0].type).toBe(dnsclient.TYPE.ANY);
        expect(msg.prerequisites[0].data).toEqual([]);
    });

    test('requirePresent(name, type) -> CLASS=ANY, given type', () => {
        const msg = new dnsclient.DnsClient(URL).update('example.com')
            .requirePresent('host.example.com', 'A').toMessage();
        expect(msg.prerequisites[0].clazz).toBe(dnsclient.CLAZZ.ANY);
        expect(msg.prerequisites[0].type).toBe(dnsclient.TYPE.A);
    });

    test('requireAbsent(name) -> CLASS=NONE, TYPE=ANY, empty rdata', () => {
        const msg = new dnsclient.DnsClient(URL).update('example.com')
            .requireAbsent('host.example.com').toMessage();
        expect(msg.prerequisites[0].clazz).toBe(dnsclient.CLAZZ.NONE);
        expect(msg.prerequisites[0].type).toBe(dnsclient.TYPE.ANY);
    });

    test('send() POSTs the serialized UPDATE and returns formatted result', async () => {
        const calls = installFetchMock(reqBody => {
            // Echo the request as a response (NOERROR by default).
            const req = dnsclient.DnsSerializer.deserialize(reqBody.buffer.slice(
                reqBody.byteOffset, reqBody.byteOffset + reqBody.byteLength));
            req.flags.qr = 1;
            return dnsclient.DnsSerializer.serialize(req);
        });

        const c = new dnsclient.DnsClient(URL);
        const { result, latency } = await c.update('example.com')
            .add('host.example.com', 'A', { ipv4: '1.2.3.4' }, 60)
            .send();

        expect(calls).toHaveLength(1);
        // Verify the body is a valid UPDATE message.
        const parsed = dnsclient.DnsSerializer.deserialize(calls[0].body.buffer.slice(
            calls[0].body.byteOffset, calls[0].body.byteOffset + calls[0].body.byteLength));
        expect(parsed).toBeInstanceOf(dnsclient.UpdateMessage);
        expect(parsed.zones[0].name).toBe('example.com');
        expect(parsed.updates[0].name).toBe('host.example.com');
        expect(parsed.updates[0].type).toBe(dnsclient.TYPE.A);

        expect(result.rcode).toBe('NOERROR');
        expect(result.zones[0]).toEqual({ name: 'example.com', type: 'SOA', class: 'IN' });
        expect(result.updates[0].data).toEqual({ ipv4: '1.2.3.4' });
        expect(typeof latency).toBe('number');
    });
});
