import * as dnsclient from '../dnsclient.js';

const URL = "https://dns.example.com/dns-query";

/**
 * Builds a minimal DNS response for "example.com A 192.0.2.1".
 */
function responseBytes(id = 1234) {
    const message = new dnsclient.QueryMessage();
    message.id = id;
    message.flags.qr = 1;
    message.flags.ra = true;
    message.questions.push(new dnsclient.Question("example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN));
    message.answers.push(new dnsclient.Record(
        "example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN, 300, {ipv4: "192.0.2.1"}
    ));
    return dnsclient.DnsSerializer.serialize(message);
}

function queryMessage() {
    const message = new dnsclient.QueryMessage();
    message.id = 1234;
    message.questions.push(new dnsclient.Question("example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN));
    return message;
}

describe('query() sends and parses a DNS-over-HTTPS exchange', () => {
    let calls;

    beforeEach(() => {
        calls = [];
        global.fetch = async (url, init) => {
            calls.push({url, init});
            return {
                ok: true,
                status: 200,
                statusText: "OK",
                arrayBuffer: async () => responseBytes().buffer
            };
        };
    });

    afterEach(() => {
        delete global.fetch;
    });

    test('Expect the request to be a POST with the DNS wire content type', async () => {
        await dnsclient.query(URL, queryMessage());

        expect(calls).toHaveLength(1);
        expect(calls[0].url).toBe(URL);
        expect(calls[0].init.method).toBe("POST");
        expect(calls[0].init.headers["Content-Type"]).toBe("application/dns-message");
        expect(calls[0].init.headers["Accept"]).toBe("application/dns-message");
        expect(calls[0].init.body).toBeInstanceOf(Uint8Array);
    });

    test('Expect the response to be deserialized with a latency', async () => {
        const {result, latency} = await dnsclient.query(URL, queryMessage());

        expect(result.id).toBe(1234);
        expect(result.answers[0].data.ipv4).toBe("192.0.2.1");
        expect(typeof latency).toBe("number");
        expect(latency).toBeGreaterThanOrEqual(0);
    });

    test('Expect a boolean third argument to still request interpretation', async () => {
        const {result} = await dnsclient.query(URL, queryMessage(), true);

        expect(result.answers[0].type).toBe("A");
        expect(result.answers[0].clazz).toBe("IN");
        expect(result.flags.rcode).toBe("NOERROR");
    });

    test('Expect an options object to request interpretation', async () => {
        const {result} = await dnsclient.query(URL, queryMessage(), {interpreted: true});

        expect(result.answers[0].type).toBe("A");
    });

    test('Expect extra headers to be merged into the request', async () => {
        await dnsclient.query(URL, queryMessage(), {headers: {"X-Trace": "abc"}});

        expect(calls[0].init.headers["X-Trace"]).toBe("abc");
        expect(calls[0].init.headers["Content-Type"]).toBe("application/dns-message");
    });

    test('Expect a failing status to be reported', async () => {
        global.fetch = async () => ({ok: false, status: 502, statusText: "Bad Gateway"});

        await expect(dnsclient.query(URL, queryMessage()))
            .rejects.toThrow(/failed with status: 502 - Bad Gateway/);
    });
});

describe('query() supports cancellation', () => {
    afterEach(() => {
        delete global.fetch;
    });

    test('Expect a timeout to abort the request', async () => {
        global.fetch = (url, init) => new Promise((resolve, reject) => {
            init.signal.addEventListener("abort", () => reject(init.signal.reason), {once: true});
        });

        await expect(dnsclient.query(URL, queryMessage(), {timeout: 20}))
            .rejects.toThrow(/timed out after 20 ms/);
    });

    test('Expect an external signal to abort the request', async () => {
        global.fetch = (url, init) => new Promise((resolve, reject) => {
            init.signal.addEventListener("abort", () => reject(new Error("aborted")), {once: true});
        });

        const controller = new AbortController();
        const pending = dnsclient.query(URL, queryMessage(), {signal: controller.signal});
        controller.abort();

        await expect(pending).rejects.toThrow(/aborted/);
    });

    test('Expect an already aborted signal to abort immediately', async () => {
        global.fetch = (url, init) => {
            expect(init.signal.aborted).toBe(true);
            return Promise.reject(new Error("aborted"));
        };

        await expect(dnsclient.query(URL, queryMessage(), {signal: AbortSignal.abort()}))
            .rejects.toThrow(/aborted/);
    });

    test('Expect the timeout to be cleared once the request completed', async () => {
        let captured;
        global.fetch = async (url, init) => {
            captured = init.signal;
            return {
                ok: true,
                status: 200,
                statusText: "OK",
                arrayBuffer: async () => responseBytes().buffer
            };
        };

        const {result} = await dnsclient.query(URL, queryMessage(), {timeout: 5});
        // Without clearTimeout the pending timer would still fire and abort here.
        await new Promise(resolve => setTimeout(resolve, 40));

        expect(result.id).toBe(1234);
        expect(captured.aborted).toBe(false);
    });
});

describe('interpret() renders numeric values as names', () => {
    test('Expect types, classes and header fields to be named', () => {
        const message = dnsclient.DnsSerializer.deserialize(responseBytes().buffer);
        const interpreted = dnsclient.interpret(message);

        expect(interpreted.flags.qr).toBe("RESPONSE");
        expect(interpreted.flags.opcode).toBe("QUERY");
        expect(interpreted.flags.rcode).toBe("NOERROR");
        expect(interpreted.questions[0].type).toBe("A");
        expect(interpreted.questions[0].clazz).toBe("IN");
        expect(interpreted.answers[0].type).toBe("A");
        expect(interpreted.answers[0].clazz).toBe("IN");
    });

    test('Expect an unknown type or class to keep its numeric value', () => {
        const message = new dnsclient.QueryMessage();
        message.answers.push(new dnsclient.Record("example.com", 54, 999, 60, new Uint8Array(0)));

        const interpreted = dnsclient.interpret(message);

        expect(interpreted.answers[0].type).toBe(54);
        expect(interpreted.answers[0].clazz).toBe(999);
    });

    test('Expect an interpreted record to still serialize to the same bytes', () => {
        const record = () => new dnsclient.Record(
            "example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN, 300, {ipv4: "192.0.2.1"}
        );
        const numeric = dnsclient.DnsRecordSerializer.toBytes(record());

        const named = record();
        named.type = "A";
        named.clazz = "IN";

        expect(dnsclient.DnsRecordSerializer.toBytes(named)).toEqual(numeric);
    });
});
