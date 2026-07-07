-- Colonne tsvector générée automatiquement à chaque insert/update
ALTER TABLE decisions
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('french',
    coalesce(title, '') || ' ' ||
    coalesce(decision_text, '') || ' ' ||
    coalesce(context, '') || ' ' ||
    coalesce(rationale, '') || ' ' ||
    coalesce(decider, '')
  )
) STORED;

CREATE INDEX decisions_search_vector_idx ON decisions USING GIN (search_vector);

-- Recherche plein texte avec score de pertinence, filtrée par org_id
CREATE OR REPLACE FUNCTION search_decisions(
  query_text text,
  p_org_id uuid,
  p_limit int DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  org_id uuid,
  title text,
  status decision_status,
  context text,
  options_json jsonb,
  decision_text text,
  rationale text,
  decider text,
  stakeholders text[],
  source_raw text,
  tags text[],
  decided_at timestamptz,
  created_at timestamptz,
  created_by uuid,
  rank real
) AS $$
DECLARE
  tsq tsquery;
BEGIN
  tsq := websearch_to_tsquery('french', query_text);

  RETURN QUERY
  SELECT
    d.id, d.org_id, d.title, d.status,
    d.context, d.options_json, d.decision_text, d.rationale,
    d.decider, d.stakeholders, d.source_raw, d.tags,
    d.decided_at, d.created_at, d.created_by,
    ts_rank(d.search_vector, tsq) AS rank
  FROM decisions d
  WHERE d.org_id = p_org_id
    AND d.search_vector @@ tsq
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
