# Baseline previa al plan de hardening
Commit: 601b919057efd0f6895ed2f3ff84700af62e217d
Fecha: 2026-09-10T14:45:00Z

## grows-bridge.test.mjs
```
# tests 6
# pass 6
# fail 0
# duration_ms 90.7807
```

## cargo test --lib
```
running 4 tests
test job_runner::tests::parses_fenced_json ... ok
test pairing::tests::parses_pair_url ... ok
test pairing::tests::rejects_bad_scheme ... ok
test cli_detector::tests::detects_three_providers ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
warning: fields `scope_path_ids` and `selection_ids` are never read (job_runner.rs)
```

## apps/web tests
```
Test Files  24 passed (24)
Tests  104 passed (104)
Duration  31.34s
```
