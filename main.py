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
import objects

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

FRAME_SIZE = 1024  # How many samples per frame?
FRAMES_PER_DETECT = 10 # How many frames per note detection?

console = Console() # defining Rich console

'''TODO game modes ideas::
- Only whole notes or only half notes or both
- Only 1 string or multiple strings
- implement the groups from here: https://medium.com/@aslushnikov/memorizing-fretboard-a9f4f28dbf03
    (eg. lvl 1, only E string, lvl 2, those group notes, etc.)
- Select notes from multiple string (and maybe identify what is the string that is playing)
- intervals, eg. play the perfect fourth of C
- triads, play notes after each other, eg play a C triad - C D E
- chords, play notes after each other
'''

def main():

    console.clear()
    text = Text('\nFRETBOARD LEARNER\n(press cmd+C to quit at any time)\n', justify='center')
    text.stylize('bold blue', 0, 18)
    text.stylize('grey37', 18)
    console.print(Panel(text), justify='center')

    try:

        available_game_modes = {
            'Play random notes on a given string': mode_1_random_notes,
            'Play random notes in a given scale': mode_2_scale_notes
        }

        game_mode = choose(list(available_game_modes.keys()), choice_name='game modes')

        # play selected game mode
        available_game_modes[game_mode]()

    except KeyboardInterrupt:
        console.clear()
        exit_text = Text('\nThanks for playing! :)\n', justify='center')
        exit_text.stylize('bold blue')
        console.print(Panel(exit_text))
        sys.exit()

def mode_2_scale_notes():

    console.print('\nYou need to select a key and a scale type')

    scale_key = choose(objects.NOTE_NAMES, choice_name='keys')
    scale_type = choose(list(objects.SCALES.keys()), choice_name='scales')

    scale = objects.Scale(scale_type, scale_key, add_root_as_last=False)
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
        note_color = 'red'

        while True:
            note_choice = choice(notes)
            live.update(generate_panel(notes, note_choice, note_played, note_color, score))
            if prev_note_choice == note_choice:
                continue
            else:
                prev_note_choice = note_choice

            while True:
                note_played = detect_note()
                is_right_note = note_played == note_choice
                note_color = 'green' if is_right_note else 'red'
                live.update(generate_panel(notes, note_choice, note_played, note_color, score))
                if is_right_note:
                    note_choice = '[green bold]Good job![/]'
                    score += 1
                    live.update(generate_panel(notes, note_choice, note_played, note_color, score))
                    time.sleep(1)
                    break

def generate_panel(notes, note_choice, note_played, color, score):

    if note_choice not in notes:
        # it means note_choice is 'Good job!' when the player hits the note
        play_note_row = note_choice
    else:
        play_note_row = f'Play this note: [blue bold]{note_choice}[/]'
    note_played_row = f'You played: [{color} bold]{note_played}[/]'

    all_notes_row = Text.assemble(
        ('\nAll available notes: ', 'grey53 bold'),
        ((', ').join(notes), 'grey53')
    )

    current_score_text = Text(f'\nCurrent score: {score}\n')
    current_score_text.stylize('yellow bold', 16)

    quit_text = Text('\n\n(press cmd+C to quit at any time)')
    quit_text.stylize('grey37')

    panel_group = RenderGroup(
        current_score_text,
        Panel(play_note_row),
        Panel(note_played_row),
        all_notes_row,
        quit_text
    )

    return Panel(panel_group, title='FRETBOARD LEARNER', box=box.ASCII)

   
def detect_note():

    stream = sd.Stream(channels=1, blocksize=1024, samplerate=RATE)
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

    choices_str = Text(f'Please select from the available {choice_name}:\n\n', 'bold blue')

    for i, choice in enumerate(choices):

        num = Text(str(i + 1), 'green')
        choices_str.append(Text('  [', 'white'))
        choices_str.append(num)
        choices_str.append(Text(']', 'white'))
        choices_str.append(Text(f'\t{choice}\n', 'white'))

    print(Panel(choices_str))

    inp = Prompt.ask(
        f'Choose from the {choice_name} (enter one of the numbers)',
        choices=[str(i) for i in range(1, len(choices) + 1)],
        default=1,
        show_choices=False,
        show_default=False
    )

    console.clear()

    return choices[int(inp) - 1]

if __name__ == "__main__":
    main()