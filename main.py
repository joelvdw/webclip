from typing import Annotated, Optional, List
from fastapi import FastAPI, Request, Response, status, UploadFile, File, Form
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import uuid, os
from copy import copy

import dao
from dao import ClipNoteDTO, ClipFile

USER_HEADER = 'X-WebAuth-User'
UPLOAD_DIR = "/uploads"
HOST = "https://clip.iridax.ch"

origins = [
    HOST,
    "http://localhost:8000",
]
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
templates = Jinja2Templates("templates")

app.mount("/static", StaticFiles(directory="static"), name="static")

upload_path = Path(UPLOAD_DIR)
if not upload_path.exists():
    os.mkdir(upload_path)
app.mount("/uploads", StaticFiles(directory=upload_path), name="uploads")

# Get the user in the request headers, or return a default user if not present
def get_user(request: Request) -> str:
    return request.headers.get(USER_HEADER) or '__default_user__'


@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse(
        request=request, name="index.html", context={
            'title': "Iridax Clipboard",
            'user': get_user(request)
        }
    )


@app.get("/notes")
def get_notes(request: Request):
    return dao.get_notes(get_user(request))

def remove_upload(name: str):
    try:
        os.remove(upload_path.joinpath("./" + name))
    except Exception:
        pass

def remove_uploads(names: List[str]):
    for name in names:
        remove_upload(name)

def filter_files(files: List[UploadFile]) -> List[UploadFile]:
    return [f for f in files if f.filename or f.size]

def copy_files(files: list[UploadFile]) -> List[str]:
    names = []
    for f in files:
        name = str(uuid.uuid4())
        path = upload_path.joinpath("./" + name)
        try:
            with path.open("wb+") as buffer:
                while content := f.file.read(2048):
                    buffer.write(content)
                buffer.flush()
            names.append(name)
        except Exception as e:
            print(e)
            break
        finally:
            f.file.close()

    return names


@app.post("/notes", status_code=201)
def post_note(
    request: Request,
    response: Response,
    files: Annotated[List[UploadFile], [File()]] = copy([]),
    text: Optional[str] = Form(None)
):
    if not text and not files:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return "At least a text or a file must be present"

    if files is None:
        files = []
    files = filter_files(files)

    saved_files = copy_files(files)
    if len(saved_files) != len(files):
        remove_uploads(saved_files)
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return "Failed to save files"
    
    dto = ClipNoteDTO(
        text=text,
        files=[ClipFile(
            name=uf.filename if uf.filename else "File",
            filepath="/uploads/" + name,
            filetype=uf.content_type if uf.content_type else "application/octet-stream",
            size=uf.size if uf.size is not None else -1
        ) for (uf, name) in zip(files, saved_files)]
    )
    
    note = dao.add_note(dto, get_user(request))
    if note is None:
        remove_uploads(saved_files)
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return "Failed to insert note in database"
    else:
        return note


@app.get("/notes/{id_note}")
def get_note(id_note: str, request: Request, response: Response):
    note = dao.get_note(id_note, get_user(request))
    if note is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return "Note not found"
    else:
        return note


@app.delete("/notes/{id_note}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(id_note: str, request: Request, response: Response):
    res = dao.delete_note(id_note, get_user(request))
    if not res:
        response.status_code = status.HTTP_404_NOT_FOUND
        return "Note not found"
