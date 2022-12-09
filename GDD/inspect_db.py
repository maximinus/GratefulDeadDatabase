from datetime import date
import sqlalchemy.exc
from sqlalchemy.orm import Session

from gddb import get_engine, Show, Venue, GDSet, PlayedSong, Song


def display_show(show_date):
    # find this show
    engine = get_engine()
    with Session(engine) as session:
        # now we have the show, get the venue
        try:
            show = session.query(Show).filter_by(date=show_date).one()
        except sqlalchemy.exc.NoResultFound:
            print(f'  Error: No show on {show_date}')
            return
        venue = session.query(Venue).get(show.venue)
        print(f'{show.date}: {venue}')
        # now we need get all sets
        show_sets = session.query(GDSet).filter_by(show=show.id).order_by(GDSet.index.asc())
        index = 1
        for i in show_sets:
            # get all songs from this set and sort in order
            all_songs = session.query(PlayedSong).filter_by(gdset=i.id).order_by(PlayedSong.index.asc())
            print(f'Set #{index}')
            for j in all_songs:
                song_name = session.query(Song).get(j.song)
                print(f'  {song_name}')
            index += 1


def view_setlist():
    while True:
        given_data = input('yy-mm-dd? ')
        try:
            if given_data == 'exit':
                return
            show_date = date.fromisoformat(f'19{given_data}')
            display_show(show_date)
        except ValueError:
            print(f'  Error: {given_data} not a valid data')
            continue


def options():
    print('Please choose:')
    print('  1: See a setlist')
    print('  0: Exit')
    while True:
        answer = input('? ')
        try:
            answer = int(answer)
            if answer == 0:
                return
            if answer == 1:
                return view_setlist()
            print('Invalid answer, please enter a number')
        except ValueError:
            print('Answer must be a number')


if __name__ == '__main__':
    #options()
    show_date = date.fromisoformat('1989-10-09')
    display_show(show_date)
