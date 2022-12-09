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
    return struct.unpack('B', data)


def load_shows():
    data = load_from_file(SHOWS_FILES)
    return struct.unpack('<H', data)


if __name__ == '__main__':
    songs = load_songs()
    shows = load_shows()
    # < = little endian
    # H = short, 16 bits
    converted = struct.
    print(converted)
