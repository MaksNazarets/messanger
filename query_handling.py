from main import app
import os
import fnmatch
from flask import send_file

@app.route('/<user_id>/profile_photo')
def get_profile_photo(user_id):
    path_to_folder = os.path.join(app.root_path, f"user_data/profile_photos/user_{user_id}")
    for file in os.listdir(path_to_folder):
        # Check if the filename matches the pattern
        if fnmatch.fnmatch(file, '1.*'):
            print(file)

            filename = f'{path_to_folder}/{file}'
            return send_file(filename, mimetype='image/png')

    return send_file(os.path.join(app.root_path, f"user_data/profile_photos/default/light-2.png"), mimetype='image/png')
    
