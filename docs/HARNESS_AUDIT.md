# Harness Audit

`scripts/bin/harness-cli audit` (Windows: `scripts/bin/harness-cli.exe audit`)
detects drift in durable Harness state and prints an entropy score. Lower is
better.

## Checks

| Category | Meaning | Weight |
| --- | --- | --- |
| Orphaned stories | Planned or in-progress stories with no linked trace. | 10 |
| Unverified stories | Active or implemented stories with `verify_command` but `last_verified_result` is `NULL` (never recorded). Retired stories are historical records and are not counted. | 5 |
| Unverified decisions | Decisions with `verify_command` but no recorded verification result. | 5 |
| Open backlog without outcomes | Implemented backlog items with predicted impact but no actual outcome. | 2 |
| Stale stories | Unimplemented stories whose latest linked trace is more than 30 days old. | 3 |
| Broken tools | Registered tools whose command is not found on disk or `PATH`. | 8 |

### Known CLI limitation: failed verification

The durable schema stores `last_verified_result` as `'pass'`, `'fail'`, or
`NULL`. The current audit binary only treats **missing** results (`NULL`) as
unverified. A recorded **`fail` does not increase entropy** and does not appear
in the unverified list.

Consequence:

- A workspace can report a low/perfect entropy score while active stories have
  `last_verified_result = 'fail'`.
- Agents must not treat `audit` alone as proof of healthy verification. Also
  inspect `story` rows (or re-run `story verify <id>`) and require `pass`.

Recommended agent check after audit:

```text
scripts/bin/harness-cli query sql "SELECT id, status, last_verified_result FROM story WHERE verify_command IS NOT NULL AND last_verified_result IS NOT 'pass'"
```

On Windows, use `scripts/bin/harness-cli.exe` for the same command.

Until the upstream CLI adds a **Failed verification** entropy category, treat
any non-`pass` result as blocking release proof even when the audit score is
low.

## Score

```text
score = orphaned_stories * 10
      + unverified_stories * 5
      + unverified_decisions * 5
      + backlog_without_outcomes * 2
      + stale_stories * 3
      + broken_tools * 8
```

The score is capped at 100.

| Range | Interpretation |
| --- | --- |
| 0 | No scored drift categories above. Still check for `last_verified_result = 'fail'`. |
| 1-25 | Healthy: minor housekeeping remains. |
| 26-50 | Attention needed: drift is accumulating. |
| 51-100 | Action required: stale state undermines Harness value. |

Audit findings feed `scripts/bin/harness-cli propose`, which can turn repeated
drift into proposed backlog items.
