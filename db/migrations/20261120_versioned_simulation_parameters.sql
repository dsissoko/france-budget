-- Issue #22: versioned, immutable-by-convention simulation assumptions.
CREATE TABLE IF NOT EXISTS reference_versions (
  id text PRIMARY KEY,
  reference_year integer NOT NULL CHECK (reference_year BETWEEN 1900 AND 2200),
  source text NOT NULL CHECK (length(trim(source)) > 0),
  published_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','archived')),
  UNIQUE (reference_year, id)
);
CREATE TABLE IF NOT EXISTS model_parameters (
  reference_version_id text NOT NULL REFERENCES reference_versions(id),
  model_id text NOT NULL,
  parameter_key text NOT NULL,
  numeric_value numeric NOT NULL,
  unit text NOT NULL,
  PRIMARY KEY (reference_version_id, model_id, parameter_key)
);
INSERT INTO reference_versions (id,reference_year,source,status)
VALUES ('insee-apu-2025-v1',2025,'https://www.insee.fr/fr/statistiques/8997691','active')
ON CONFLICT (id) DO NOTHING;
INSERT INTO model_parameters (reference_version_id,model_id,parameter_key,numeric_value,unit) VALUES
('insee-apu-2025-v1','mechanical-v1','baselineRatePerIndex',0.025,'ratio'),
('insee-apu-2025-v1','mechanical-v1','budgetYear',2027,'year'),
('insee-apu-2025-v1','mechanical-v1','applicationYear',2027,'year'),
('insee-apu-2025-v1','mechanical-v1','horizonYear',2032,'year')
ON CONFLICT (reference_version_id,model_id,parameter_key) DO NOTHING;
