import { createHmac } from 'node:crypto';
import * as dnsclient from '../dnsclient.js';

const KEY_NAME = "test.key";
const SECRET = "RGFzSXN0RWluVGVzdA==";
const TIMESTAMP = 1708780800n;

/**
 * Builds the digest input of RFC 2845 §3.4 by hand as a specification fixture:
 * the message as it will be sent (without the TSIG RR and without the
 * incremented ARCOUNT), followed by the TSIG variables of §3.4.2. Neither the
 * record type nor the original message ID are part of those variables.
 */
function expectedDigestInput(messageBytes) {
    const encoder = new TextEncoder();
    const label = (text) => [text.length, ...encoder.encode(text)];

    return new Uint8Array([
        ...messageBytes,
        ...label("test"), ...label("key"), 0x00, // Key name in canonical wire format
        0x00, 0xFF,                             // Class: ANY (255)
        0x00, 0x00, 0x00, 0x00,                 // TTL: 0
        ...label("hmac-sha256"), 0x00,          // Algorithm name in wire format
        0x00, 0x00, 0x65, 0xD9, 0xED, 0x00,     // Time Signed: 1708780800 (48 bit)
        0x01, 0x2C,                             // Fudge: 300
        0x00, 0x00,                             // Error: 0
        0x00, 0x00                              // Other Len: 0
    ]);
}

describe('A query message can be signed with TSIG', () => {
    let message;
    let unsignedBytes;

    beforeAll(async () => {
        message = new dnsclient.QueryMessage();
        message.id = 1234;
        message.questions.push(new dnsclient.Question("example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN));
        unsignedBytes = dnsclient.DnsSerializer.serialize(message);

        message = await dnsclient.sign(message, KEY_NAME, SECRET, {timestamp: TIMESTAMP});
    });

    test('Expect a TSIG record to be appended to the additional section', () => {
        expect(message.additionals).toHaveLength(1);
        expect(message.arcount).toBe(1);
        expect(message.additionals[0].type).toBe(dnsclient.TYPE.TSIG);
        expect(message.additionals[0].clazz).toBe(dnsclient.CLAZZ.ANY);
        expect(message.additionals[0].ttl).toBe(0);
    });

    test('Expect the TSIG rdata to carry the requested parameters', () => {
        const rdata = message.additionals[0].data;

        expect(rdata.algorithm).toBe("hmac-sha256");
        expect(rdata.timestamp).toBe(TIMESTAMP);
        expect(rdata.fudge).toBe(300);
        expect(rdata.originalId).toBe(1234);
        expect(rdata.error).toBe(0);
    });

    test('Expect the MAC to match the RFC 2845 digest of the TSIG variables', () => {
        const expected = createHmac('sha256', Buffer.from(SECRET, 'base64'))
            .update(expectedDigestInput(unsignedBytes))
            .digest();

        expect(Buffer.from(message.additionals[0].data.mac)).toEqual(expected);
    });

    test('Expect the MAC to be 32 bytes for hmac-sha256', () => {
        expect(message.additionals[0].data.mac.byteLength).toBe(32);
    });

    test('Expect the signed message to serialize and round-trip', () => {
        const wire = dnsclient.DnsSerializer.serialize(message);
        const result = dnsclient.DnsSerializer.deserialize(wire.buffer);

        expect(result.additionals).toHaveLength(1);
        expect(result.additionals[0].data.algorithm).toBe("hmac-sha256");
        expect(result.additionals[0].data.timestamp).toBe(TIMESTAMP);
        expect(result.additionals[0].data.fudge).toBe(300);
        expect(result.additionals[0].data.originalId).toBe(1234);
        expect(result.additionals[0].data.mac).toEqual(message.additionals[0].data.mac);
    });
});

describe('An update message can be signed with TSIG', () => {
    // The section counts are getters, so signing must not try to assign to them.
    test('Expect signing an UpdateMessage to succeed', async () => {
        const message = new dnsclient.UpdateMessage();
        message.id = 1234;
        message.zones.push(new dnsclient.Zone("example.com"));
        message.updates.push(new dnsclient.Record(
            "test.example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN, 60, {ipv4: "192.0.2.1"}
        ));

        const signed = await dnsclient.sign(message, KEY_NAME, SECRET, {timestamp: TIMESTAMP});

        expect(signed.adcount).toBe(1);
        expect(signed.additionals[0].data.mac.byteLength).toBe(32);
    });
});

describe('TSIG signing supports the algorithms of RFC 8945', () => {
    test.each([
        ["hmac-sha1", 20],
        ["hmac-sha256", 32],
        ["hmac-sha384", 48],
        ["hmac-sha512", 64]
    ])('Expect %s to produce a %i byte MAC', async (algorithm, macLength) => {
        const message = new dnsclient.QueryMessage();
        message.questions.push(new dnsclient.Question("example.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN));

        const signed = await dnsclient.sign(message, KEY_NAME, SECRET, {algorithm, timestamp: TIMESTAMP});

        expect(signed.additionals[0].data.mac.byteLength).toBe(macLength);
        expect(signed.additionals[0].data.algorithm).toBe(algorithm);
    });

    test('Expect an unsupported algorithm to be rejected', async () => {
        const message = new dnsclient.QueryMessage();

        await expect(dnsclient.sign(message, KEY_NAME, SECRET, {algorithm: "hmac-md5"}))
            .rejects.toThrow(/Unsupported TSIG algorithm/);
    });
});
