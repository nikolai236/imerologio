INSERT INTO "LabelClosure" ("ancestorId", "descendantId")
SELECT
	l.id,
	l.id
FROM "Label" l
ON CONFLICT ("ancestorId", "descendantId") DO NOTHING;