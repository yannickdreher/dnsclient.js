import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { createHmac } from 'crypto';
import * as dnsclient from '../dnsclient.js';

const SECRET_B64 = 'RGFzSXN0RWluVGVzdA=='; // "DasIstEinTest"
const KEY_NAME = 'test.key.';

/**
 * Builds the byte sequence over which TSIG (RFC 2845) computes the MAC for an
 * unsigned request: <unsigned message> <key name (canonical wire)> <CLASS=ANY>
 * <TTL=0> <algorithm name (canonical wire)> <time (48 bit)> <fudge> <error>
 * <other-len> <other-data>.
 */
function buildTsigDigestInput(messageBytes, keyName, algorithm, timestamp, fudge, error = 0, otherData = new Uint8Array(0)) {
    const nameBytes = dnsclient.DnsNameSerializer.serialize(keyName);
    const algBytes  = dnsclient.DnsNameSerializer.serialize(algorithm);
    const tsHi = Number((timestamp >> 32n) & 0xFFFFn);
    const tsLo = Number(timestamp & 0xFFFFFFFFn);

    const len = messageBytes.byteLength + nameBytes.byteLength + 2 + 4 +
                algBytes.byteLength + 6 + 2 + 2 + 2 + otherData.byteLength;
    const buf = new Uint8Array(len);
    const view = new DataView(buf.buffer);
    let off = 0;
    buf.set(messageBytes, off); off += messageBytes.byteLength;
    buf.set(nameBytes, off);    off += nameBytes.byteLength;
    view.setUint16(off, dnsclient.CLAZZ.ANY, false); off += 2;
    view.setUint32(off, 0, false);                   off += 4;
    buf.set(algBytes, off);     off += algBytes.byteLength;
    view.setUint16(off, tsHi, false); off += 2;
    view.setUint32(off, tsLo, false); off += 4;
    view.setUint16(off, fudge, false); off += 2;
    view.setUint16(off, error, false); off += 2;
    view.setUint16(off, otherData.byteLength, false); off += 2;
    buf.set(otherData, off);
    return buf;
}

function makeUpdate() {
    const m = new dnsclient.UpdateMessage();
    m.id = 0x1234;
    m.zones.push(new dnsclient.Zone('example.com'));
    const rec = new dnsclient.Record('host.example.com', dnsclient.TYPE.A, dnsclient.CLAZZ.IN, 60);
    rec.data = { ipv4: '192.0.2.1' };
    m.updates.push(rec);
    return m;
}

describe('sign() (TSIG, RFC 2845)', () => {
    let nowSpy;
    const FIXED_NOW_MS = 1_700_000_000_000; // 2023-11-14T22:13:20Z
    const FIXED_TS = BigInt(Math.floor(FIXED_NOW_MS / 1000));

    beforeEach(() => {
        nowSpy = jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW_MS);
    });

    afterEach(() => {
        nowSpy.mockRestore();
    });

    test('appends a TSIG record to additionals with the expected field values', async () => {
        const msg = makeUpdate();
        const beforeAdditionals = msg.additionals.length;

        const signed = await dnsclient.sign(msg, KEY_NAME, SECRET_B64);

        // Returned message is the same instance, mutated in place.
        expect(signed).toBe(msg);
        expect(signed.additionals).toHaveLength(beforeAdditionals + 1);

        const tsig = signed.additionals.at(-1);
        expect(tsig).toBeInstanceOf(dnsclient.Record);
        expect(tsig.name).toBe(KEY_NAME);
        expect(tsig.type).toBe(dnsclient.TYPE.TSIG);
        expect(tsig.clazz).toBe(dnsclient.CLAZZ.ANY);
        expect(tsig.ttl).toBe(0);

        expect(tsig.data.algorithm).toBe('hmac-sha256');
        expect(tsig.data.fudge).toBe(300);
        expect(tsig.data.error).toBe(0);
        expect(tsig.data.originalId).toBe(msg.id);
        expect(tsig.data.timestamp).toBe(FIXED_TS);
        expect(tsig.data.otherData).toEqual(new Uint8Array(0));
        // HMAC-SHA256 -> 32 byte MAC.
        expect(tsig.data.mac).toBeInstanceOf(Uint8Array);
        expect(tsig.data.mac.byteLength).toBe(32);
    });

    test('MAC matches an independently computed HMAC-SHA256', async () => {
        const msg = makeUpdate();
        // Snapshot the message bytes BEFORE signing (sign() must compute over
        // the unsigned message).
        const messageBytes = dnsclient.DnsSerializer.serialize(msg);

        await dnsclient.sign(msg, KEY_NAME, SECRET_B64);
        const tsig = msg.additionals.at(-1);

        const digestInput = buildTsigDigestInput(
            messageBytes, KEY_NAME, 'hmac-sha256', FIXED_TS, 300);

        const expected = createHmac('sha256', Buffer.from(SECRET_B64, 'base64'))
            .update(Buffer.from(digestInput))
            .digest();

        expect(Buffer.from(tsig.data.mac)).toEqual(expected);
    });

    test('produces deterministic MAC when timestamp and id are fixed', async () => {
        const a = makeUpdate();
        const b = makeUpdate();
        await dnsclient.sign(a, KEY_NAME, SECRET_B64);
        await dnsclient.sign(b, KEY_NAME, SECRET_B64);
        expect(a.additionals.at(-1).data.mac).toEqual(b.additionals.at(-1).data.mac);
    });

    test('different secrets yield different MACs', async () => {
        const a = makeUpdate();
        const b = makeUpdate();
        await dnsclient.sign(a, KEY_NAME, SECRET_B64);
        await dnsclient.sign(b, KEY_NAME, 'b3RoZXJzZWNyZXQ='); // "othersecret"
        expect(a.additionals.at(-1).data.mac)
            .not.toEqual(b.additionals.at(-1).data.mac);
    });

    test('the signed message can be serialized as a complete DNS packet', async () => {
        const msg = makeUpdate();
        await dnsclient.sign(msg, KEY_NAME, SECRET_B64);
        const bytes = dnsclient.DnsSerializer.serialize(msg);
        // Header arcount must reflect the appended TSIG.
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        expect(view.getUint16(10)).toBe(msg.additionals.length);
        // Round-trip parse must succeed.
        const parsed = dnsclient.DnsSerializer.deserialize(
            bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
        expect(parsed).toBeInstanceOf(dnsclient.UpdateMessage);
        expect(parsed.additionals.at(-1).type).toBe(dnsclient.TYPE.TSIG);
    });
});
