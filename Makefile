default: build

build:
	git pull
	docker-compose up --build -d
	docker logs -f keychaintest_app_1

logs:
	docker logs -f keychaintest_app_1

stop:
	docker stop keychaintest_app_1
	docker rm keychaintest_app_1
	#docker stop $(docker ps -a -q --filter ancestor=keychaintest_app)
	#docker rm $(docker ps -a -q --filter ancestor=keychaintest_app)

upgrade:
	bun upgrade
