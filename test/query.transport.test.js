import { jest, describe, test, expect, afterEach } from '@jest/globals';
import * as dnsclient from '../dnsclient.js';

const URL = "https://dns.example.com/dns-query";

function queryMessage(id = 1234) {
    const message = new dnsclient.QueryMessage();
    message.id = id;
    message.questions.push(new dnsclient.Question("example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN));
    return message;
}

function responseBytes({id = 1234, qr = 1} = {}) {
    const message = queryMessage(id);
    message.flags.qr = qr;
    return dnsclient.DnsSerializer.serialize(message);
}

function okResponse(bytes = responseBytes(), headers) {
    return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers,
        arrayBuffer: async () => bytes.buffer
    };
}

afterEach(() => {
    delete global.fetch;
    jest.restoreAllMocks();
});

describe('query() cleans up after a message that cannot be serialized', () => {
    test('Expect neither a timer nor an abort listener to be left behind', async () => {
        const setTimeoutSpy = jest.spyOn(globalThis, "setTimeout");
        const controller = new AbortController();
        const addListener = jest.spyOn(controller.signal, "addEventListener");
        global.fetch = jest.fn();

        const message = new dnsclient.QueryMessage();
        message.questions.push({name: 123, type: 1, clazz: 1});

        await expect(dnsclient.query(URL, message, {timeout: 1000, signal: controller.signal}))
            .rejects.toThrow(/DNS name must be a string/);
        expect(setTimeoutSpy).not.toHaveBeenCalled();
        expect(addListener).not.toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
    });
});

describe('query() covers the response body with the timeout and the signal', () => {
    function stallingBody() {
        return (url, init) => Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            arrayBuffer: () => new Promise((resolve, reject) => {
                init.signal.addEventListener("abort", () => reject(init.signal.reason), {once: true});
            })
        });
    }

    test('Expect a body that stalls to hit the timeout', async () => {
        global.fetch = stallingBody();

        await expect(dnsclient.query(URL, queryMessage(), {timeout: 20}))
            .rejects.toThrow(/timed out after 20 ms/);
    });

    test('Expect the caller signal to abort a body that stalls', async () => {
        global.fetch = stallingBody();
        const controller = new AbortController();

        const pending = dnsclient.query(URL, queryMessage(), {signal: controller.signal});
        setTimeout(() => controller.abort(new Error("cancelled by caller")), 10);

        await expect(pending).rejects.toThrow(/cancelled by caller/);
    });
});

describe('query() validates the response', () => {
    test('Expect a non-DNS content type to be rejected', async () => {
        global.fetch = async () => okResponse(responseBytes(), new Headers({"Content-Type": "text/html"}));

        await expect(dnsclient.query(URL, queryMessage()))
            .rejects.toThrow(/returned "text\/html" instead of a DNS message/);
    });

    test('Expect the DNS content type with parameters to be accepted', async () => {
        global.fetch = async () => okResponse(responseBytes(), new Headers({"Content-Type": "application/dns-message; charset=binary"}));

        const {result} = await dnsclient.query(URL, queryMessage());

        expect(result.id).toBe(1234);
    });

    test('Expect a response with another ID to be rejected', async () => {
        global.fetch = async () => okResponse(responseBytes({id: 4321}));

        await expect(dnsclient.query(URL, queryMessage()))
            .rejects.toThrow(/response ID 4321 does not match the query ID 1234/);
    });

    test('Expect a message without the QR bit to be rejected', async () => {
        global.fetch = async () => okResponse(responseBytes({qr: 0}));

        await expect(dnsclient.query(URL, queryMessage()))
            .rejects.toThrow(/not a response/);
    });
});

describe('query() supports GET requests (RFC 8484 §4.1)', () => {
    test('Expect the message to travel base64url-encoded in the dns parameter', async () => {
        const calls = [];
        global.fetch = async (url, init) => {
            calls.push({url, init});
            return okResponse(responseBytes({id: 0}));
        };
        const message = queryMessage(0);

        await dnsclient.query(URL, message, {method: "GET"});

        const url = new globalThis.URL(calls[0].url);
        const encoded = url.searchParams.get("dns");
        expect(calls[0].init.method).toBe("GET");
        expect(calls[0].init.body).toBeUndefined();
        expect(calls[0].init.headers["Content-Type"]).toBeUndefined();
        expect(calls[0].init.headers["Accept"]).toBe("application/dns-message");
        expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(new Uint8Array(Buffer.from(encoded, "base64url")))
            .toEqual(dnsclient.DnsSerializer.serialize(message));
    });

    test('Expect an existing query string to be extended', async () => {
        const calls = [];
        global.fetch = async (url) => {
            calls.push(url);
            return okResponse(responseBytes());
        };

        await dnsclient.query(`${URL}?ct`, queryMessage(), {method: "get"});

        expect(calls[0]).toMatch(/\?ct&dns=/);
    });

    test('Expect another HTTP method to be rejected', async () => {
        await expect(dnsclient.query(URL, queryMessage(), {method: "PUT"}))
            .rejects.toThrow(/Unsupported HTTP method "PUT"/);
    });
});

describe('DnsClient', () => {
    function echoFetch(calls) {
        return async (url, init) => {
            calls.push({url, init});
            const encoded = new globalThis.URL(url).searchParams.get("dns");
            const request = dnsclient.DnsSerializer.deserialize(new Uint8Array(Buffer.from(encoded, "base64url")));
            request.flags.qr = 1;
            return okResponse(dnsclient.DnsSerializer.serialize(request));
        };
    }

    test('Expect GET lookups to use message ID 0 for cacheability', async () => {
        const calls = [];
        global.fetch = echoFetch(calls);
        const client = new dnsclient.DnsClient(URL, {method: "GET"});

        const result = await client.resolve("example.com", "A");

        expect(calls[0].init.method).toBe("GET");
        expect(result.id).toBe(0);
    });

    test.each([
        ["::1", "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa"],
        ["fe80::", "0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.e.f.ip6.arpa"],
        ["::ffff:192.0.2.1", "1.0.2.0.0.0.0.c.f.f.f.f.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa"],
        ["192.0.2.1", "1.2.0.192.in-addr.arpa"]
    ])('Expect reverse(%s) to query %s', async (ip, name) => {
        const calls = [];
        global.fetch = echoFetch(calls);
        const client = new dnsclient.DnsClient(URL, {method: "GET"});

        const result = await client.reverse(ip);

        expect(result.question).toEqual({name, type: "PTR", class: "IN"});
    });

    test('Expect an invalid IPv6 address to be rejected', async () => {
        const client = new dnsclient.DnsClient(URL);

        await expect(client.reverse("1::2::3")).rejects.toThrow(/Invalid IPv6 address/);
    });
});
