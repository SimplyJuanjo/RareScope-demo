document.addEventListener('DOMContentLoaded', function() {
    const publicPromsList = document.getElementById('public-proms-list');

    function fetchPublicProms() {
        fetch('/public/proms')
            .then(response => response.json())
            .then(proms => {
                publicPromsList.innerHTML = '';
                proms.forEach(prom => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${prom.rank}</td>
                        <td>${prom.content}</td>
                    `;
                    publicPromsList.appendChild(tr);
                });
            })
            .catch(error => console.error('Error:', error));
    }

    fetchPublicProms();
});
