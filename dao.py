from __future__ import annotations
from typing import List
from datetime import datetime

from pymongo import MongoClient, DESCENDING
from bson.objectid import ObjectId
from pydantic import BaseModel, ValidationError

def connect_db(): 
   CONNECTION_STRING = "mongodb://localhost:27017"
   client = MongoClient(CONNECTION_STRING)
   return client['clip']['notes']

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

db_collec = connect_db()

def get_notes() -> List[ClipNote]:
    return [ClipNote.from_db_obj(n) for n in db_collec.find().sort('creation_date', DESCENDING)]

def get_note(id: str) -> ClipNote | None:
    n = db_collec.find_one({"_id": ObjectId(id)})
    return ClipNote.from_db_obj(n)

def add_note(note_dto: ClipNoteDTO) -> ClipNote:
    note = ClipNote(
        id = None,
        creation_date = datetime.now(),
        text = note_dto.text,
        files = note_dto.files
    )
    res = db_collec.insert_one(note.model_dump(exclude=set('id')))
    note.id = str(res.inserted_id)
    return note

# Delete a note
# Return the note if found, None otherwise
def delete_note(id: str) -> ClipNote | None:
    res = db_collec.find_one_and_delete({"_id": ObjectId(id)})
    return ClipNote.from_db_obj(res)
