from __future__ import annotations
from typing import List
from datetime import datetime
from hashlib import sha1
from os import environ as env

from pymongo import MongoClient, DESCENDING
from bson.objectid import ObjectId
from pydantic import BaseModel, ValidationError
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.errors import ServerSelectionTimeoutError

## DB access
MONGO_HOST = env.get('CLIP_MONGO_HOST') or "localhost"
MONGO_PORT = env.get('CLIP_MONGO_PORT') or 27017

def connect_db() -> Database: 
    CONNECTION_STRING = f"mongodb://{MONGO_HOST}:{MONGO_PORT}"
    print("Connecting to mongo server:", CONNECTION_STRING)
    client = MongoClient(CONNECTION_STRING, serverSelectionTimeoutMS=10000)
    try:
        print("Mongo server: v", client.server_info()['version'], sep='')
    except ServerSelectionTimeoutError as e:
        print("Mongo server error", e)
        exit(1)
    return client['clip']

db = connect_db()

# Get the collection of the given user
def get_collec(user: str) -> Collection:
    global db
    return db[sha1(user.encode()).hexdigest()]

## Models

class ClipFile(BaseModel):
    name: str
    filepath: str
    filetype: str
    size: int

class ClipNoteDTO(BaseModel):
    text: str | None
    files: List[ClipFile]

class ClipNote(BaseModel):
    id: str | None
    creation_date: datetime
    text: str | None
    files: List[ClipFile]

    @staticmethod
    def from_db_obj(db_obj) -> ClipNote:
        return ClipNote(
            id=str(db_obj['_id']),
            creation_date=db_obj['creation_date'],
            text=db_obj['text'],
            files=[ClipFile(**f) for f in db_obj['files']]
        )

## DAO methods

def get_notes(user: str) -> List[ClipNote]:
    return [ClipNote.from_db_obj(n) for n in get_collec(user).find().sort('creation_date', DESCENDING)]

def get_note(id: str, user: str) -> ClipNote | None:
    n = get_collec(user).find_one({"_id": ObjectId(id)})
    return ClipNote.from_db_obj(n)

def add_note(note_dto: ClipNoteDTO, user: str) -> ClipNote:
    note = ClipNote(
        id = None,
        creation_date = datetime.now(),
        text = note_dto.text,
        files = note_dto.files
    )
    res = get_collec(user).insert_one(note.model_dump(exclude=set('id')))
    note.id = str(res.inserted_id)
    return note

# Delete a note
# Return the note if found, None otherwise
def delete_note(id: str, user: str) -> ClipNote | None:
    res = get_collec(user).find_one_and_delete({"_id": ObjectId(id)})
    return ClipNote.from_db_obj(res)
