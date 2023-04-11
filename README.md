# clait's ChatGPT API GUI

Simple GUI to interact with various ChatGPT models via API.

This was created to provide an alternative to the amazing [PatrikZeros ChatGPT API UI](https://github.com/patrikzudel/PatrikZeros-ChatGPT-API-UI) and to be easily deployable via Docker.

# Features

- Model selection
- Multiple chat sessions
- Chat history stored to MongoDB
- Image generation with persistent local storage
- `.env` configuration
- Websocket server
- Streamed bot responses

Text request with response streaming:

![Text Request](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZDczZGUwYzNkZDMwODhmMTAxOGFlNzAyMzJjZmE1ZjllOTg5OTQzZSZjdD1n/GhhmBwQsWyGhJnxSDA/giphy.gif)


Image request:

![Image Request](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOTlmZWZmZjAyYzcxYWRjZDExMzJlZDUxNjc5NGEzN2QxNzlkMmJmYiZjdD1n/F46Uq08HDhEMLgmF1P/giphy.gif)


# How to run
## Docker (recommended)

[![Build and Push Docker Image](https://github.com/claitz/claits-ChatGPT-GUI/actions/workflows/build-push-docker.yml/badge.svg)](https://hub.docker.com/r/claitz/claits-chatgpt-gui)
[![Docker Pulls](https://img.shields.io/docker/pulls/claitz/claits-chatgpt-gui)](https://hub.docker.com/r/claitz/claits-chatgpt-gui)
[![Docker Image Size (tag)](https://img.shields.io/docker/image-size/claitz/claits-chatgpt-gui/latest)](https://hub.docker.com/r/claitz/claits-chatgpt-gui)


A prebuilt Docker image is available on [Docker Hub](https://hub.docker.com/r/claitz/claits-chatgpt-gui) and a docker-compose file is available as example in this repository.

- Install [Docker](https://docs.docker.com/get-docker/)
- Run `docker compose up -d` in the root directory of this repository or wherever you have the `docker-compose.yml` file
- Open `localhost:5000` in your browser

This will start the stack (app + MongoDB) and expose the app on port 5000. You can change the configuration in the `docker-compose.yml` file.

### Manually

- Install the frontend dependencies: `pnpm install`
- Install the server dependencies: `cd server && pnpm install`
- Start the server: `pnpm run server`
- Start the frontend: `pnpm run start`

#### Requirements
Running this locally requires a MongoDB instance to be running.


This and all other configuration options can be set in the `.env` files.
You'll need to set the environment variables in `.env` by renaming `.env.example` to `.env` and editing the values as needed.

There are **TWO** `.env` files, one in the root directory and one in the `/server` directory - one for the frontend and one for the backend. Both need to be configured.

# License

[GNU General Public License v3.0](https://choosealicense.com/licenses/gpl-3.0/)