import os
from pathlib import Path

from sqlalchemy import create_engine, Column, String, Integer, ForeignKey, Boolean, Text, Date, Time, Float
from sqlalchemy.orm import declarative_base, Session

from helpers import load_songs, load_venues, load_shows

Base = declarative_base()


DATABASE_FILE = Path(os.getcwd()) / 'database' / 'gd.db'


class Song(Base):
    __tablename__ = 'songs'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column('name', String, nullable=False)
    full_name = Column('full_name', String, nullable=True, default=None)
    short_name = Column('short_name', String, nullable=True, default=None)
    notes = Column(Text, nullable=True, default=None)

    def __repr__(self):
        return f'{self.name}'


class Venue(Base):
    __tablename__ = 'venues'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    college = Column(Text, nullable=True, default=None)
    city = Column(Text, nullable=False)
    state = Column(Text, nullable=False)
    country = Column(Text, nullable=False)
    latitude = Column(Float, nullable=True, default=None)
    longitude = Column(Float, nullable=True, default=None)

    @property
    def fullname(self):
        return f'{self.name},{self.city},{self.state},{self.country}'

    def __repr__(self):
        return self.fullname


class Show(Base):
    __tablename__ = 'shows'
    id = Column(Integer, primary_key=True, autoincrement=True)
    venue = Column(Integer, ForeignKey('venues.id'), nullable=False)
    date = Column(Date, nullable=False, default=None)
    start_time = Column(Time, nullable=True, default=None)
    end_time = Column(Time, nullable=True, default=None)
    index = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True, default=None)


class GDSet(Base):
    __tablename__ = 'sets'
    id = Column(Integer, primary_key=True, autoincrement=True)
    show = Column(Integer, ForeignKey('shows.id'), nullable=False)
    index = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True, default=None)


class PlayedSong(Base):
    __tablename__ = 'playedsongs'
    id = Column(Integer, primary_key=True, autoincrement=True)
    song = Column(Integer, ForeignKey('songs.id'), nullable=False)
    gdset = Column(Integer, ForeignKey('sets.id'))
    segued = Column(Boolean, nullable=False, default=False)
    index = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True, default=None)

    def __repr__(self):
        return f'Played: {self.song.name}'


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
                for k in j.songs:
                    song_index = 0
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


def get_engine():
    return create_engine(f'sqlite:///{DATABASE_FILE}')


if __name__ == '__main__':
    engine = get_engine()
    #create(engine)
    #add_all_songs(engine)
    #add_all_venues(engine)
    #add_all_shows(engine)
    #print_all_venues(engine)
