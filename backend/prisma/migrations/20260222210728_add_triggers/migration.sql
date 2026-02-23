-- fill in for symbols without labels
INSERT INTO "Label" ("name", "symbolId")
SELECT 'symbol:' || s."name", s.id
FROM "Symbol" s
LEFT JOIN "Label" l ON l."symbolId" = s.id
WHERE l.id IS NULL;


-- after we insert a symbol create a label for it
CREATE OR REPLACE FUNCTION create_symbol_label()
RETURNS trigger AS $$
BEGIN
  INSERT INTO "Label" ("name", "symbolId")
  VALUES ('symbol:' || NEW."name", NEW.id)
  ON CONFLICT("symbolId") DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_label_on_symbol_insert ON "Symbol";
CREATE TRIGGER create_label_on_symbol_insert
AFTER INSERT ON "Symbol"
FOR EACH ROW
EXECUTE FUNCTION create_symbol_label();


-- sync label names after updating symbol
CREATE OR REPLACE FUNCTION sync_symbol_label_name()
RETURNS trigger AS $$
BEGIN
  UPDATE "Label"
  SET "name" = 'symbol:' || NEW."name"
  WHERE "symbolId" = NEW."id";

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_symbol_label_name_on_update ON "Symbol";
CREATE TRIGGER sync_symbol_label_name_on_update
AFTER UPDATE OF "name" ON "Symbol"
FOR EACH ROW
EXECUTE FUNCTION sync_symbol_label_name();


-- attach the symbol label to new trades
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
  VALUES (NEW."id", currLabelId)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attach_symbol_label_on_trade_insert ON "Trade";
CREATE TRIGGER attach_symbol_label_on_trade_insert
AFTER INSERT ON "Trade"
FOR EACH ROW
EXECUTE FUNCTION attach_symbol_label_to_trade();

-- update a trade's symbol -> update a trade's labels
CREATE OR REPLACE FUNCTION replace_trade_symbol_label()
RETURNS trigger AS $$
DECLARE
  newLabelId int;
BEGIN
  IF NEW."symbolId" = OLD."symbolId" THEN
    RETURN NEW;
  END IF;

  SELECT l."id" INTO newLabelId
  FROM "Label" l
  WHERE l."symbolId" = NEW."symbolId";

  IF newLabelId IS NULL THEN
    RAISE EXCEPTION 'Missing symbol label for symbolId=%', NEW."symbolId";
  END IF;

  DELETE FROM "trade_labels" tl
  USING "Label" l
  WHERE tl."tradeId" = NEW."id"
    AND l."id" = tl."labelId"
    AND l."symbolId" = OLD."symbolId";

  INSERT INTO "trade_labels" ("tradeId", "labelId")
  VALUES (NEW."id", newLabelId)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS replace_trade_symbol_label_on_update ON "Trade";
CREATE TRIGGER replace_trade_symbol_label_on_update
AFTER UPDATE OF "symbolId" ON "Trade"
FOR EACH ROW
EXECUTE FUNCTION replace_trade_symbol_label();


-- only one unique symbol per trade
CREATE OR REPLACE FUNCTION validate_single_symbol_label_for_trade()
RETURNS trigger AS $$
DECLARE
  labelSymbolId int;
  tradeSymbolId int;
  existing int;
BEGIN
  PERFORM pg_advisory_xact_lock(NEW."tradeId");

  SELECT l."symbolId" INTO labelSymbolId
  FROM "Label" l
  WHERE l."id" = NEW."labelId";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Label % does not exist', NEW."labelId";
  END IF;

  IF labelSymbolId IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT t."symbolId" INTO tradeSymbolId
  FROM "Trade" t
  WHERE t."id" = NEW."tradeId";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trade % does not exist', NEW."tradeId";
  END IF;

  IF labelSymbolId IS DISTINCT FROM tradeSymbolId THEN
    RAISE EXCEPTION
      'Symbol label (labelId=%) belongs to symbolId=% but trade % has symbolId=%',
      NEW."labelId", labelSymbolId, NEW."tradeId", tradeSymbolId;
  END IF;

  SELECT COUNT(*) INTO existing
  FROM "trade_labels" tl
  JOIN "Label" l ON l."id" = tl."labelId"
  WHERE tl."tradeId" = NEW."tradeId"
    AND l."symbolId" IS NOT NULL
    AND tl."labelId" <> NEW."labelId";

  IF existing > 0 THEN
    RAISE EXCEPTION 'Trade % already has a symbol label', NEW."tradeId";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_single_label_on_insert ON "trade_labels";
CREATE TRIGGER validate_single_label_on_insert
BEFORE INSERT OR UPDATE OF "tradeId", "labelId" ON "trade_labels"
FOR EACH ROW
EXECUTE FUNCTION validate_single_symbol_label_for_trade();

-- backfill trades
INSERT INTO "trade_labels" ("tradeId", "labelId")
SELECT t."id", l."id"
FROM "Trade" t
JOIN "Label" l
  ON l."symbolId" = t."symbolId"
ON CONFLICT DO NOTHING;