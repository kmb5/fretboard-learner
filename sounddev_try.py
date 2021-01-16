import time
import sys
from random import choice
import sounddevice as sd
import numpy as np
from aubio import pitch
from rich.live import Live
from rich.console import RenderGroup
from rich.panel import Panel
from rich.text import Text
from rich.prompt import Prompt
from rich.console import Console
from rich import box, print
from helpers import pitch2note, NOTES_PER_STRING
from objects import SCALES, NOTE_NAMES, Scale

# Set up constants for audio input & pitch detection
RATE = 44100
TOLERANCE = 0.8
DOWNSAMPLE = 1
WIN_S = 2048 // DOWNSAMPLE # fft size
HOP_S = 1024  // DOWNSAMPLE # hop size

pitch_o = pitch("yinfft", WIN_S, HOP_S, RATE)
pitch_o.set_unit("Hz")
pitch_o.set_silence(-40)
pitch_o.set_tolerance(TOLERANCE)

FRAME_SIZE = 1024   # How many samples per frame?
FRAMES_PER_DETECT = 10

console = Console() # defining Rich console

def main():

    console.clear()
    text = Text('\nFRETBOARD LEARNER\n(press cmd+C to quit at any time)\n', justify='center')
    text.stylize('bold blue', 0, 18)
    text.stylize('grey37', 18)
    console.print(Panel(text), justify='center')

    try:
        game_mode_selector = Text.assemble(
            ('Please select from the following game modes:\n\n', 'bold blue'),
            '  (',
            ('1', 'green'),
            ') Play random notes on a given string\n',
            '  (',
            ('2', 'green'),
            ') Play random notes in a given scale\n')

        console.print(Panel(game_mode_selector))

        inp = Prompt.ask(
            'Select the game mode',
            default='1',
            choices=['1', '2'],
            show_default=False,
            show_choices=False
        )

        if inp == '1':
            mode_1_random_notes()
        elif inp == '2':
            mode_2_scale_notes()
    except KeyboardInterrupt:
        console.clear()
        exit_text = Text('\nThanks for playing! :)\n', justify='center')
        exit_text.stylize('bold blue')
        console.print(Panel(exit_text))
        sys.exit()

def mode_2_scale_notes():

    console.print('\nYou need to select a key and a scale type')

    scale_key = choose(NOTE_NAMES, choice_name='keys')
    scale_type = choose(list(SCALES.keys()), choice_name='scales')

    scale = Scale(scale_type, scale_key, add_root_as_last=False)
    notes = scale.notes

    play_mode(notes)


def mode_1_random_notes():
    
    strings = list(NOTES_PER_STRING.keys())
    string = choose(strings, choice_name='strings')
    notes = NOTES_PER_STRING[string]
    notes = [note[:-1] for note in notes]

    play_mode(notes)

def play_mode(notes):

    console.clear()

    score = 0
    prev_note_choice = None

    with Live(refresh_per_second=20) as live:
        note_choice = ''
        note_played = ''
        color = 'red'

        while True:
            note_choice = choice(notes)
            row1 = f'Play this note: {note_choice}'
            live.update(generate_panel(row1, note_played, color, score))
            if prev_note_choice == note_choice:
                continue
            else:
                prev_note_choice = note_choice

            while True:
                note_played = detect_note()
                is_right_note = note_played == note_choice
                #sys.stdout.write(f'\rYou played: {note_played}  ')
                color = 'green' if is_right_note else 'red' 
                live.update(generate_panel(row1, note_played, color, score))
                if is_right_note:
                    row1 = '[green]Good job![/]'
                    score += 1
                    live.update(generate_panel(row1, note_played, color, score))
                    # we hit the desired note
                    time.sleep(1)
                    break

def generate_panel(row1, note_played, color, score):

    row2 = f'[{color}]You played:  {note_played}  [/]'

    current_score_text = Text(f'\nCurrent score: {score}')
    current_score_text.stylize('yellow', 16)

    panel_group = RenderGroup(
        current_score_text,
        Panel(row1),
        Panel(row2)
    )

    return Panel(panel_group, title='FRETBOARD LEARNER', box=box.ASCII)

   
def detect_note():

    stream = sd.Stream(channels=1, blocksize=1024)
    stream.start()
    notes_list = []

    while True:
        buf = np.frombuffer(stream.read(FRAME_SIZE)[0], np.float32)
        pitch_of_sample = pitch_o(buf)[0]
        if pitch_of_sample:
            note_played = pitch2note(pitch_of_sample)
            notes_list.append(note_played[:-1])

            if len(notes_list) == FRAMES_PER_DETECT:
                most_likely_note = max(notes_list, key=notes_list.count)
                stream.stop()
                stream.close()
                return most_likely_note


def choose(choices, choice_name='choices'):

    console.clear()

    choices_str = Text.assemble(
        (f'Please select from the available {choice_name}:\n', 'bold blue'),
        '- ' + ("\n- ").join(choices)
    )
    console.print(Panel(choices_str))

    inp = Prompt.ask(
        f'Choose from the {choice_name}',
        choices=choices + [x.lower() for x in choices] + [x.title() for x in choices],
        default=choices[0],
        show_choices=False,
        show_default=False
    )

    return inp

if __name__ == "__main__":
    main()