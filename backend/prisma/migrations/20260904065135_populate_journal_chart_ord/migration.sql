UPDATE "JournalChart" jc
SET "ord" = ranked.rn
FROM (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY "journalEntryId"
            ORDER BY "createdAt", id
        ) AS rn
    FROM "JournalChart"
) ranked
WHERE jc.id = ranked.id;