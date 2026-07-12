.PHONY: build run dev install

ENV_FILE := $(HOME)/.config/vinlager/env

install:
	npm install

build:
	npm run build

run:
	@set -a; if [ -f $(ENV_FILE) ]; then . $(ENV_FILE); fi; set +a; npm start

dev:
	@set -a; if [ -f $(ENV_FILE) ]; then . $(ENV_FILE); fi; set +a; npm run dev
