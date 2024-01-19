from typing import Annotated, Optional
from fastapi import FastAPI, Request, Response, status, UploadFile, Form
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

import dao
from dao import ClipNoteDTO

app = FastAPI()
templates = Jinja2Templates("templates")

app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse(
        request=request, name="index.html", context={"title": "Iridax Clipboard"}
    )


@app.get("/notes")
def get_notes():
    return dao.get_notes()

@app.post("/notes", status_code=201)  # TODO file upload
def post_note(response: Response, files: list[UploadFile], text: Annotated[Optional[str], Form()] = Form(None)):
    if not text and not files:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return "At least a text or a file must be present"

    # TODO copy files
    note = dao.add_note(dto)
    if note is None:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return "Failed to insert note in database"
    else:
        return note


@app.get("/notes/{id}")
def get_note(id: int, response: Response):
    note = dao.get_note(id)
    if note is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return "Note not found"
    else:
        return note


@app.delete("/notes/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(id: int, response: Response):
    res = dao.delete_note(id)
    if not res:
        response.status_code = status.HTTP_404_NOT_FOUND
        return "Note not found"
