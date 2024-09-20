document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('upload-form');
    const generatePromsBtn = document.getElementById('generate-proms');
    const promsList = document.getElementById('proms-list');
    const addPromForm = document.getElementById('add-prom-form');
    const addPromSection = document.getElementById('add-prom-section');
    
    const messageContainer = document.createElement('div');
    messageContainer.className = 'alert';
    document.querySelector('.container').insertBefore(messageContainer, document.querySelector('.row'));

    function showMessage(message, isError = false) {
        messageContainer.textContent = message;
        messageContainer.className = `alert ${isError ? 'alert-danger' : 'alert-success'}`;
        messageContainer.style.display = 'block';
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }

    function fetchProms() {
        fetch('/get_proms')
            .then(response => response.json())
            .then(proms => {
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
                // Show or hide the add PROM section based on the existence of PROMs
                addPromSection.classList.toggle('hidden', proms.length === 0);
            });
    }

    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            showMessage(data.message, data.status === 'error');
            if (data.status === 'success') {
                this.reset();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('An unexpected error occurred', true);
        });
    });

    generatePromsBtn.addEventListener('click', function() {
        fetch('/generate_proms', { method: 'POST' })
            .then(response => response.json())
            .then(() => {
                fetchProms();
                showMessage('PROMs generated successfully');
                addPromSection.classList.remove('hidden');
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
        fetch('/add_prom', {
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
                fetch(`/update_prom/${id}`, {
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
                fetch(`/delete_prom/${id}`, { method: 'DELETE' })
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

    fetchProms();
});
