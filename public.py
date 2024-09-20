from flask import Blueprint, render_template, jsonify, send_file
from models import PROM
import csv
import io

public = Blueprint('public', __name__)

@public.route('/public')
def index():
    return render_template('public.html')

@public.route('/public/proms')
def get_public_proms():
    proms = PROM.query.order_by(PROM.rank).all()
    return jsonify([{'content': prom.content, 'rank': prom.rank} for prom in proms])

@public.route('/public/proms/json')
def get_proms_json():
    proms = PROM.query.order_by(PROM.rank).all()
    return jsonify([{'content': prom.content, 'rank': prom.rank} for prom in proms])

@public.route('/public/proms/csv')
def get_proms_csv():
    proms = PROM.query.order_by(PROM.rank).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Content', 'Rank'])
    for prom in proms:
        writer.writerow([prom.content, prom.rank])
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        attachment_filename='proms.csv'
    )
