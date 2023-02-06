import os

from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, and_

from src.tables import Show, Venue, GDSet, PlayedSong, Song, Weather, HourWeather

DATABASE_FILE = Path(os.getcwd()) / 'database' / 'gd.db'

# routines to help you get things from the DB easily


def get_engine():
    return create_engine(f'sqlite:///{DATABASE_FILE}')


def get_all_shows():
    with Session(get_engine()) as session:
        return session.query(Show).all()


def get_all_sets(show_id):
    with Session(get_engine()) as session:
        return session.query(GDSet).filter(GDSet.show == show_id).all()


def get_all_played_sets():
    with Session(get_engine()) as session:
        return session.query(GDSet).all()


def get_all_songs_in_set(set_id):
    with Session(get_engine()) as session:
        return session.query(PlayedSong).filter(PlayedSong.gdset == set_id).all()


def get_show_from_weather(weather_id):
    # each show has a unique weather, even if there are 2 shows on the same day
    with Session(get_engine()) as session:
        return session.query(Show).filter(Show.weather == weather_id).all()


def get_all_venues():
    with Session(get_engine()) as session:
        return session.query(Venue).all()


def get_all_weather():
    with Session(get_engine()) as session:
        return session.query(Weather).all()


def get_all_hour_weather(weather_id):
    with Session(get_engine()) as session:
        return session.query(HourWeather).filter(HourWeather.weather == weather_id).all()


def get_single_show(single_day):
    # confirm a show exists or raise ValueError
    with Session(get_engine()) as session:
        # could be more than one show
        selected_shows = session.query(Show).filter(Show.date == single_day).all()
        return selected_shows


def get_show_from_set(single_set):
    with Session(get_engine()) as session:
        selected_shows = session.query(Show).filter(Show.id == single_set.show).all()
        return selected_shows


def get_shows_from_year(year):
    with Session(get_engine()) as session:
        # could be more than one show
        selected_shows = session.query(Show).filter(
            and_(Show.date >= f'19{year}-01-01', Show.date <= '19{year}-12-31')).all()
        return selected_shows


def get_all_songs():
    with Session(get_engine()) as session:
        return session.query(Song).all()


def song_exists(song_name):
    with Session(get_engine()) as session:
        return session.query(Song).filter_by(name=song_name).exists()


def get_single_song(song_name):
    with Session(get_engine()) as session:
        return session.query(Song).filter_by(name=song_name).first()


def get_all_song_versions(song_name):
    if not song_exists(song_name):
        raise ValueError(f'Song {song_name} not in database')
    actual_song = get_single_song(song_name)
    with Session(get_engine()) as session:
        return session.query(PlayedSong).filter(PlayedSong.song == actual_song).all()


def delete_sets(all_set_ids):
    with Session(get_engine()) as session:
        for i in all_set_ids:
            show_set = session.get(GDSet, i)
            session.delete(show_set)
        session.commit()


if __name__ == '__main__':
    pass
