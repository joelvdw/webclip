from __future__ import annotations
from typing import List, Union
from datetime import datetime
import copy

from pydantic import BaseModel


class ClipFile(BaseModel):
    name: str
    filepath: str
    filetype: str
    size: int

class ClipNoteDTO(BaseModel):
    text: str | None
    files: List[ClipFile]

class ClipNote(BaseModel):
    id: int
    creation_date: datetime
    text: str | None
    files: List[ClipFile]

fake_list: List[ClipNote] = []
next_id = 1

def get_notes() -> List[ClipNote]:
    # must return note orber by date desc
    return fake_list

def get_note(id: int) -> ClipNote | None:
    for e in fake_list:
        if e.id == id:
            return e

def add_note(note_dto: ClipNoteDTO) -> ClipNote:
    global next_id
    global fake_list
    
    note = ClipNote(
        id = next_id,
        creation_date = datetime.now(),
        text = note_dto.text,
        files = note_dto.files
    )
    next_id += 1
    fake_list.append(note)
    return note

# Delete a note
# Return the note if found, None otherwise
def delete_note(id: int) -> ClipNote | None:
    el = None
    for e in fake_list:
        if e.id == id:
            el = e
            break
    
    if el != None:
        fake_list.remove(el)
    
    return el
