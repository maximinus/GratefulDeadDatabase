import sys
import json
import shutil
import fnmatch
import os.path

from sqlalchemy.orm import Session
from pathlib import Path

from src.tables import Venue, PlayedSong
from src.database_helpers import get_all_venues, get_engine


# find this many at a time
MAX_VENUES = 25
FILENAME = 'venues.json'
OLD_VENUE_DIR = Path(os.getcwd()) / 'database' / 'venues'


# use this code to extract venues we do have co-ords for so far
def find_next_venue_chunk(venues):
    # find all with missing co-ords
    missing = []
    for i in venues:
        if i.latitude is None or i.longitude is None:
            missing.append(i)
    print(f'Missing {len(missing)} venues of {len(venues)} total')
    working_set = missing[:MAX_VENUES]
    # add as json
    json_data = []
    for i in working_set:
        json_data.append({'name': f'{i.name}, {i.city}, {i.state}',
                          'id': i.id,
                          'latitude': i.latitude,
                          'longitude': i.longitude,
                          'lat_long': ''})
    return json_data


def save_as_json(data):
    # just in case
    if os.path.exists(FILENAME):
        print(f'Error: {FILENAME} exists')
    with open(FILENAME, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def move_old_venues_file():
    # how many json files in this directory?
    total = len(fnmatch.filter(os.listdir(OLD_VENUE_DIR), '*.json'))
    new_filename = f'{str(total).zfill(4)}.json'
    print(f'Moving file from {FILENAME} to {OLD_VENUE_DIR / new_filename}')
    shutil.move(FILENAME, OLD_VENUE_DIR / new_filename)


def check_json():
    # if file exists, check all data has been added: then add to the database, after making a backup
    if not os.path.exists(FILENAME):
        return
    # ok, so now check the data
    with open(FILENAME) as f:
        venue_data = json.load(f)
    for i in venue_data:
        if len(i['lat_long']) == 0:
            print('Current venue file has missing data')
            sys.exit()
    # ok, so all shows have data, let's update them
    with Session(get_engine()) as session:
        for i in venue_data:
            # if there is an error, then no values will be written
            venue_to_update = session.query(Venue).get(i['id'])
            # split long and lat, reduce to 2 sig figs
            coords = [round(float(x.strip()), 3) for x in i['lat_long'].split(',')]
            venue_to_update.latitude = coords[0]
            venue_to_update.longitude = coords[1]
        print(f'{len(venue_data)} venues updated')
        session.commit()
    # finally, copy this value to the venues directory in case we screw up
    move_old_venues_file()
    sys.exit()


if __name__ == '__main__':
    check_json()
    all_venues = get_all_venues()
    split_venues = find_next_venue_chunk(all_venues)
    save_as_json(split_venues)
