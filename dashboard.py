from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
from models import Document, PROM
from extensions import db
from werkzeug.utils import secure_filename
import os
from config import Config
import fake_data

dashboard = Blueprint('dashboard', __name__)

@dashboard.route('/dashboard')
@login_required
def index():
    return render_template('dashboard.html')

@dashboard.route('/upload', methods=['POST'])
@login_required
def upload_document():
    if 'document' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part'}), 400
    file = request.files['document']
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            file_path = os.path.join(Config.UPLOAD_FOLDER, filename)
            file.save(file_path)
            new_document = Document(filename=filename, user_id=current_user.id)
            db.session.add(new_document)
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'File uploaded successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': f'An error occurred: {str(e)}'}), 500
    return jsonify({'status': 'error', 'message': 'File type not allowed'}), 400

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

@dashboard.route('/delete_prom/<int:prom_id>', methods=['DELETE'])
@login_required
def delete_prom(prom_id):
    prom = PROM.query.get_or_404(prom_id)
    if prom.user_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
    db.session.delete(prom)
    db.session.commit()
    return '', 204

@dashboard.route('/generate_proms', methods=['POST'])
@login_required
def generate_proms():
    try:
        generated_proms = fake_data.generate_fake_proms()
        for prom in generated_proms:
            new_prom = PROM(content=prom['content'], rank=prom['rank'], user_id=current_user.id)
            db.session.add(new_prom)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'PROMs generated successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS
