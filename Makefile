.PHONY: install dev pages-dev migrate-local migrate-remote test lint build deploy check-limits

install:
	npm --prefix frontend install

dev:
	npm --prefix frontend run dev

pages-dev:
	npm --prefix frontend run pages:dev

migrate-local:
	npm --prefix frontend run db:migrate:local

migrate-remote:
	npm --prefix frontend run db:migrate:remote

test:
	npm --prefix frontend run test

lint:
	npm --prefix frontend run typecheck && npm --prefix frontend run lint

build:
	npm --prefix frontend run build

deploy:
	npm --prefix frontend run pages:deploy

check-limits:
	python3 scripts/validation/check_line_limits.py
