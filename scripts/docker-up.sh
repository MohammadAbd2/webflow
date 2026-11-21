#!/bin/sh
set -eu

# Reuse the existing named volumes when present, but make a fresh checkout start cleanly too.
docker volume inspect webflow_mysql_data >/dev/null 2>&1 || docker volume create webflow_mysql_data >/dev/null
docker volume inspect webflow_contracts_data >/dev/null 2>&1 || docker volume create webflow_contracts_data >/dev/null
docker compose up --build -d --wait
