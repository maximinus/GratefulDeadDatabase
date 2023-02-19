import os
import sys
import json
import shutil
import chevron

from pathlib import Path

DIST_FOLDER = Path('./dist')
JSON_FILE = Path('./data.json')
HTML_FILE = Path('./src/html/index.html')
PARTIALS_FOLDER = Path('./src/html')
OUTPUT_HTML = Path('./dist/index.html')

# folders to copy
SOURCE_FOLDER = Path('./src')
FOLDER_NAMES = ['css', 'data', 'gfx', 'js']


def error(message):
    print(f'* Error: {message}')
    sys.exit(False)


def clean_dist():
    try:
        print(DIST_FOLDER)
        shutil.rmtree(DIST_FOLDER)
        os.makedirs(DIST_FOLDER)
        print('* Cleaned dist folder')
    except OSError as ex:
        error(f'Could not clean folder: {ex}')


def get_data():
    try:
        with open(JSON_FILE) as f:
            data = json.load(f)
        print('* Loaded JSON data')
        return data
    except OSError as ex:
        error(f'Could not get JSON: {ex}')


def build_html(data):
    try:
        with open(HTML_FILE, 'r') as f:
            page = chevron.render(f, data,
                                  partials_path=PARTIALS_FOLDER,
                                  partials_ext='html')
        with open(OUTPUT_HTML, "w") as f:
            f.write(page)
            print(f'* Built new index.html at {OUTPUT_HTML}')
    except OSError as ex:
        error(f'Could not create index.html {ex}')


def copy_files():
    # copy CSS, gfx, data and js files over to dist, all from src
    for folder in FOLDER_NAMES:
        source_folder = SOURCE_FOLDER / folder
        dest_folder = DIST_FOLDER / folder
        print(f'* Copying file from {folder}')
        # copy all files from one to the other
        try:
            shutil.copytree(source_folder, dest_folder)
            pass
        except (FileExistsError, OSError) as ex:
            error(f'Could not copy files: {ex}')


def serve():
    # serve the file and open up in the browser
    print(f'* Serving {OUTPUT_HTML}')


if __name__ == '__main__':
    clean_dist()
    page_data = get_data()
    build_html(page_data)
    copy_files()
    serve()
