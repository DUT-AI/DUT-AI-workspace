.PHONY: dev build start lint docker-up docker-down docker-build

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down
