const {div, p, span, article, a} = van.tags;

let notes = [];

/// FORMATING ///

function iconFromType(type) {
    if (type.startsWith("image/")) {
        if (type == "image/gif"){
            return "gif_box";
        } else {
            return "image";
        }
    } else if ([
        "application/zip",
        "application/vnd.rar",
        "application/x-tar",
        "application/gzip",
        "application/x-bzip",
        "application/x-bzip2",
        "application/x-7z-compressed"
    ].includes(type)) {
        return "folder_zip";
    } else if (type.startsWith("text/") || 
            ["application/rtf", "application/json", "application/xml"].includes(type)) {
        return "description";
    } else if (type.startsWith("audio/")) {
        return "audio_file";
    } else if (type.startsWith("video/")) {
        return "video_file";
    } else {
        return "file_present";
    }
}
function formatDate(date) {
    let options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    return new Date(date).toLocaleString('fr-CH', options);
}
function formatSize(size) {
    if (size < 1024) {
        return size + " B";
    } else if (size < (1024*1024)) {
        return Math.floor(size/1024) + " kB";
    } else if (size < (1024*1024*1024)) {
        return Math.floor(size/1024/1024) + " MB";
    } else {
        return Math.floor(size/1024/1024/1024) + " GB";
    }
}
function formatFilename(name, max = 30) {
    if (name.length > max) {
        return name.slice(0, Math.floor(max/2)) + "..." + name.slice(name.length - Math.floor(max/2), name.length);
    } else {
        return name;
    }
}

/// VanJS objects ///

const FileUploadItem = (f) => div({class: "file"}, [
    span({class: "file-icon material-symbols-outlined"}, iconFromType(f.type)),
    p(formatFilename(f.name, 20), span({class: "size"}, formatSize(f.size))),
    span({class: "material-symbols-outlined", onclick: () => removeUploadFile(f.name)}, "close")
]);

const NoteFileItem = (file) => div({class: "file"},
    span({class: "file-icon material-symbols-outlined"}, iconFromType(file.filetype)),
    p(formatFilename(file.name), span({class: "size"}, formatSize(file.size))),
    a({href: file.filepath, download: file.name}, span({class: "material-symbols-outlined"}, "download"))
);

const NoteItem = (note) => article({id: "note" + note.id},
    div({class: "data"},
        (note.text != null && note.text != "" ?
            div({class: "text"},
                p(note.text),
                span({class: "material-symbols-outlined", onclick: () => copyClipboard(note.id)}, "content_copy")
            ) : null),
        note.files.map(f => NoteFileItem(f)),
    ),
    div({class: "foot"},
        p({class: "date"}, formatDate(note.creation_date)),
        span({class: "material-symbols-outlined", onclick: () => deleteNote(note.id)}, "delete")
    )
);

/// KEYPRESS ///

document.onkeydown = function (e) {
    if (e.ctrlKey && e.key == "Enter" && document.getElementById('modal').classList.contains('visible')) {
        e.preventDefault();
        sendForm();
    }
    if (e.key == 'n'
            && !document.getElementById('modal').classList.contains('visible')
            && document.getElementById('search') !== document.activeElement) {
        e.preventDefault();
        showModal();
    }
};


/// AJAX ///

function getNotes() {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/notes", true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200 || xhr.status === 201) {
                notes = JSON.parse(xhr.responseText);
                displayNotes(notes);
            } else {
                document.querySelector("section").innerHTML = "Une erreur est survenue.";
                showAlert("Error: " + xhr.responseText);
            }
        }
    };
    xhr.onerror = (e) => {
        document.querySelector("section").innerHTML = "Une erreur est survenue.";
        showAlert("Error: " + JSON.stringify(e));
    }
    xhr.send();
}
function postNote(text, uploadFiles, onSuccess) {
    const formData = new FormData();
    if ((text ?? '') != '') {
        formData.append("text", text);
    }
    for (const element of uploadFiles) {
        formData.append("files", element);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/notes", true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200 || xhr.status === 201) {
                onSuccess(xhr.responseText);
            } else {
                showAlert("Erreur: " + xhr.responseText);
            }
        }
    };
    xhr.onerror = (e) => showAlert("Erreur: " + JSON.stringify(e));
    xhr.send(formData);
}
function deleteNote(id) {
    const xhr = new XMLHttpRequest();
    xhr.open("DELETE", "/notes/" + id, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200 || xhr.status === 204) {
                notes = notes.filter(n => n.id != id);
                document.getElementById("note" + id).remove();
            } else {
                showAlert("Error: " + xhr.responseText);
            }
        }
    };
    xhr.onerror = (e) => showAlert("Error: " + JSON.stringify(e));
    xhr.send();
}

/// UTILS ///

