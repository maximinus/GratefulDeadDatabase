from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Text, Date, Time, Float
from sqlalchemy.orm import declarative_base

Base = declarative_base()


# all database tables are stored here


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


class Weather(Base):
    __tablename__ = 'weather'
    # this weather object is insane!
    id = Column(Integer, primary_key=True, autoincrement=True)
    tempmax = Column(Float, nullable=True)
    tempmin = Column(Float, nullable=True)
    temp = Column(Float, nullable=True)
    feelslikemax = Column(Float, nullable=True)
    feelslikemin = Column(Float, nullable=True)
    feelslike = Column(Float, nullable=True)
    dew = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    precip = Column(Float, nullable=True)
    precipprob = Column(Float, nullable=True)
    precipcover = Column(Float, nullable=True)
    # this next one is a json array of text values.
    # we will store that as ','.join(values), i.e. a string
    # if NULL, the string is empty
    preciptype = Column(Text, nullable=True)
    snow = Column(Float, nullable=True)
    snowdepth = Column(Float, nullable=True)
    windgust = Column(Float, nullable=True)
    windspeed = Column(Float, nullable=True)
    winddir = Column(Float, nullable=True)
    pressure = Column(Float, nullable=True)
    cloudcover = Column(Float, nullable=True)
    visibility = Column(Float, nullable=True)
    solarradiation = Column(Float, nullable=True)
    solarenergy = Column(Float, nullable=True)
    uvindex = Column(Float, nullable=True)
    sunrise = Column(Text, nullable=True)
    sunset = Column(Text, nullable=True)
    moonphase = Column(Float, nullable=True)
    conditions = Column(Text, nullable=True)
    description = Column(Text, nullable=True)


class HourWeather(Base):
    __tablename__ = 'hourweather'
    id = Column(Integer, primary_key=True, autoincrement=True)
    weather = Column(Integer, ForeignKey('weather.id'), nullable=False)
    # no time object in sqlite, so we use an integer - minutes since 00:00
    time = Column(Text, nullable=True)
    temp = Column(Float, nullable=True)
    feelslike = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    dew = Column(Float, nullable=True)
    precip = Column(Float, nullable=True)
    precipprob = Column(Float, nullable=True)
    snow = Column(Float, nullable=True)
    snowdepth = Column(Float, nullable=True)
    # this next one is a json array of text values.
    # we will store that as ','.join(values), i.e. a string
    # if NULL, the string is empty
    preciptype = Column(Text, nullable=True)
    windgust = Column(Float, nullable=True)
    windspeed = Column(Float, nullable=True)
    winddir = Column(Float, nullable=True)
    pressure = Column(Float, nullable=True)
    visibility = Column(Float, nullable=True)
    cloudcover = Column(Float, nullable=True)
    solarradiation = Column(Float, nullable=True)
    solarenergy = Column(Float, nullable=True)
    uvindex = Column(Float, nullable=True)
    conditions = Column(Text, nullable=True)


class Show(Base):
    __tablename__ = 'shows'
    id = Column(Integer, primary_key=True, autoincrement=True)
    venue = Column(Integer, ForeignKey('venues.id'), nullable=False)
    weather = Column(Integer, ForeignKey('weather.id'), nullable=True, default=None)
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
    computed_time = Column(Integer, nullable=True, default=None)
    measured_time = Column(Integer, nullable=True, default=None)
    bpm = Column(Text, nullable=True, default=None)
