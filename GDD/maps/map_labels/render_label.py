import pygame
import pygame.gfxdraw


MARGIN = 20
LINE_HEIGHT = 38
BALL_SPACER = 14
BALL_SIZE = 30
BALL_Y_OFFSET = 0
# (LINE_HEIGHT - (SHOW_NAME_HEIGHT + DATES_NAME_HEIGHT)) // 2
SIZE = MARGIN * 2

# list of [venue_name, dates], where dates is of the form 11/4, i.e. the text to draw
SHOWS = [['The Spectrum, Philadelphia, PA', ['4/22']],
         ['Civic Center Arena, Springfield, MA', ['4/23']],
         ['Capitol Theater, Passaic, NJ', ['4/25', '4/26', '4/27']],
         ['The Palladium, New York, NY', ['4/29', '4/30', '5/1', '5/3', '5/4']],
         ['Veterans Memorial Coliseum, New Haven, CT', ['5/5']],
         ['Boston Garden, Boston, MA', ['5/7']],
         ['Barton Hall, Cornell U., Ithaca, NY', ['5/8']],
         ['War Memorial Auditorium, Buffalo, NY', ['5/9']],
         ['Civic Center Arena, St. Paul, MN', ['5/11']],
         ['Auditorium Theater, Chicago, IL', ['5/12', '5/13']],
         ['St. Louis Arena, St. Louis, MO', ['5/15']],
         ['Memorial Coliseum, U. of Alabama, Tuscaloosa, AL', ['5/17']],
         ['Fox Theater, Atlanta, GA', ['5/18', '5/19']],
         ['Lakeland Civic Center, Lakeland, FL', ['5/21']],
         ['The Sportatorium, Hollywood, FL', ['5/22']],
         ['The Mosque, Richmond, VA', ['5/25']],
         ['Baltimore Civic Center, Baltimore, MD', ['5/26']],
         ['Hartford Civic Center, Hartford, CT', ['5/28/77']]]


class Images:
    def __init__(self):
        self.BOTTOM_LEFT = pygame.image.load('gfx/bottom_left.png').convert_alpha()
        self.BOTTOM_RIGHT = pygame.image.load('gfx/bottom_right.png').convert_alpha()
        self.TOP_LEFT = pygame.image.load('gfx/top_left.png').convert_alpha()
        self.TOP_RIGHT = pygame.image.load('gfx/top_right.png').convert_alpha()
        self.SIDE = pygame.image.load('gfx/side.png').convert_alpha()
        self.TOP = pygame.image.load('gfx/top.png').convert_alpha()
        self.BALL = pygame.image.load('gfx/ball.png').convert_alpha()
        self.font = pygame.font.Font('gfx/arial.ttf', 14)
        self.italic_font = pygame.font.Font('gfx/arial.ttf', 12)
        self.italic_font.italic = True


all_images = None


def draw_borders(image, width, height):
    # draw the corners
    image.blit(all_images.TOP_LEFT, (0, 0))
    image.blit(all_images.TOP_RIGHT, (width - 4, 0))
    image.blit(all_images.BOTTOM_RIGHT, (width -4, height - 4))
    image.blit(all_images.BOTTOM_LEFT, (0, height - 4))
    for i in range(height - 8):
        image.blit(all_images.SIDE, (0, i + 4))
        image.blit(all_images.SIDE, (width - 2, i + 4))
    for i in range(width - 8):
        image.blit(all_images.TOP, (i + 4, 0))
        image.blit(all_images.TOP, (i + 4, height - 2))
    return image


def draw_text(image):
    index = 0
    for i in SHOWS:
        if index > 1:
            fimage = all_images.italic_font.render(i[0], True, (0, 0, 0))
        else:
            fimage = all_images.font.render(i[0], True, (0, 0, 0))
        xpos = (SIZE - fimage.get_width()) - 16
        image.blit(fimage, (xpos, 12 + (index * 26)))
        # blit the red circles on the left
        pygame.gfxdraw.aacircle(image, 16, 12 + (index * 26), 12, (220, 50, 50))
        pygame.gfxdraw.filled_circle(image, 16, 12 + (index * 26), 12, (220, 50, 50))
        index += 1
    return image


def get_text():
    images = []
    for show in SHOWS:
        text = show[0]
        dates = show[1]
        text_image = all_images.font.render(text, True, (0, 0, 0))
        date_image = all_images.italic_font.render(', '.join(dates), True, (32, 32, 32))
        images.append([text_image, date_image])
    return images


def draw_label(width, height):
    # build all the text
    text_images = get_text()
    widths = [x[0].get_width() for x in text_images]
    widths.extend([x[1].get_width() for x in text_images])
    longest = max(widths)
    # we need a new image of size longest + space * (LINE_HEIGHT * len(text_images))
    lw = longest + BALL_SPACER + BALL_SIZE
    text_render = pygame.Surface((lw, LINE_HEIGHT * len(text_images)), pygame.SRCALPHA, 32)

    # add test band
    #pygame.gfxdraw.rectangle(text_render, (0, LINE_HEIGHT, lw, LINE_HEIGHT), (180, 180, 180))

    # now render all text
    index = 0
    for i in text_images:
        ypos = (index * LINE_HEIGHT)
        # set an xpos to right align
        xpos = longest - i[0].get_width()
        text_render.blit(i[0], (xpos, ypos))
        ypos += 15
        xpos = longest - i[1].get_width()
        text_render.blit(i[1], (xpos, ypos))
        index += 1

    # since the balls must go here, render as well
    for i in range(len(text_images)):
        ypos = (i * LINE_HEIGHT)
        xpos = longest + BALL_SPACER
        text_render.blit(all_images.BALL, (xpos, ypos))

        # finally, add text on top
        number_image = all_images.font.render(str(i + 1), True, (0, 0, 0))
        # calculate center
        xdelta = int(round((BALL_SIZE - number_image.get_width()) / 2))
        ydelta = int(round((LINE_HEIGHT - number_image.get_height()) / 2))
        text_render.blit(number_image, (xpos + xdelta, ypos + ydelta - 4))

    # calculate required size
    size = [lw, LINE_HEIGHT * len(text_images)]
    size[0] += MARGIN * 2
    size[1] += MARGIN * 2

    image = pygame.Surface((size[0], size[1]), pygame.SRCALPHA, 32)
    #image.fill((240, 240, 240))
    image = draw_borders(image, size[0], size[1])
    image.blit(text_render, (MARGIN, MARGIN))
    pygame.image.save(image, 'test.png')


def calculate_size():
    return SIZE, SIZE


if __name__ == '__main__':
    width, height = calculate_size()
    pygame.init()
    surface = pygame.display.set_mode(size=(width, height), flags=0, depth=0)
    all_images = Images()
    draw_label(width, height)
