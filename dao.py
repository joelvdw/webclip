from __future__ import annotations
from typing import List
from datetime import datetime
from hashlib import sha1
from os import environ as env

from pymongo import MongoClient, DESCENDING
from bson.objectid import ObjectId
from pydantic import BaseModel
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.errors import ServerSelectionTimeoutError

## DB access
MONGO_HOST = env.get('CLIP_MONGO_HOST') or "localhost"
MONGO_PORT = env.get('CLIP_MONGO_PORT') or 27017

## Models

class ClipFile(BaseModel):
    name: str
    filepath: str
    filetype: str
    size: int

class ClipNoteDTO(BaseModel):
    text: str | None
    pinned: bool | None
    files: List[ClipFile] | None

class ClipNote(BaseModel):
    id: str | None
    creation_date: datetime
    text: str | None
    pinned: bool
    files: List[ClipFile]

    @staticmethod
    def from_db_obj(db_obj) -> ClipNote:
        return ClipNote(
            id=str(db_obj['_id']),
            creation_date=db_obj['creation_date'],
            text=db_obj['text'],
            pinned=db_obj['pinned'],
            files=[ClipFile(**f) for f in db_obj['files']]
        )

## DAO methods
class DAO:
    db: Database | None = None

    def connect_db(self): 
        CONNECTION_STRING = f"mongodb://{MONGO_HOST}:{MONGO_PORT}"
        print("Connecting to mongo server:", CONNECTION_STRING)
        client = MongoClient(CONNECTION_STRING, serverSelectionTimeoutMS=10000)
        try:
            print("Mongo server: v", client.server_info()['version'], sep='')
        except ServerSelectionTimeoutError as e:
            print("Mongo server error", e)
            exit(1)
        self.db = client['clip']

    # Get the collection of the given user
    def get_collec(self, user: str) -> Collection:
        if self.db is None:
            raise ConnectionError('DB must be connected before used')
        else:
            return self.db[sha1(user.encode()).hexdigest()]

    def get_notes(self, user: str) -> List[ClipNote]:
        return [ClipNote.from_db_obj(n) for n in self.get_collec(user).find().sort('creation_date', DESCENDING)]

    def get_note(self, id_note: str, user: str) -> ClipNote | None:
        n = self.get_collec(user).find_one({"_id": ObjectId(id_note)})
        return ClipNote.from_db_obj(n)

    def add_note(self, note_dto: ClipNoteDTO, user: str) -> ClipNote:
        note = ClipNote(
            id = None,
            creation_date = datetime.now(),
            text = note_dto.text,
            pinned = False,
            files = note_dto.files or []
        )
        res = self.get_collec(user).insert_one(note.model_dump(exclude=set('id')))
        note.id = str(res.inserted_id)
        return note

    def edit_note(self, id_note: str, note_dto: ClipNoteDTO, user: str) -> ClipNote | None:
        note = self.get_note(id_note, user)
        print(note)
        if note is None:
            return None
        
        if note_dto.text is not None:
            note.text = note_dto.text
        if note_dto.pinned is not None:
            note.pinned = note_dto.pinned
        if note_dto.files is not None:
            note.files = note_dto.files

        self.get_collec(user).replace_one({"_id": ObjectId(id_note)}, note.model_dump(exclude=set('id')))
        return note

    # Delete a note
    # Return the note if found, None otherwise
    def delete_note(self, id: str, user: str) -> ClipNote | None:
        res = self.get_collec(user).find_one_and_delete({"_id": ObjectId(id)})
        return ClipNote.from_db_obj(res)
