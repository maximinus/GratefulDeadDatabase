import os
import sys
import json
import time
import shutil
import chevron
import webbrowser
import http.server
import socketserver
import multiprocessing

from pathlib import Path

DIST_FOLDER = Path('./dist')
JSON_FILE = Path('./data.json')
HTML_FILE = Path('./src/html/index.html')
PARTIALS_FOLDER = Path('./src/html')
OUTPUT_HTML = Path('./dist/index.html')
TEMPLATE_FOLDER = Path('./src/html/templates')

# folders to copy
SOURCE_FOLDER = Path('./src')
FOLDER_NAMES = ['css', 'data', 'gfx', 'js']

SLEEP_TIME = 2


def error(message):
    print(f'* Error: {message}')
    sys.exit(False)


def clean_dist():
    try:
        shutil.rmtree(DIST_FOLDER)
        os.makedirs(DIST_FOLDER)
        print('* Cleaned dist folder')
    except OSError as ex:
        error(f'Could not clean folder: {ex}')


def get_templates():
    all_templates = os.listdir(TEMPLATE_FOLDER)
    template_data = []
    for i in all_templates:
        template_id = i.split('.')[0]
        # not sure why this doesn't need 2 spaces
        template_data.append(f'<script id="{template_id}" type="x-tmpl-mustache">\n')
        template_file = TEMPLATE_FOLDER / i
        with open(template_file) as f:
            for i in f.readlines():
                template_data.append('    ' + i)
        template_data.append('  </script>\n')
    return ''.join(template_data)


def get_data():
    templates = get_templates()
    print('* Loaded templates')
    try:
        with open(JSON_FILE) as f:
            data = json.load(f)
        print('* Loaded JSON data')
        data['templates'] = templates
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
        print(f'* Copying files from {source_folder}')
        # copy all files from one to the other
        try:
            shutil.copytree(source_folder, dest_folder)
        except (FileExistsError, OSError) as ex:
            error(f'Could not copy files: {ex}')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_FOLDER, **kwargs)


def server_thread(name):
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(('', 8000), Handler)
    httpd.serve_forever()


class FileCheckResult:
    def __init__(self, last_check, total_files):
        self.time = last_check
        self.files = total_files


def get_all_files():
    files = []
    for i in FOLDER_NAMES:
        for j in os.listdir(SOURCE_FOLDER / i):
            files.append(f'{str(SOURCE_FOLDER)}/{i}/{j}')
    return files


def check_all_files(last_check):
    # return None if the test failed
    all_files = get_all_files()
    if len(all_files) != last_check.files:
        return None
    for i in all_files:
        if os.path.getmtime(i) > last_check.time:
            return None
    return FileCheckResult(time.time(), len(all_files))


def check_updates():
    # get a null result
    print('* Waiting for file change')
    result = FileCheckResult(time.time() + 1000, len(get_all_files()))
    while True:
        # examine all the files
        result = check_all_files(result)
        if result is None:
            return
        time.sleep(SLEEP_TIME)


def wait_for_keypress():
    input('Press return to update')


def setup():
    clean_dist()
    page_data = get_data()
    build_html(page_data)
    copy_files()


def serve_page():
    first = True
    while True:
        setup()
        process = multiprocessing.Process(target=server_thread, args=(1,))
        process.start()
        # serve the file and open up in the browser
        print(f'* Serving {OUTPUT_HTML}')
        if first is True:
            webbrowser.open_new_tab('0.0.0.0:8000')
            first = False
        else:
            webbrowser.open('0.0.0.0:8000', new=0)
        wait_for_keypress()
        print('* Stopping process')
        process.terminate()
        # After this we cycle round and will run the build again
        print('* Updating')


if __name__ == '__main__':
    serve_page()
