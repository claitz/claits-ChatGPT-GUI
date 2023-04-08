# clait's ChatGPT API GUI

Simple GUI to interact with various ChatGPT models via API.

This was created to provide an alternative to the amazing [PatrikZeros ChatGPT API UI](https://github.com/patrikzudel/PatrikZeros-ChatGPT-API-UI) and to be easily deployable via Docker.

## How to run
### Docker (recommended)

- Install [Docker](https://docs.docker.com/get-docker/)
- Build the image with `docker build -t claits-chatgpt-gui .`
- Run the container with `docker run -p 3001:3001 -p 5000:5000 --name claits-chatgpt-gui claits-chatgpt-gui`
- Open `localhost:5000` in your browser

### Manual

- Install the frontend dependencies: `pnpm install`
- Install the server dependencies: `cd server && pnpm install`
- Start the server: `pnpm run server`
- Start the frontend: `pnpm run start`

## Features

- Model selection
- Multiple chat sessions
- Locally stored chat history
- Image generation
- `.env` configuration
- Websocket server
- ~~Light/dark mode toggle [TBD]~~

Text request with response streaming:

![Text Request](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZDczZGUwYzNkZDMwODhmMTAxOGFlNzAyMzJjZmE1ZjllOTg5OTQzZSZjdD1n/GhhmBwQsWyGhJnxSDA/giphy.gif)


Image request:

![Image Request](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOTlmZWZmZjAyYzcxYWRjZDExMzJlZDUxNjc5NGEzN2QxNzlkMmJmYiZjdD1n/F46Uq08HDhEMLgmF1P/giphy.gif)

## .env

All configuration is done via `.env` file, although default values are provided as fallbacks.
The following variables are available:

- `WATCHPACK_POLLING=true` - Enable polling for file changes
- `REACT_APP_WS_PORT=3001` - Port for the websocket server
- `REACT_APP_WS_HOST=localhost` - Host for the websocket server
- `REACT_APP_IMAGE_REQUEST=/imagine` - Command for image generation

## License

[GNU General Public License v3.0](https://choosealicense.com/licenses/gpl-3.0/)