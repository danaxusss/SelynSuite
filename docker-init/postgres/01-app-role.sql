-- Selyn Suite — local Postgres bootstrap.
-- Runs once when the docker volume is empty.
--
-- Cardinal Rule R1: the app role must NOT be a superuser, otherwise
-- Postgres silently bypasses Row-Level Security. We create `selyn` as
-- a plain role that owns the application databases.

CREATE ROLE selyn WITH LOGIN PASSWORD 'selyn_dev_password' CREATEDB;

CREATE DATABASE selyn_dev OWNER selyn;
CREATE DATABASE selyn_test OWNER selyn;

-- Grants on the public schema (Postgres 15+ revokes them by default).
\connect selyn_dev
GRANT ALL ON SCHEMA public TO selyn;

\connect selyn_test
GRANT ALL ON SCHEMA public TO selyn;
