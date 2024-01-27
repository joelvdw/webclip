FROM python:3.10-bullseye

ARG CLIP_PORT=8000

COPY ./requirements.txt /app/
WORKDIR /app

RUN pip3 install -r requirements.txt

COPY . /app/

EXPOSE ${CLIP_PORT}

ENV CLIP_PORT=${CLIP_PORT}

CMD python -m uvicorn main:app --host 0.0.0.0 --port "${CLIP_PORT}"
