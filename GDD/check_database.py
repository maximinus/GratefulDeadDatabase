from src.database_helpers import get_engine, get_all_songs, get_all_shows


# use this code to verify that the shows are all ok


def all_songs_unique():
    songs = get_all_songs()
    uniques = list(set(songs))
    assert len(songs) == len(uniques)


def all_show_dates_in_range():
    shows = get_all_shows()
    for i in shows:
        year = i.date.year
        assert 1965 <= year <= 1995


if __name__ == '__main__':
    all_songs_unique()
    print('* All songs unique')
    all_show_dates_in_range()
    print('* All show dates in range')
