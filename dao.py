from __future__ import annotations
from typing import List, Union
from datetime import datetime
import copy

from pydantic import BaseModel


class ClipFile(BaseModel):
    name: str
    filename: str

class ClipNoteDTO(BaseModel):
    text: str
    files: List[ClipFile]
    type: str

class ClipNote(BaseModel):
    id: int
    creation_date: datetime
    text: str
    files: List[str]

fake_list: List[ClipNote] = []
next_id = 1

def get_notes() -> List[ClipNote]:
    return fake_list

def get_note(id: int) -> ClipNote | None:
    for e in fake_list:
        if e.id == id:
            return e

def add_note(noteDTO: ClipNoteDTO) -> bool:
    global next_id
    note = ClipNote(
        id = next_id,
        creation_date = datetime.now(),
        text = noteDTO.text,
        files = noteDTO.files
    )
    next_id += 1
    fake_list.append(note)
    return note

# Delete a note
# Return true if found, false otherwise
def delete_note(id: int) -> bool:
    el = None
    for e in fake_list:
        if e.id == id:
            el = e
            break
    
    if el != None:
        fake_list.remove(el)
    
    return el != None
