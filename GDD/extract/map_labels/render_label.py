import pygame
import pygame.gfxdraw


MARGIN = 100
SIZE = MARGIN * 2

TEXT = ['Hello', 'World', 'Italics']

class Images:
    def __init__(self):
        self.BOTTOM_LEFT = pygame.image.load('gfx/bottom_left.png').convert_alpha()
        self.BOTTOM_RIGHT = pygame.image.load('gfx/bottom_right.png').convert_alpha()
        self.TOP_LEFT = pygame.image.load('gfx/top_left.png').convert_alpha()
        self.TOP_RIGHT = pygame.image.load('gfx/top_right.png').convert_alpha()
        self.SIDE = pygame.image.load('gfx/side.png').convert_alpha()
        self.TOP = pygame.image.load('gfx/top.png').convert_alpha()


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
    font = pygame.font.Font(None, 32)
    index = 0
    for i in TEXT:
        if index > 1:
            font.italic = True
        fimage = font.render(i, True, (0, 0, 0))
        xpos = (SIZE - fimage.get_width()) - 16
        image.blit(fimage, (xpos, 12 + (index * 26)))
        # blit the red circles on the left
        pygame.gfxdraw.aacircle(image, 16, 12 + (index * 26), 12, (220, 50, 50))
        pygame.gfxdraw.filled_circle(image, 16, 12 + (index * 26), 12, (220, 50, 50))
        index += 1
    return image


def draw_label(width, height):
    image = pygame.Surface((width, height), pygame.SRCALPHA, 32)
    image = draw_borders(image, width, height)
    image = draw_text(image)
    pygame.image.save(image, 'test.png')


def calculate_size():
    return SIZE, SIZE


if __name__ == '__main__':
    width, height = calculate_size()
    pygame.init()
    surface = pygame.display.set_mode(size=(width, height), flags=0, depth=0)
    all_images = Images()
    draw_label(width, height)
