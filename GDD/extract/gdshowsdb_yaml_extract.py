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

    @property
    def full_location(self):
        return f'{self.venue_name}, {self.city}, {self.state}'

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

    def get_ordered(self):
        # return a list of [set_number, song_name] for all songs
        new_order = []
        set_index = 1
        for single_set in self.sets:
            for song in single_set.songs:
                new_order.append([set_index, song.name])
            set_index += 1
        return new_order

    def songs_from_csv_clean(self, csv_clean, all_songs):
        # csv_clean is a list of [set_index, song_name]
        # use all_songs to get the appropriate conversion
        all_new_sets = []
        new_set = []
        set_index = 1
        for i in csv_clean:
            if i[0] != set_index:
                set_index += 1
                all_new_sets.append(new_set)
                new_set = []
            # find the song
            found = False
            for j in all_songs:
                if i[1] == j[1]:
                    # found it
                    new_set.append(PlayedSong({':uuid':'N/A', ':name': i[1], ':segued': False}))
                    found = True
                    break
            if not found:
                print(f'No song {i[1]} in csv data')
                raise ValueError
        self.sets = all_new_sets

    def check_drums_space(self, cvs_clean):
        # Is there a drums > space in the cvs_data and only a drums in the yml?
        space = False
        for i in range(len(cvs_clean)):
            if cvs_clean[i][1] == 'Drums':
                if cvs_clean[i + 1][1] == 'Space':
                    space = True
                else:
                    # not on this drums, and we ignore a second one and do manually
                    return False
        if not space:
            return False
        # also a drums in csv?
        for i in self.sets:
            for j in range(len(i.songs)):
                if i.songs[j].name == 'Drums':
                    # next is space?
                    if i.songs[j + 1].name == 'Space':
                        # yes, do nothing
                        return False
                    # no, we need to insert a space. Seque is auto both ways
                    i.songs[j].sequed = True
                    i.songs.insert(j + 1, PlayedSong({':uuid':'N/A', ':name': 'Space', ':segued': True}))
                    print('  Inserted space into show')
                    return True


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
