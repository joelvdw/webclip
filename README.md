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