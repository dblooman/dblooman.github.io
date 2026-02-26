---
title: "The Golang Zero Value Trap: How pgx v5 Exposed Silent Corruption"
description: "Exploring a subtle bug in Golang's pgx v5 library that led to silent data corruption due to zero values. This post delves into the issue, its implications, and how to avoid similar pitfalls in your Go applications."
pubDate: "2026-01-02"
---

## <img src="/images/golang_sql.webp" class="img-responsive" alt="Golang SQL Hero Image">

> **TL;DR:** A pgx v5 migration didn’t introduce a bug — it exposed 18 months of silent data corruption caused by a Go map zero-value lookup and treating `time.Time{}` as valid.

---

Migrations are rarely just about swapping versions. Sometimes they act as a wake-up call, revealing cracks in your system you didn't know were there.

We recently upgraded our Go PostgreSQL driver from pgx v4 to v5. We expected some compile fixes and minor tweaks. Instead, we triggered a production incident that revealed a long-standing logic error silently corrupting our data.

### The Context: pgx v4 vs. v5

To understand the incident, you need to know what changed in the codebase.

- In pgx v4, timestamp handling was largely implicit: passing a Go `time.Time` value (including its zero value) would be encoded and sent directly to Postgres. A zero-value `time.Time{}` serialises to `0001-01-01 00:00:00`.
- Postgres treats that as a valid timestamp, so the write succeeds.

- In pgx v5, type safety and performance are handled via the `pgtype` package. Migrating to `pgtype` required explicit conversions (e.g. `pgtype.Timestamptz`), which is more correct — but it exposed places where our code relied on the old implicit behavior.

To handle zero timestamps we added a small helper:

```go
func TimeToTimestamptz(t time.Time) pgtype.Timestamptz {
    if t.IsZero() {
        return pgtype.Timestamptz{Valid: false}
    }
    return pgtype.Timestamptz{Time: t, Valid: true}
}
```

### The Incident: “Null value in column \"created_at\" violates not-null constraint”

Shortly after releasing to production we saw errors spiking on the “Save Floorplan” endpoint. A fixture in our booking system is a series of X/Y coordinates describing a restaurant layout. The error looked like:

```sh
ERROR: null value in column "created_at" of relation "fixtures" violates not-null constraint
```

The `created_at` column is `NOT NULL`. Our code was supposed to preserve the existing timestamp during edits — we weren't trying to insert `NULL`s, or so we thought.

### The Logic Bug

We traced the error to a loop that updates fixtures. The flow was:

1. Load existing fixtures from the DB into a `map`.
2. Iterate through the user's request payload.
3. If the fixture ID exists, grab its original `created_at` from the map to preserve it.

Here is the simplified version of the buggy code:

```go
if f.FixtureID == uuid.Nil {
    f.FixtureID = r.uuidGen() // new
} else {
    // BUG: accessing a map without checking for existence
    createdAt = currentFixtureIDs[f.FixtureID].CreatedAt.Time
}
```

Elsewhere the UUID was being set before this logic ran. The code assumed that “UUID exists” meant “row exists in the database”. That assumption was wrong: when the fixture wasn’t present in the map, the lookup returned the zero value.

### The Go Gotcha

In Go, reading a missing map key does not panic; it returns the zero value for the value type. In our case, that meant `time.Time{}`.

- For 18 months the code silently returned `time.Time{}` for missing entries.
- Before the migration: pgx v4 would serialize that zero time as `0001-01-01 00:00:00` and Postgres accepted it as a valid timestamp.
- After migrating to pgx v5 and `pgtype`, our helper detected the zero time, marked the value as invalid (`Valid: false`), and sent `NULL` to Postgres — which correctly rejected it.

So while the migration behaved correctly, it exposed a pre-existing data and logic problem.

### The Data Trap

We fixed the map lookup and tests passed locally. But production data diverged: the DB contained many rows where `created_at` was `0001-01-01`. The sequence that caused the failure was:

- Read: app reads a fixture from the DB; Postgres returns `0001-01-01`.
- Process: app tries to preserve that date.
- Write: `TimeToTimestamptz` treats it as zero and converts it to `NULL`.
- Result: Postgres rejects the update because `created_at` cannot be `NULL`.

Even after fixing the code, the corrupted data still broke the process until the rows were repaired.

### The Fix

We updated our resolution logic to treat historical zero timestamps as corrupted/missing and overwrite them with a sensible default (usually `time.Now()`) when appropriate. This both avoids the `NULL` rejection and repairs rows on the next write.

```go
func resolveFixtureCreatedAt(defaultTime time.Time, existing queries.Fixture) time.Time {
    // If the existing value is valid, preserve it
    if existing.CreatedAt.Valid && !existing.CreatedAt.Time.IsZero() {
        return existing.CreatedAt.Time
    }

    // Fallback: if data is missing or corrupted, use the provided default (e.g. time.Now())
    return defaultTime
}
```

### Check the Database

Audit your rows for zero timestamps and repair them. For example, identify rows with `created_at = '0001-01-01'` and update them to a sensible value or mark them for review.

### Takeaways

- When a dependency upgrade surfaces errors, treat it as an opportunity to ask why the previous version tolerated the behavior.
- Be explicit about conversions for nullable/zero values when dealing with DB drivers and typed encoding libraries like `pgtype`.
- Tests that only create new, valid data can mask historical corruption — include migration and historical-data checks in your QA workflows.

If a dependency upgrade introduces bugs, don’t rush to patch around it — ask what the old version was quietly tolerating.
