# Clipboard website

## Install

```bash
pip install -r requirements.txt
```

## Run

### Developement

```bash
uvicorn main:app --reload
```

### Production

```bash
uvicorn main:app
```

(Use `--root-path PATH` if the website is not at the domain root)

# TODO add favicon
# TODO use env var for mongo hots and port, and use_user_header

  - "traefik.http.middlewares.my-auth.basicauth.headerField=X-WebAuth-User"

# TODO store mongo data and uploads in /data