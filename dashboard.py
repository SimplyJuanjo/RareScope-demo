import os
from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models import Document, PROM
from extensions import db
from config import Config
import fake_data

dashboard = Blueprint('dashboard', __name__)

@dashboard.route('/')
@login_required
def index():
    documents = Document.query.filter_by(user_id=current_user.id).all()
    return render_template('dashboard.html', documents=documents)

@dashboard.route('/upload', methods=['POST'])
@login_required
def upload_document():
    if 'document' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part'}), 400
    
    files = request.files.getlist('document')
    if not files or files[0].filename == '':
        return jsonify({'status': 'error', 'message': 'No selected file'}), 400

    uploaded_documents = []
    for file in files:
        if file and allowed_file(file.filename):
            try:
                # Create the upload folder if it doesn't exist
                os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
                
                filename = secure_filename(file.filename)
                file_path = os.path.join(Config.UPLOAD_FOLDER, filename)
                file.save(file_path)
                new_document = Document(filename=filename, user_id=current_user.id)
                db.session.add(new_document)
                uploaded_documents.append({'id': new_document.id, 'filename': new_document.filename})
            except Exception as e:
                db.session.rollback()
                return jsonify({'status': 'error', 'message': f'An error occurred: {str(e)}'}), 500
        else:
            return jsonify({'status': 'error', 'message': 'File type not allowed'}), 400

    db.session.commit()
    return jsonify({
        'status': 'success', 
        'message': 'Files uploaded successfully',
        'documents': uploaded_documents
    }), 200

@dashboard.route('/get_proms', methods=['GET'])
@login_required
def get_proms():
    proms = PROM.query.filter_by(user_id=current_user.id).order_by(PROM.rank).all()
    return jsonify([{'id': prom.id, 'content': prom.content, 'rank': prom.rank} for prom in proms])

@dashboard.route('/add_prom', methods=['POST'])
@login_required
def add_prom():
    content = request.json.get('content')
    rank = request.json.get('rank')
    new_prom = PROM(content=content, rank=rank, user_id=current_user.id)
    db.session.add(new_prom)
    db.session.commit()
    return jsonify({'id': new_prom.id, 'content': new_prom.content, 'rank': new_prom.rank}), 201

@dashboard.route('/update_prom/<int:prom_id>', methods=['PUT'])
@login_required
def update_prom(prom_id):
    prom = PROM.query.get_or_404(prom_id)
    if prom.user_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
    prom.content = request.json.get('content', prom.content)
    prom.rank = request.json.get('rank', prom.rank)
    db.session.commit()
    return jsonify({'id': prom.id, 'content': prom.content, 'rank': prom.rank})

@dashboard.route('/delete_document/<int:document_id>', methods=['DELETE'])
@login_required
def delete_document(document_id):
    document = Document.query.get_or_404(document_id)
    if document.user_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
    try:
        # Delete the file from the filesystem
        file_path = os.path.join(Config.UPLOAD_FOLDER, document.filename)
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Delete the document from the database
        db.session.delete(document)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Document deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': f'An error occurred: {str(e)}'}), 500

@dashboard.route('/generate_proms', methods=['POST'])
@login_required
def generate_proms():
    try:
        # Delete existing PROMs for the current user
        PROM.query.filter_by(user_id=current_user.id).delete()

        generated_proms = fake_data.generate_fake_proms()
        for prom in generated_proms:
            new_prom = PROM(content=prom['content'], rank=prom['rank'], user_id=current_user.id)
            db.session.add(new_prom)
        db.session.commit()
        
        # Fetch the newly generated PROMs
        proms = PROM.query.filter_by(user_id=current_user.id).order_by(PROM.rank).all()
        prom_list = [{'id': prom.id, 'content': prom.content, 'rank': prom.rank} for prom in proms]
        
        return jsonify({'status': 'success', 'message': 'PROMs generated successfully', 'proms': prom_list}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error generating PROMs: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS
