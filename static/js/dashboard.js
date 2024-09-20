document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('upload-form');
    const generatePromsBtn = document.getElementById('generate-proms');
    const promsList = document.getElementById('proms-list');
    const addPromForm = document.getElementById('add-prom-form');
    const addPromSection = document.getElementById('add-prom-section');
    const documentsList = document.getElementById('documents-list');
    
    const messageContainer = document.createElement('div');
    messageContainer.className = 'alert';
    messageContainer.style.display = 'none';
    document.querySelector('.container').prepend(messageContainer);

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
                addPromSection.style.display = 'block';
            })
            .catch(error => {
                console.error('Error fetching PROMs:', error);
            });
    }

    function addDocumentToList(docData) {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            ${docData.filename}
            <button class="btn btn-sm btn-danger delete-document" data-id="${docData.id}">Delete</button>
        `;
        documentsList.appendChild(li);
    }

    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        fetch('/dashboard/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            showMessage(data.message, data.status === 'error');
            if (data.status === 'success') {
                this.reset();
                addDocumentToList(data.document);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('An unexpected error occurred', true);
        });
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

    // Add event listener for document deletion
    if (documentsList) {
        documentsList.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-document')) {
                const id = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this document?')) {
                    fetch(`/dashboard/delete_document/${id}`, { method: 'DELETE' })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(data => {
                            if (data.status === 'success') {
                                e.target.closest('li').remove();
                                showMessage('Document deleted successfully');
                            } else {
                                showMessage(data.message || 'Failed to delete document', true);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            showMessage('Failed to delete document', true);
                        });
                }
            }
        });
    }

    // Don't fetch PROMs on initial load
    // fetchProms();
});
