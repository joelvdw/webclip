FROM python:3.10-bullseye

ARG CLIP_UID=1001
ARG CLIP_USER_HEADER="X-WebAuth-User"
ARG CLIP_UPLOAD_DIR="/uploads"
ARG CLIP_HOST="clip.iridax.ch"
ARG CLIP_PORT=""
ARG CLIP_MONGO_HOST="localhost"
ARG CLIP_MONGO_PORT="27017"

COPY . /app/
WORKDIR /app

RUN pip3 install -r requirements.txt
RUN mkdir -p ${CLIP_UPLOAD_DIR}
RUN chmod 700 ${CLIP_UPLOAD_DIR}
RUN chown ${CLIP_UID}:${CLIP_UID} ${CLIP_UPLOAD_DIR}

USER ${CLIP_UID}:${CLIP_UID}

EXPOSE ${CLIP_PORT}

CMD ["uvicorn", "main:app"] # TODO set port to listen
