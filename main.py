from fastapi import FastAPI
from fastapi.templating import Jinja2Templates

import dao
from dao import ClipNote

app = FastAPI()
templates = Jinja2Templates("templates")

@app.get("/")
def index():
    return templates.TemplateResponse("index.html")


@app.get("/notes")
def get_notes():
    return dao.get_notes()