from peewee import *


db = SqliteDatabase('database/grateful_dead.db')


class BaseModel(Model):
    class Meta:
        database = db


class City(BaseModel):
    name = CharField()


class State(BaseModel):
    name = CharField()


class Country(BaseModel):
    name = CharField()


class Venue(BaseModel):
    name = CharField()
    latitude = FloatField()
    longitude = FloatField()
    festival_name = CharField(null=True)
    # for unique names "Big Nigs" for example
    alternate_name = CharField(null=True)
    city = ForeignKeyField(City, backref='venues')
    state = ForeignKeyField(State, backref='states')
    country = ForeignKeyField(Country, backref='countries')


class Show(BaseModel):
    venue = ForeignKeyField(Venue, backref='shows')
    date = DateField()
    start_time = TimeField(null=True)
    # possible >1 show per date, and start time could be null
    start_index = IntegerField()


class ShowSet(BaseModel):
    show = ForeignKeyField(Show, backref='sets')
    index = IntegerField()


class Musician(BaseModel):
    name = CharField()
    notes = TextField(null=True)


class Song(BaseModel):
    full_name = CharField(null=True)
    common_name = CharField()
    short_name = CharField(null=True)
    char4_name = CharField()
    cover = BooleanField()


class SongWriter(BaseModel):
    # somebody wrote a song. Who what song, what did they write?
    musician = ForeignKeyField(Musician, backref='songs')
    song = ForeignKeyField(Song, backref='writers')
    lyrics = BooleanField()
    music = BooleanField()


class PlayedSong(BaseModel):
    song = ForeignKeyField(Song, backref='versions')
    show_set = ForeignKeyField(ShowSet, backref='songs')
    index = IntegerField()
    # no pause between songs; pause=0 seconds - Jerrybase is 5
    transitions = BooleanField()
    notes = TextField(null=True)


class GuestArtist(BaseModel):
    song = ForeignKeyField(PlayedSong, backref='guests')
    musician = ForeignKeyField(Musician, backref='appearences')
    notes = TextField(null=True)


class Weather(BaseModel):
    show = ForeignKeyField(Show, backref='all_weather')
    # in celcius
    temperature = FloatField(null=True)
    feels_like = FloatField(null=True)
    # in atm, so very close to 1
    pressure = FloatField(null=True)
    # what measure?
    precipitation = FloatField(null=True)
    # m/s
    wind_velocity = FloatField(null=True)
    # float 0-360, 0 is north, 90 is east etc
    wind_direction = FloatField(null=True)


if __name__ == '__main__':
    db.connect()
    db.create_tables([Venue, Show, ShowSet, Musician, Song, SongWriter, PlayedSong, GuestArtist, Weather])
    db.commit()
    print('Created all tables')
