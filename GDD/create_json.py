import json
import os
from datetime import date
from pathlib import Path

OUTPUT = Path(os.getcwd())
OUTPUT_YEAR_FOLDER =  OUTPUT / 'output' / 'years'


# The structure of the file is simple, it's a list of shows


class Song:
    def __init__(self, data):
        self.name = data['name']
        self.segued = data['segued']
        self.length = -1
        self.notes = ''

    def to_json(self):
        data = {'name': self.name,
                'segued': self.segued,
                'length': self.length,
                'notes': self.notes}
        return data

    def __repr__(self):
        if self.segued:
            return f'{self.name} >'
        else:
            return self.name


class Show:
    def __init__(self, data):
        # where?
        self.venue = data['venue']
        # when?
        self.date = date.fromisoformat(data['date'])
        # when did it start?
        self.start_time = data['start_time']
        self.end_time = data['end_time']
        self.weather = data['weather']
        self.sets = data['sets']
        self.show_index = data['show_index']

    def to_json(self):
        weather = self.weather.to_json() if self.weather is not None else None
        start_time = self.start_time
        end_time = self.end_time
        show_date = self.date.isoformat()
        data = {'venue': self.venue,
                'date': show_date,
                'start_time': start_time,
                'end_time': end_time,
                'weather': weather,
                'sets': [x.to_json() for x in self.sets]}
        return data


class GDSet:
    def __init__(self, data):
        self.songs = data['songs']
        self.encore = data['encore']

    def to_json(self):
        data = {'songs': [x.to_json() for x in self.songs],
                'encore': self.encore}
        return data

    def __repr__(self):
        return '\n'.join([str(x) for x in self.songs])


class Venue:
    def __init__(self, data):
        self.name = data['name']
        self.latitude = data['latitude']
        self.longitude = data['longitude']
        self.city = data['city']
        self.state = data['state']
        self.country = data['country']

    def to_json(self):
        data = {'name': self.name,
                'city': self.city,
                'state': self.state,
                'country': self.country,
                'latitude': self.latitude,
                'longitude': self.longitude
        }
        return data


class Weather:
    def __init__(self):
        pass


def create(year, yml_shows):
    # given a list of yml shows, create the dataset
    venues = {}
    all_shows = []

    file_name = OUTPUT_YEAR_FOLDER / f'{year}.json'

    # convert empty strings into nulls
    for show in yml_shows:
        show.convert_nulls()

    for show in yml_shows:
        # generate the show data
        all_sets = []
        for dead_set in show.sets:
            # this is a PlayedSong, has self.name and self.segue
            new_songs = [Song({'name': x.name, 'segued': x.segue}) for x in dead_set.songs]
            all_sets.append(GDSet({'songs': new_songs, 'encore': False}))
        # construct the show
        data = {'venue': show.full_location, 'weather': None, 'date':show.date.isoformat(),
                'start_time': None, 'end_time': None, 'sets': all_sets, 'show_index': show.show_number}
        all_shows.append(Show(data))

    json_shows = [x.to_json() for x in all_shows]

    # output the json
    filepath = OUTPUT_YEAR_FOLDER / f'{year}.json'
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(json_shows, f, ensure_ascii=False, indent=4)
    print(f'Dumped JSON as {filepath}')


def get_all_venues(yml_shows):
    all_venues = []
    for i in yml_shows:
        if i.full_location not in all_venues:
            all_venues.append(i.full_location)
    # having obtained all venues, we now need create the venue details
    all_venues = []
    for show in all_venues:
        xd = show.split(',')
        venue_data = {'name': xd[0] if xd[0] != '-' else None,
                      'city': xd[1] if xd[1] != '-' else None,
                      'state': xd[2] if xd[2] != '-' else None,
                      'country': xd[3] if xd[3] != '-' else None,
                      'latitude': None,
                      'longitude': None}
        all_venues.append(Venue(venue_data))


if __name__ == '__main__':
    foo = Song({'index': 1, 'name': 'China Cat'})
    json_data = json.dumps(foo.__dict__)
    dict_data = json.loads(json_data)
    print(Song(dict_data))
