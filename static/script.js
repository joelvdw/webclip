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
    span({class: "file-icon material-symbols-outlined"}, "image"),
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


/// AJAX ///

function getNotes() {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/notes", true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200 || xhr.status === 201) {
                notes = JSON.parse(xhr.responseText);
                let container = document.querySelector("section");
                container.innerHTML = "";
                for (let i = 0; i < notes.length; i++) {
                    container.appendChild(NoteItem(notes[i]));                    
                }
            } else {
                showAlert("Error: " + xhr.responseText);
            }
        }
    };
    xhr.onerror = (e) => showAlert("Error: " + e);
    xhr.send();
}
function postNote(formData, onSuccess) {
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
    xhr.onerror = (e) => showAlert("Erreur: " + e);
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
    xhr.onerror = (e) => showAlert("Error: " + e);
    xhr.send();
}

/// UTILS ///

function showModal() {
    document.getElementById("modal").classList.add("visible");
    uploadFiles = [];
}
function hideModal() {
    document.getElementById("modal").classList.remove("visible");
    document.querySelector(".modal textarea").textContent = "";
    document.querySelector(".modal form").reset();
    document.querySelector(".modal .add-files").innerHTML = "";
    uploadFiles = [];
}

function showAlert(text) {
    let alert = document.querySelector(".alert");
    alert.firstElementChild.textContent = text;
    alert.classList.add("visible");
    
    setTimeout(() => alert.classList.remove("visible"), 3000);
}

function copyClipboard(id) {
    navigator.clipboard.writeText(notes.find(n => n.id == id).text);
}

/// FORM UPLOAD ///

let uploadFiles = [];

function openFileInput() {
    document.querySelector(".modal input[type=file]").click();
}
function takeFilesFromInput() {
    let input = document.querySelector(".modal input[type=file]");
    for (let i = 0; i < input.files.length; i++) {
        uploadFiles.push(input.files[i]);
    }
    input.value = null;

    updateFileUploadList();
}
function dropFile(ev) {
    ev.preventDefault(true);



    updateFileUploadList();
}
function removeUploadFile(name) {
    uploadFiles = uploadFiles.filter(f => f.name != name);
    updateFileUploadList();
}
function updateFileUploadList() {
    let container = document.querySelector(".modal .add-files");

    container.innerHTML = "";
    van.add(container, uploadFiles.map(f => { console.log(f); return FileUploadItem(f)}));
}
function sendForm() {
    let text = document.querySelector(".modal form textarea").value;
    if (text.trim() == "" && uploadFiles.length == 0) {
        showAlert("Du texte ou au moins un fichier doit être présent");
        return;
    }

    console.log("Send: ", text, uploadFiles);

    const formData = new FormData();
    if (text != "") {
        formData.append("text", text);
    }
    for (let i = 0; i < uploadFiles.length; i++) {
        formData.append("files", uploadFiles[i]);
    }

    console.log(formData);

    postNote(formData, (resp) => {
        hideModal();
        let cont = document.querySelector("section");
        let n = JSON.parse(resp);
        notes.unshift(n);
        cont.insertBefore(NoteItem(n), cont.firstChild);
    });
}
