# clait's ChatGPT API GUI

Simple GUI to interact with various ChatGPT models via API.

This was created to provide an alternative to the amazing [PatrikZeros ChatGPT API UI](https://github.com/patrikzudel/PatrikZeros-ChatGPT-API-UI) and to be easily deployable via Docker.

## How to run
### Docker (recommended)

- Install [Docker](https://docs.docker.com/get-docker/)
- Build the image with `docker build -t claits-chatgpt-gui .`
- Run the container with `docker run -p 3001:3001 -p 5000:5000 --name claits-chatgpt-gui claits-chatgpt-gui`
- Open `localhost:5000` in your browser

You can set the environment variables in the `docker-compose.yml` file or editing your running stack.

### Manual

- Install the frontend dependencies: `pnpm install`
- Install the server dependencies: `cd server && pnpm install`
- Start the server: `pnpm run server`
- Start the frontend: `pnpm run start`

When you run this manually (outside of Docker), you need to set the environment variables in `.env` by renaming `.env.example` to `.env` and editing the values as needed.

The default values will work in most setups.

## Features

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


## License

[GNU General Public License v3.0](https://choosealicense.com/licenses/gpl-3.0/)