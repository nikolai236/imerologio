CREATE OR REPLACE FUNCTION attach_symbol_label_to_trade()
RETURNS trigger AS $$
DECLARE
  currLabelId int;
BEGIN
  SELECT l."id" INTO currLabelId
  FROM "Label" l
  WHERE l."symbolId" = NEW."symbolId";

  IF currLabelId IS NULL THEN
    RAISE EXCEPTION 'Missing symbol label for symbolId=%', NEW."symbolId";
  END IF;

  INSERT INTO "trade_labels" ("tradeId", "labelId")
  VALUES (NEW."id", currLabelId);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attach_symbol_label_on_trade_insert ON "Trade";
CREATE TRIGGER attach_symbol_label_on_trade_insert
AFTER INSERT ON "Trade"
FOR EACH ROW
EXECUTE FUNCTION attach_symbol_label_to_trade();

INSERT INTO "trade_labels" ("tradeId", "labelId")
SELECT t."id", l."id"
FROM "Trade" t
JOIN "Label" l
  ON l."symbolId" = t."symbolId"
ON CONFLICT DO NOTHING;