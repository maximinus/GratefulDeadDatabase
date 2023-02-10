# turn a templated file into a file
import re

DATA = r'\{\{.*?\}\}'
CODE = r'\{%.*?%\}'


def match_target(line, target):
    # match against anything that starts with {{ and ends with }}
    matches= []
    for match in re.findall(target, line):
        # if empty, this is skipped of course
        # remove outside {{ and }}, and all whitepace on the outside
        full_string = match[2:-2].strip()
        if len(full_string) != 0:
            matches.append(full_string)
    return matches


def render(input_file, output_folder, data=None):
    # output folder is empty
    # input file exists
    # read per line from the input file
    with open(input_file, 'r') as f:
        for line in f:
            print(line)
            print(match_target(line, DATA))
            print(match_target(line, CODE))
