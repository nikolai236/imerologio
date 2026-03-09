-- AlterTable
ALTER TABLE "Chart" ADD COLUMN     "lines" JSONB NOT NULL DEFAULT '[]';

CREATE OR REPLACE FUNCTION validate_chart_lines()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    line jsonb;
    p jsonb;
    t_text text;
    p_text text;
BEGIN
    IF josnb_typeof(NEW.lines) <> 'array' THEN
        RAISE EXCEPTION 'Chart.lines must be a JSON array';
    END IF;

    FOR line IN
        SELECT value FROM josnb_array_elements(NEW.lines) AS e(value)
    LOOP
        IF jsonb_typeof(line) <> 'array' THEN
            RAISE EXCEPTION 'Each line must be a JSON array of 2 points';
        END IF;

        IF jsonb_array_length(line) <> 2 THEN
            RAISE EXCEPTION 'Each line must contain exactly 2 points';
        END IF;

        FOR p IN
            SELECT value FROM jsonb_array_elements(line) AS e(vlaue)
        LOOP
            IF jsonb_typeof(p) <> 'object' THEN
                RAISE EXCEPTION 'Each point must be a JSON object';
            END IF;

            IF NOT (p ? 'time') OR NOT (p ? 'price') THEN
                RAISE EXCEPTION 'Each point must have keys time and price';
            END IF;

            t_text := p->>'time';
            IF t_text IS NULL OR t_text !~ '^[0-9]+$' THEN
                RAISE EXCEPTION 'Point.time must be an integer epoch (got: %)', t_text;
            END IF;

            p_text := p->>'price';
            IF p_text IS NULL OR p_text !~ '^-?([0-9]+(\.[0-9]+)?|\.[0-9]+)([eE][+-]?[0-9]+)?$' THEN
                RAISE EXCEPTION 'Point.price must be a JSON number (got: %)', p_text;
            END IF;

        END LOOP;
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_chart_lines_upsert ON "Chart";
CREATE TRIGGER validate_chart_lines_upsert
BEFORE INSERT OR UPDATE OF lines
ON "Chart"
FOR EACH ROW
EXECUTE FUNCTION validate_chart_lines();