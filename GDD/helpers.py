import os
import json
from pathlib import Path

from json_objects import Show, Song, Venue

YEARS_FOLDER = Path(os.getcwd()) / 'database' / 'years'
SONGS_FILE = Path(os.getcwd()) / 'database' / 'songs.json'
VENUES_FILE = Path(os.getcwd()) / 'database' / 'venues.json'


def load_shows():
    all_data = []
    print(f'Loading all shows')
    for i in range(65, 96):
        filename = YEARS_FOLDER / f'19{i}.json'
        with open(filename) as fd:
            json_data = json.load(fd)
        for j in json_data:
            all_data.append(Show(j))
    return all_data


def load_all_shows():
    all_data = []
    print(f'Loading all shows')
    for i in range(65, 96):
        filename = YEARS_FOLDER / f'19{i}.json'
        with open(filename) as fd:
            json_data = json.load(fd)
        for j in json_data:
            all_data.append(Show(j))
    return all_data


def load_venues():
    all_venues = []
    with open(VENUES_FILE) as fd:
        json_data = json.load(fd)
    for i in json_data:
        all_venues.append(Venue(i))
    return all_venues



def load_songs():
    all_songs = []
    with open(SONGS_FILE) as fd:
        json_data = json.load(fd)
    for i in json_data['songs']:
        all_songs.append(Song(i))
    return all_songs


def load_weather():
    pass

def match_shows_to_venues(shows, venues):
    # match all shows with venues and return
    # [[show, venue], [show, venue], ...]
    # for all shows.
    # This list is ordered by show date
    matched_shows = []
    for show in shows:
        found = False
        for venue in venues:
            if show.venue == venue.long_name:
                matched_shows.append([show, venue])
                found = True
                break
        if not found:
            raise ValueError(f'{show.date} not found')
