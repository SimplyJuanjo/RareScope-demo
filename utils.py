import json
import random

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def generate_fake_proms():
    with open('fake_data.json', 'r') as f:
        fake_proms = json.load(f)
    return random.sample(fake_proms, 10)
