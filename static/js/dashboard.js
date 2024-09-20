document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('document');
    const uploadButton = document.getElementById('upload-button');
    const selectedFilesDiv = document.getElementById('selected-files');
    const generatePromsBtn = document.getElementById('generate-proms');
    const promsList = document.getElementById('proms-list');
    const addPromForm = document.getElementById('add-prom-form');
    const addPromContainer = document.getElementById('add-prom-container');
    const showAddPromBtn = document.getElementById('show-add-prom');
    const dashboardMain = document.querySelector('.dashboard-main');
    
    const messageContainer = document.createElement('div');
    messageContainer.className = 'alert';
    messageContainer.style.display = 'none';
    document.querySelector('.dashboard-container').prepend(messageContainer);

    function showMessage(message, isError = false) {
        messageContainer.textContent = message;
        messageContainer.className = `alert ${isError ? 'alert-danger' : 'alert-success'}`;
        messageContainer.style.display = 'block';
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }

    function fetchProms() {
        fetch('/dashboard/get_proms')
            .then(response => response.json())
            .then(proms => {
                console.log('Fetched PROMs:', proms);
                promsList.innerHTML = '';
                proms.forEach(prom => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item';
                    li.innerHTML = `
                        <span>${prom.content}</span>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary edit-prom" data-id="${prom.id}">Edit</button>
                            <button class="btn btn-sm btn-outline-danger delete-prom" data-id="${prom.id}">Delete</button>
                        </div>
                    `;
                    promsList.appendChild(li);
                });
                promsList.style.display = 'block';
                addPromContainer.style.display = 'block';
            })
            .catch(error => {
                console.error('Error fetching PROMs:', error);
            });
    }

    function addDocumentToList(doc) {
        let documentsSection = document.getElementById('documents-section');
        let documentsList = document.getElementById('documents-list');

        if (!documentsSection) {
            documentsSection = document.createElement('section');
            documentsSection.id = 'documents-section';
            documentsSection.className = 'dashboard-section';
            documentsSection.innerHTML = '<h2>Uploaded Documents</h2>';
            documentsList = document.createElement('ul');
            documentsList.id = 'documents-list';
            documentsList.className = 'documents-list';
            documentsSection.appendChild(documentsList);

            // Insert the new section after the upload section
            const uploadSection = document.querySelector('.dashboard-section');
            uploadSection.parentNode.insertBefore(documentsSection, uploadSection.nextSibling);
        }

        const li = document.createElement('li');
        li.className = 'document-item';
        li.innerHTML = `
            <span><i class="fas fa-file-alt"></i> ${doc.filename}</span>
            <button class="btn btn-danger btn-sm delete-document" data-id="${doc.id}">
                <i class="fas fa-trash"></i> Delete
            </button>
        `;
        documentsList.appendChild(li);
    }

    function deleteDocument(id) {
        fetch(`/dashboard/delete_document/${id}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    const documentItem = document.querySelector(`.delete-document[data-id="${id}"]`).closest('.document-item');
                    documentItem.remove();
                    showMessage('Document deleted successfully');

                    // Check if there are no more documents
                    const documentsList = document.getElementById('documents-list');
                    if (documentsList && documentsList.children.length === 0) {
                        const documentsSection = document.getElementById('documents-section');
                        documentsSection.remove();
                    }
                } else {
                    showMessage(data.message || 'Failed to delete document', true);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('Failed to delete document', true);
            });
    }

    fileInput.addEventListener('change', function() {
        selectedFilesDiv.innerHTML = '';
        uploadButton.style.display = this.files.length > 0 ? 'inline-block' : 'none';
        
        for (let i = 0; i < this.files.length; i++) {
            const fileInfo = document.createElement('p');
            fileInfo.textContent = this.files[i].name;
            selectedFilesDiv.appendChild(fileInfo);
        }
    });

    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData();
        
        for (let i = 0; i < fileInput.files.length; i++) {
            formData.append('document', fileInput.files[i]);
        }

        fetch('/dashboard/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            showMessage(data.message, data.status === 'error');
            if (data.status === 'success') {
                this.reset();
                selectedFilesDiv.innerHTML = '';
                uploadButton.style.display = 'none';
                if (data.documents && Array.isArray(data.documents)) {
                    data.documents.forEach(addDocumentToList);
                } else {
                    console.error('Unexpected response format:', data);
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('An unexpected error occurred', true);
        });
    });

    dashboardMain.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-document') || e.target.closest('.delete-document')) {
            const deleteButton = e.target.classList.contains('delete-document') ? e.target : e.target.closest('.delete-document');
            const id = deleteButton.dataset.id;
            if (confirm('Are you sure you want to delete this document?')) {
                deleteDocument(id);
            }
        }
    });

    generatePromsBtn.addEventListener('click', function() {
        console.log('Generate PROMs button clicked');
        fetch('/dashboard/generate_proms', { method: 'POST' })
            .then(response => {
                console.log('Response status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('Response data:', data);
                fetchProms();
                showMessage(data.message || 'PROMs generated successfully');
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('Failed to generate PROMs', true);
            });
    });

    showAddPromBtn.addEventListener('click', function() {
        addPromForm.style.display = addPromForm.style.display === 'none' ? 'block' : 'none';
    });

    addPromForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const content = document.getElementById('prom-content').value;
        const rank = document.getElementById('prom-rank').value;
        fetch('/dashboard/add_prom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content, rank }),
        })
        .then(response => response.json())
        .then(() => {
            fetchProms();
            this.reset();
            addPromForm.style.display = 'none';
            showMessage('PROM added successfully');
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Failed to add PROM', true);
        });
    });

    promsList.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-prom')) {
            const id = e.target.dataset.id;
            const content = prompt('Enter new content:');
            if (content) {
                fetch(`/dashboard/update_prom/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content }),
                })
                .then(response => response.json())
                .then(() => {
                    fetchProms();
                    showMessage('PROM updated successfully');
                })
                .catch(error => {
                    console.error('Error:', error);
                    showMessage('Failed to update PROM', true);
                });
            }
        } else if (e.target.classList.contains('delete-prom')) {
            const id = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this PROM?')) {
                fetch(`/dashboard/delete_prom/${id}`, { method: 'DELETE' })
                    .then(() => {
                        fetchProms();
                        showMessage('PROM deleted successfully');
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showMessage('Failed to delete PROM', true);
                    });
            }
        }
    });
});
