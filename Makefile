DOCKER_COMPOSE=docker-compose
DOCKER_COMPOSE_FILE=docker-compose.yml
PROJECT_NAME=ft_transcendence

all:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up --build -d

logs:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs

up:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up

daemon:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d

down:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down

clean: down
	docker system prune -f --all

fclean: clean
	docker volume rm $$(docker volume ls -q)

re: down all

.PHONY:	all up daemon down clean fclean re
