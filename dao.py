from typing import List

from pydantic import BaseModel


class ClipNote(BaseModel):
    text: str
    files: List[str]


def get_notes() -> List[ClipNote]:
    return [
        ClipNote(text= "ceci est un coller", files= []),
        ClipNote(text= "ceci est un coller 2", files= []),
        ClipNote(text= "ce", files= ["path/to/file"]),
        ClipNote(text= "", files= ["path/to/file", "path/to/file2"]),
    ]