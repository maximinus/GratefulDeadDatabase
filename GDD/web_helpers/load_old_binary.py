import struct

# data is little-endian, i.e. first byte is low value
ROOT_DIR = '../../Website/'
SONGS_FILES = f'{ROOT_DIR}songs.bin'
SHOWS_FILES = f'{ROOT_DIR}shows.bin'


def load_from_file(filename):
    with open(filename, mode='rb') as file:
        return file.read()


def load_songs():
    data = load_from_file(SONGS_FILES)
    loaded_songs = []
    current = []
    # can't easily split a bytes object, so must do the hard work
    for i in [x[0] for x in struct.iter_unpack('=B', data)]:
        # scan along looking for zero
        if i == 0:
            loaded_songs.append(current)
            current = []
        else:
            current.append(i)
    # a bit too clever really
    return [''.join([chr(x) for x in song]) for song in loaded_songs]


def get_single_set(data, index):
    set_songs = []
    while True:
        if data[index] == 0:
            # end of this set
            index += 1
            return [set_songs, index]
        # we store song indexes with +1 so as not to hit the set marker
        # here we reset so that the index is correct
        song_index = int(data[index]) - 1
        length = data[index + 1]
        index += 2
        set_songs.append([song_index, length])


def get_sets(data, index):
    new_sets = []
    while True:
        if data[index] == 0:
            # end of these sets
            index += 1
            return [new_sets, index]
        new_set_data, index = get_single_set(data, index)
        new_sets.append(new_set_data)


def build_shows(data):
    new_shows = []
    index = 0
    while True:
        if data[index] == 0:
            return new_shows
        date = int(data[index])
        index += 1
        new_sets_data, index = get_sets(data, index)
        new_shows.append([date, new_sets_data])


def load_shows():
    data = load_from_file(SHOWS_FILES)
    # < = little endian
    # H = short, 16 bits
    data = [int(x[0]) for x in struct.iter_unpack('>H', data)]
    # we need do this manually
    return build_shows(data)


if __name__ == '__main__':
    songs = load_songs()
    shows = load_shows()
    print(len(shows))
