# Changelog

## [2.0.0](https://github.com/yannickdreher/dnsclient.js/compare/v1.1.0...v2.0.0) (2026-08-17)


### ⚠ BREAKING CHANGES

* several fixes change values the API returns, or turn a call that previously succeeded with wrong output into a thrown error. Existing code may depend on the old behaviour even though it was incorrect:

### Features

* harden wire-format parsing and add record types, EDNS(0) and TSIG options ([90adf43](https://github.com/yannickdreher/dnsclient.js/commit/90adf430196a3882e4b12d05e3978d3f3fe4c145))
