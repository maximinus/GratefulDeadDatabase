import sys
import shutil
import argparse
from pathlib import Path

from html.template import render

# builder will do the following:

# build HTML files for us
# serve the project
# keep things simple

# first off, we need a template langage
# templates in builder are of the form

# {{ some_data }}
#   replaced by whatever some_data is
# {% some_instruction %}
#   replaced by whatever the instruction is

# instructions:

# {% insert "./some/html/file" %}
# all instructions must be on the same line. Same for data

# we are very opinionated, to keep things simple


def error(message):
    print(message)
    sys.exit(False)


class Builder:
    def __init__(self, opts):
        root_folder = Path.cwd()
        self.input_file = root_folder / opts.input
        if not self.input_file.exists():
            error(f'No input file {opts.input}')
        self.output_folder = root_folder / opts.output

    def build(self):
        # create dist if is does not exist
        if self.output_folder.exists():
            shutil.rmtree(self.output_folder)
        self.output_folder.mkdir()
        # join the html files
        self.join_html()

    def join_html(self):
        render(self.input_file, self.output_folder)

    @classmethod
    def from_args(cls):
        parser = argparse.ArgumentParser(prog='Builder',
                                         description='Builder - A simple static site builder',
                                         epilog='Copr. 2023 Chris Handy')
        parser.add_argument('-o', '--output', default='./dist')
        parser.add_argument('-i', '--input', default='./test_html/instructions.html')
        parser.add_argument('-d', '--data', default='data.json')
        return cls(parser.parse_args())


if __name__ == '__main__':
    options = Builder.from_args()
    options.build()
