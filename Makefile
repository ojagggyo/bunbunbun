default: build

build:
	git pull
	docker-compose up --build
