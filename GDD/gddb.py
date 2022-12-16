import os
from pathlib import Path

from sqlalchemy.orm import Session

from src.tables import Song, Venue, Show, GDSet, PlayedSong, Base
from src.database_helpers import get_engine
from src.helpers import load_songs, load_venues, load_shows


# this is the code to create the base DB from the json data


def add_all_songs(sql_engine):
    songs = load_songs()
    with Session(sql_engine) as session:
        rows = []
        for i in songs:
            rows.append(Song(name=i.name))
        session.add_all(rows)
        session.commit()
    print(f'Added {len(rows)} songs')


def add_all_venues(sql_engine):
    venues = load_venues()
    with Session(sql_engine) as session:
        rows = []
        for i in venues:
            rows.append(Venue(name=i.name,
                              city=i.city,
                              state=i.state,
                              country=i.country,
                              latitude=i.latitude,
                              longitude=i.longitude))
        session.add_all(rows)
        session.commit()
    print(f'Added {len(rows)} venues')


def add_all_shows(sql_engine):
    # we must look up the venue here
    shows = load_shows()
    with Session(sql_engine) as session:
        # get all venues as python objects
        all_venues = session.query(Venue).all()
        song_rows = []
        for i in shows:
            # i.venue is the same as a venue.fullname
            venues = list(filter(lambda x: x.fullname == i.venue, all_venues))
            if len(venues) != 1:
                raise ValueError(f'{venues}')
            show_venue_id = venues[0].id
            new_show = Show(venue=show_venue_id,
                            date=i.date,
                            start_time=i.start_time,
                            end_time=i.end_time,
                            index=i.show_index)
            session.add(new_show)
            session.flush()

            show_id = new_show.id
            # now add all the sets
            index = 0
            for j in i.sets:
                new_set = GDSet(show=show_id,
                                index=index)
                session.add(new_set)
                session.flush()
                set_id = new_set.id
                # and all songs!
                song_index = 0
                for k in j.songs:
                    song_id = session.query(Song.id).filter_by(name=k.name)[0][0]
                    song_rows.append(PlayedSong(song=song_id,
                                                gdset=set_id,
                                                segued=k.segued,
                                                index=song_index))
                    song_index += 1
                index += 1
        session.add_all(song_rows)
        session.commit()
    print(f'Added {len(song_rows)} songs')


def create(sql_engine):
    Base.metadata.create_all(sql_engine)


def print_all_venues(sql_engine):
    with Session(sql_engine) as session:
        for i in session.query(Venue).all():
            print(i)


if __name__ == '__main__':
    engine = get_engine()
    create(engine)
    add_all_songs(engine)
    add_all_venues(engine)
    add_all_shows(engine)
    #print_all_venues(engine)
