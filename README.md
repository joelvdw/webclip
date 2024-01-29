# Webclip - Clipboard Website

Webclip is a lightweight website providing an easy-to-use shared clipboard. It accepts text pasting and files dropping.

## Functionnalities

The website allows to enter or paste text in a box as well as browsing and dropping files. Once sent, the data will be available to copy/download on the website.

A search bar allows full-text search in the notes and file names.

Files can be dropped directely on the main page allowing instant sharing. They will be sent without having to do aynthing else.

User specific content if accessed through a reverse-proxy with auth. If the reverse proxy forwards the username in the headers, the website can retrieve and use the name to provide user specific content. If not connected, the client is registered as a shared default user.

Keyboard shortcuts can be used for easier usage.
- `N`: Open the new note modal
- `S`: Focus the search input
- `Ctrl+Enter`: Send the note
- `Esc`: Cancel the current note creation

## Dependencies

Webclip uses `Python` >= 3.10 with `FastAPI` for the backend, with a `MongoDB` database to store the notes.

The frontend uses HTML/CSS/JS, with the [`VanJS`](https://vanjs.org/]) library.

## Install

### Local

- Install `MongoDB`

  https://www.mongodb.com/docs/manual/tutorial/install-on-linux/

- Install the requirements
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  pip3 install -r requirements.txt
  ```

### Docker

A Dockerfile is provided to build a container for Webclip.

```bash
docker build -t webclip --build-arg CLIP_PORT=8000
```

## Run

### Developement

```bash
uvicorn main:app --reload
```

### Production

```bash
uvicorn main:app --host 0.0.0.0 --port 80
```

### Docker

```bash
docker run -v mongo_data:/data --name webclip-mongo -p 27017:27017 --rm -d mongo:6
docker run -v uploads:/uploads --name webclip -p 8000:8000 --rm -d webclip
```

### Docker Compose

```bash
docker compose up -d
```

## ENV Variables

Various environment variables are used to allow customization.
| Name                 | Description              | Accepted Values | Default Value |
|----------------------|--------------------------|-----------------|--------------|
| CLIP_USE_USER_HEADER | Use the user forwarded by the reverse proxy to have user specific clipboard | `yes`/`no` | no |
| CLIP_USER_HEADER     | Forwarded user header, only useful when `CLIP_USE_USER_HEADER` is set to `yes` | <i>string</i> | X-WebAuth-User |
| CLIP_UPLOAD_DIR      | Directory where the uploaded files are saved | <i>path</i> | /uploads |
| CLIP_HOST            | Host used in URL to access the website, will be used to configure CORS. If not provided, only localhost is authorized. | <i>string</i> | <i>None</i> |
| CLIP_PORT            | TCP port used. This value only is informative for the website and the CORS. To effectively change the listened port, use the build ARG in docker or use `--port` when running uvicorn. | 1 - 65535 | 8000 |
| CLIP_TITLE           | Title of the website, displayed in the nav and as the tab name | <i>string</i> | Webclip |

## Build ARG for Docker

| Name                 | Description              | Accepted Values | Default Value |
|----------------------|--------------------------|-----------------|--------------|
| CLIP_PORT   | TCP port to listen to. Will also be passed as a ENV var to the container to avoid having to provide it a second time. | 1 - 65535 | 8000 |
