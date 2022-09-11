import yaml
from tqdm import tqdm
from datetime import date

# extract the yaml data

DATA_FOLDER = 'gdshowsdb'
SONGS = f'{DATA_FOLDER}/song_refs.yaml'


class GdShowsSong:
    def __init__(self, name, guid):
        self.name = name
        self.guid = guid

    def __repr__(self):
        return self.name


class PlayedSong:
    def __init__(self, data):
        self.guid = data[':uuid']
        self.name = data[':name']
        self.segue = data[':segued']

    def __repr__(self):
        return self.name


class GdSet:
    def __init__(self, set_data):
        # set data is a dict
        self.songs = []
        for i in set_data[':songs']:
            self.songs.append(PlayedSong(i))


class GdShow:
    def __init__(self, show_date, details):
        self.date = self.convert_date(show_date)
        self.text_date = show_date
        self.guid = details[':uuid']
        self.venue_name = details[':venue']
        self.city = details[':city']
        self.state = details[':state']
        self.country = details[':country']
        self.sets = self.get_sets(details[':sets'])

    def convert_date(self, given_date):
        date_info = [int(x) for x in given_date.split('/')]
        # now as array we have YYYY, MM, DD
        return date(date_info[0], date_info[1], date_info[2])

    def get_sets(self, sets):
        all_sets = []
        for i in sets:
            all_sets.append(GdSet(i))
        return all_sets

    def print(self):
        print(f'{self.text_date}: {self.venue_name}')
        for index, all_sets in enumerate(self.sets):
            print(f'  Set {index}:')
            for song in all_sets.songs:
                print(f'    {song}')


def extract_songs():
    with open(SONGS, 'r') as file:
        song_data = yaml.safe_load(file)
    # it's a list of {'title': 'GUID'}
    # each of these is the LONG song title
    all_songs = []
    for i in song_data:
        for key, value in i.items():
            all_songs.append(GdShowsSong(key, value))
    return all_songs


def extract_year(year):
    with open(f'{DATA_FOLDER}/{str(year)}.yaml', 'r') as file:
        year_data = yaml.safe_load(file)
    # this is a dict. Every entry is a show
    all_shows = []
    for key, value in year_data.items():
        all_shows.append(GdShow(key, value))
    return all_shows


def get_all_years():
    all_shows = []
    for i in tqdm(range(1965, 1996)):
        all_shows.extend(extract_year(i))
    return all_shows


if __name__ == '__main__':
    songs = extract_songs()
    print(f'Extracted {len(songs)} songs')
    for i in songs:
        print(i)
    #every_show = get_all_years()
    #print(f'Extracted {len(every_show)} shows')
