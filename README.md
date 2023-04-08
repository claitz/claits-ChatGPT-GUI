# clait's ChatGPT API GUI

Simple GUI to interact with various ChatGPT models via API.

This was created to provide an alternative to the amazing [PatrikZeros ChatGPT API UI](https://github.com/patrikzudel/PatrikZeros-ChatGPT-API-UI) and to be easily deployable via Docker.

# Features

- Model selection
- Multiple chat sessions
- Locally stored chat history
- Image generation with persistent local storage
- `.env` configuration
- Websocket server

Text request with response streaming:

![Text Request](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZDczZGUwYzNkZDMwODhmMTAxOGFlNzAyMzJjZmE1ZjllOTg5OTQzZSZjdD1n/GhhmBwQsWyGhJnxSDA/giphy.gif)


Image request:

![Image Request](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOTlmZWZmZjAyYzcxYWRjZDExMzJlZDUxNjc5NGEzN2QxNzlkMmJmYiZjdD1n/F46Uq08HDhEMLgmF1P/giphy.gif)


# How to run
## Docker (recommended)

[![Build and Push Docker Image](https://github.com/claitz/claits-ChatGPT-GUI/actions/workflows/build-push-docker.yml/badge.svg)](https://hub.docker.com/r/claitz/claits-chatgpt-gui)
[![Docker Pulls](https://img.shields.io/docker/pulls/claitz/claits-chatgpt-gui)](https://hub.docker.com/r/claitz/claits-chatgpt-gui)
[![Docker Image Size (tag)](https://img.shields.io/docker/image-size/claitz/claits-chatgpt-gui/latest)](https://hub.docker.com/r/claitz/claits-chatgpt-gui)


A prebuilt Docker image is available on [Docker Hub](https://hub.docker.com/r/claitz/claits-chatgpt-gui).

- Install [Docker](https://docs.docker.com/get-docker/)
- Run `docker run -p 3001:3001 -p 5000:5000 --name claits-chatgpt-gui claitz/claits-chatgpt-gui`
- Open `localhost:5000` in your browser

### Build and run the image yourself

You can also clone and build the image yourself:

- Clone this repository
- Build the image with `docker build -t claits-chatgpt-gui .`
- Run the container with one of the following commands:
  - `docker run -p 3001:3001 -p 5000:5000 --name claits-chatgpt-gui claits-chatgpt-gui` (without Docker Compose)
  - `docker-compose up -d` (with Docker Compose)
- Open `localhost:5000` in your browser

You can set the environment variables in the `docker-compose.yml` file or editing your running stack.

### Manually

- Install the frontend dependencies: `pnpm install`
- Install the server dependencies: `cd server && pnpm install`
- Start the server: `pnpm run server`
- Start the frontend: `pnpm run start`

When you run this manually (outside of Docker), you need to set the environment variables in `.env` by renaming `.env.example` to `.env` and editing the values as needed.

The default values will work in most setups.

# License

[GNU General Public License v3.0](https://choosealicense.com/licenses/gpl-3.0/)