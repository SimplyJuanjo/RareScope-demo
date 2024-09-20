document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('upload-form');
    const generatePromsBtn = document.getElementById('generate-proms');
    const promsList = document.getElementById('proms-list');
    const addPromForm = document.getElementById('add-prom-form');

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
            alert(data.message);
            this.reset();
        })
        .catch(error => console.error('Error:', error));
    });

    generatePromsBtn.addEventListener('click', function() {
        fetch('/generate_proms', { method: 'POST' })
            .then(response => response.json())
            .then(() => {
                fetchProms();
            })
            .catch(error => console.error('Error:', error));
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
        })
        .catch(error => console.error('Error:', error));
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
                .then(() => fetchProms())
                .catch(error => console.error('Error:', error));
            }
        } else if (e.target.classList.contains('delete-prom')) {
            const id = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this PROM?')) {
                fetch(`/delete_prom/${id}`, { method: 'DELETE' })
                    .then(() => fetchProms())
                    .catch(error => console.error('Error:', error));
            }
        }
    });

    fetchProms();
});
