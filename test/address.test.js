import * as dnsclient from '../dnsclient.js';

/**
 * Round-trips an address through the record codec so both directions are covered.
 */
function roundtrip(codec, key, value, byteLength) {
    const bytes = codec.serialize({[key]: value});
    expect(bytes.byteLength).toBe(byteLength);
    return codec.deserialize(new DataView(bytes.buffer), 0, byteLength)[key];
}

describe('IPv4 addresses are parsed and formatted correctly', () => {
    test.each([
        "0.0.0.0",
        "127.0.0.1",
        "192.0.2.1",
        "255.255.255.255"
    ])('Expect %s to round-trip', (address) => {
        expect(roundtrip(dnsclient.DnsRecordSerializer.A, "ipv4", address, 4)).toBe(address);
    });

    test.each([
        "1.2.3",
        "1.2.3.4.5",
        "1.2.3.256",
        "1.2.3.-1",
        "a.b.c.d",
        ""
    ])('Expect the malformed address "%s" to be rejected', (address) => {
        expect(() => dnsclient.DnsRecordSerializer.A.serialize({ipv4: address}))
            .toThrow(/Invalid IPv4 address/);
    });

    test('Expect a wrong rdata length to be reported', () => {
        expect(() => dnsclient.DnsRecordSerializer.A.deserialize(new DataView(new ArrayBuffer(8)), 0, 8))
            .toThrow(/Invalid IPv4 byte array length/);
    });
});

describe('IPv6 addresses are parsed and formatted correctly', () => {
    test.each([
        ["::", "::"],
        ["::1", "::1"],
        ["1::", "1::"],
        ["2001:db8::1", "2001:db8::1"],
        ["2001:db8:0:0:0:0:2:1", "2001:db8::2:1"],
        ["fe80:0:0:0:204:61ff:fe9d:f156", "fe80::204:61ff:fe9d:f156"],
        ["2001:db8:1:2:3:4:5:6", "2001:db8:1:2:3:4:5:6"],
        // Only the longest run collapses, and only a run of two or more.
        ["2001:0:1:0:0:0:0:1", "2001:0:1::1"],
        ["1:0:2:0:0:3:0:4", "1:0:2::3:0:4"]
    ])('Expect %s to be formatted as %s', (input, expected) => {
        expect(roundtrip(dnsclient.DnsRecordSerializer.AAAA, "ipv6", input, 16)).toBe(expected);
    });

    test('Expect an embedded IPv4 address to be accepted', () => {
        const bytes = dnsclient.DnsRecordSerializer.AAAA.serialize({ipv6: "::ffff:192.0.2.1"});

        expect(Array.from(bytes.subarray(10))).toEqual([0xff, 0xff, 192, 0, 2, 1]);
    });

    test.each([
        "2001:db8::1::2",
        "2001:db8:1:2:3:4:5",
        "2001:db8:1:2:3:4:5:6:7",
        "2001:zzzz::1",
        "12345::1"
    ])('Expect the malformed address "%s" to be rejected', (address) => {
        expect(() => dnsclient.DnsRecordSerializer.AAAA.serialize({ipv6: address}))
            .toThrow(/Invalid IPv6 address/);
    });

    test('Expect a wrong rdata length to be reported', () => {
        expect(() => dnsclient.DnsRecordSerializer.AAAA.deserialize(new DataView(new ArrayBuffer(4)), 0, 4))
            .toThrow(/Invalid IPv6 byte array length/);
    });

    test('Expect the all-zero address to decode as "::"', () => {
        expect(dnsclient.DnsRecordSerializer.AAAA.deserialize(new DataView(new ArrayBuffer(16)), 0, 16).ipv6)
            .toBe("::");
    });
});
