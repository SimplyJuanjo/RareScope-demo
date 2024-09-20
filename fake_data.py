import random

def generate_fake_proms():
    fake_proms = [
        "Difficulty breathing",
        "Joint pain",
        "Fatigue",
        "Skin rashes",
        "Headaches",
        "Muscle weakness",
        "Vision problems",
        "Digestive issues",
        "Memory loss",
        "Sleep disturbances"
    ]
    
    return [{'content': prom, 'rank': i + 1} for i, prom in enumerate(random.sample(fake_proms, len(fake_proms)))]
