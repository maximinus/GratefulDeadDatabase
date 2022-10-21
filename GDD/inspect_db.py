from datetime import date
import sqlalchemy.exc
from sqlalchemy.orm import Session

from gddb import get_engine, Show, Venue, GDSet


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
        # now we need get all sets
        show_sets = session.query(GDSet).filter_by(show=show.id).all().order_by(GDSet.index.desc())
        for i in show_sets:
            print(i)
        print(f'{show.date}: {venue}')


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
    options()
