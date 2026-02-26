---
title: "The Golang Zero Value Trap: How pgx v5 Exposed Silent Corruption"
description: "Exploring a subtle bug in Golang's pgx v5 library that led to silent data corruption due to zero values. This post delves into the issue, its implications, and how to avoid similar pitfalls in your Go applications."
pubDate: "2026-01-02"
---

## <img src="/images/golang_sql.webp" class="img-responsive" alt="Golang SQL Hero Image">

TLDR: A pgx v5 migration didn’t introduce a bug, it exposed 18 months of silent data corruption caused by a Go map zero-value lookup and time.Time{} being treated as valid.

Migrations are rarely just about swapping versions. Sometimes, they act as a wake up call, revealing cracks in your system that you didn’t even know were there.

We recently upgraded our Go PostgreSQL driver from pgx v4 to v5. We expected a few compilation errors and maybe some performance tuning. instead, we got a production incident.

The upgrade didn’t cause a bug, it revealed a logic error that had been silently corrupting our data.

The Context: pgx v4 vs. v5
To understand the incident, you have to understand what changed in the codebase

In pgx v4, timestamp handling was largely implicit. Passing a Go time.Time value, including its zero value, would be encoded and sent directly to Postgres. A zero-value time.Time{} serialises to 0001–01–01 00:00:00.

Postgres considers this a valid timestamp, so the write succeeds without complaint.

In pgx v5, performance and type safety are handled via the pgtype package. V4 relied on the database/sql package. With the pgtype package, while very similar, it required migration of our types. SQLC made this easier, but we still needed to handle conversions, like using pgtype.Timestamptz.

To handle this case, I wrote a helper function

```go
func TimeToTimestamptz(t time.Time) pgtype.Timestamptz {
    if t.IsZero() {
        return pgtype.Timestamptz{Valid: false}
    }
    return pgtype.Timestamptz{Time: t, Valid: true}
}
```

If we attempt to insert an invalid timestamp, we are going to get an error, which is what we want. When we run our test suite, it should be obvious if we are doing this.

The Incident: “Null Value Violates Constraint”
Shortly after releasing to production, we saw errors spiking on the “Save Floorplan” endpoint. At Dojo, I work on our booking system. This has a floor plan layout for storing the layout of a restaurant. A fixture is a series of X & Y coordinates indicating the floorplan as shown in our web app.

```sh
ERROR: null value in column "created_at" of relation "fixtures" violates not-null constraint
```

The created_at column is NOT NULL. Our code was designed to preserve the existing timestamp during an edit. We weren't trying to insert NULLs, or so we thought.

The Logic Bug
We traced the error to a loop where we update fixtures. Here is the logic

Load existing fixtures from the DB into a map.
Iterate through the user’s request.
If the fixture ID exists, grab its original created_at from the map to preserve it.
Here is the simplified version of the buggy code:

```go
if f.FixtureID == uuid.Nil {
    f.FixtureID = r.uuidGen() // It's new
} else {
    // BUG: accessing a map without checking for existence
    createdAt = currentFixtureIDs[f.FixtureID].CreatedAt.Time
}
```

You might ask: if the UUID wasn’t nil, why wasn’t there a created_at?

Elsewhere in the code, the UUID was being set before this logic ran. This code assumed that “UUID exists” meant “row exists in the database”. That assumption was wrong. When the fixture wasn’t in the map, the lookup silently failed.

The Go Gotcha
In Go, accessing a map with a missing key does not panic. It returns the zero value for the value type.

For 18 months the code silently returned time.Time{}

Before the migration: pgxv4 took0001-01-01 00:00:00date and wrote it to the database. The database accepted it happily.
After the migration: Our new helper saw the zero date, flagged it as Valid: false, and sent NULL to the database. Postgres correctly rejected it.
The half glass full engineer in me might say, everything in the migration was fine, we just found a bug. Still an incident though isn’t it?

Incident: The Data Trap
We thought fixing the logic map lookup would solve it. We deployed a fix that ensured we only read from the map if the key actually existed.

Enter page number 2.

When we ran our tests, we created a bunch of new fixtures with valid timestamps, then updated them and the new tests passed. At this stage though, we masked the bug, because the difference between our tests and production was that for 18 months we had been inserting zero timestamps.

Our database was full of rows where created_at was 0001-01-01. This created a loop that the code couldn’t handle.

Read: The app reads a fixture from the DB. Postgres returns 0001-01-01.
Process: The app tries to preserve this date for the update using our map logic
Write: The app passes 0001-01-01 to TimeToTimestamptz.
The Bug: The helper sees IsZero() is true. It converts it to NULL.
The Result: Postgres rejects the update because created_at cannot be NULL.
Even though the code logic was fixed, the production data was breaking the process.

The Fix
We updated our logic to treat invalid historical data as missing. If we encounter a zero value timestamp from the database, we don’t try to preserve it, we overwrite it with Now(). This is a little trust but verify scenario, but in most cases, the data was bad. We don’t mind using the current datetime because the data was already broken, so at the very least, we now had usable data.

```go
func resolveFixtureCreatedAt(defaultTime time.Time, existing queries.Fixture) time.Time {

 // If the existing value is valid, preserve it
 if existing.CreatedAt.Valid && !existing.CreatedAt.Time.IsZero() {
  return existing.CreatedAt.Time
 }

 // Fallback: If data is missing OR corrupted, use Now.
 // This "repairs" the row on the next write.
 return defaultTime
}
```

Check the Database
For 18 months, our system was writing corrupt data, and nobody noticed because nothing failed.

If a dependency upgrade introduces bugs, don’t rush to patch around it.
Ask what the old version was quietly tolerating.
