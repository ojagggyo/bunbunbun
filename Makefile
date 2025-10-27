default: build

build:
	git pull
	docker-compose up --build -d
	docker logs -f BUN
logs:
	docker logs -f BUN

stop:
	docker stop BUN
	docker rm BUN
	#docker stop $(docker ps -a -q --filter ancestor=keychaintest_app)
	#docker rm $(docker ps -a -q --filter ancestor=keychaintest_app)

upgrade:
	bun upgrade