function clearModal() {
    document.querySelector(".modal textarea").textContent = "";
    document.querySelector(".modal form").reset();
    document.querySelector(".modal .add-files").innerHTML = "";
    uploadFiles = [];
}
function showModal() {
    document.getElementById("modal").classList.add("visible");
    clearModal();

    setTimeout(() => {
        document.querySelector(".modal textarea").focus();
    }, 100);
}
function hideModal() {
    document.getElementById("modal").classList.remove("visible");
    clearModal();
}

function showAlert(text, type = 'error') {
    let alert = document.querySelector(".alert");
    alert.firstElementChild.textContent = text;
    alert.classList.add("visible");
    if (type === 'error') {
        alert.classList.remove('success');
        alert.classList.add('error');
    } else if (type === 'success') {
        alert.classList.remove('error');
        alert.classList.add('success');
    }
    
    setTimeout(() => alert.classList.remove("visible"), 3000);
}

function displayNotes(notes) {
    let container = document.querySelector("section");
    container.innerHTML = "";
    for (const note of notes) {
        container.appendChild(NoteItem(note));                    
    }
}

function copyClipboard(id) {
    navigator.clipboard.writeText(notes.find(n => n.id == id).text);
    showAlert("Copié", 'success')
}

/// SEARCH ///

function search() {
    let token = document.getElementById('search').value;
    let regex = new RegExp(token, 'i');
    let filtered = notes.filter(n => 
        n.text != null && regex.test(n.text)
        || n.files.some(f => regex.test(f.name))
    );

    filtered.sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date));
    displayNotes(filtered);
}

/// DRAG DROP ///

function modalDragEnter() {
    document.getElementById('dropzone-modal').classList.add('visible');
}
function modalDragLeave() {
    document.getElementById('dropzone-modal').classList.remove('visible');
}

function dropFileModal(ev) {
    ev.preventDefault(true);
    ev.stopPropagation();
    document.getElementById('dropzone-modal').classList.remove('visible');

    if (ev.dataTransfer.items) {
        [...ev.dataTransfer.items].forEach((item, _i) => {
            if (item.kind === "file") {
                if (item.webkitGetAsEntry().isFile) {
                    const file = item.getAsFile();
                    uploadFiles.push(file);
                } else {
                    showAlert("Les dossiers ne sont pas supportés");
                }
            }
        });
    } else {
        [...ev.dataTransfer.files].forEach((file, _i) => {
            uploadFiles.push(file);
        });
    }

    updateFileUploadList();
}

function fullDragEnter() {
    if (!document.getElementById('modal').classList.contains('visible')) {
        document.getElementById('dropzone-full').classList.add('visible');
    }
}
function fullDragLeave() {
    document.getElementById('dropzone-full').classList.remove('visible');
}

function dropFileFull(ev) {
    ev.preventDefault(true);
    ev.stopPropagation();
    document.getElementById('dropzone-full').classList.remove('visible');

    let files = [];

    if (ev.dataTransfer.items) {
        [...ev.dataTransfer.items].forEach((item, _i) => {
            if (item.kind === "file") {
                if (item.webkitGetAsEntry().isFile) {
                    const file = item.getAsFile();
                    files.push(file);
                } else {
                    showAlert("Les dossiers ne sont pas supportés");
                }
            }
        });
    } else {
        [...ev.dataTransfer.files].forEach((file, _i) => {
            files.push(file);
        });
    }

    if (files.length != 0) {
        postNote(undefined, files, onNoteCreated);
    }
}

function dragOverHandler(ev) {
    ev.preventDefault();
} 

/// FORM UPLOAD ///

let uploadFiles = [];

function openFileInput() {
    document.querySelector(".modal input[type=file]").click();
}
function takeFilesFromInput() {
    let input = document.querySelector(".modal input[type=file]");
    for (const element of input.files) {
        uploadFiles.push(element);
    }
    input.value = null;

    updateFileUploadList();
}
function removeUploadFile(name) {
    uploadFiles = uploadFiles.filter(f => f.name != name);
    updateFileUploadList();
}
function updateFileUploadList() {
    let container = document.querySelector(".modal .add-files");

    container.innerHTML = "";
    van.add(container, uploadFiles.map(f => FileUploadItem(f)));
}
function sendForm() {
    let text = document.querySelector(".modal form textarea").value;
    if (text.trim() == "" && uploadFiles.length == 0) {
        showAlert("Du texte ou au moins un fichier doit être présent");
        return;
    }

    postNote(text, uploadFiles, onNoteCreated);
}

function onNoteCreated(note) {
    hideModal();
    let cont = document.querySelector("section");
    let n = JSON.parse(note);
    notes.unshift(n);
    cont.insertBefore(NoteItem(n), cont.firstChild);
    showAlert("Note créée", 'success');
}
