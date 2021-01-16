# fretboard-learner
Learn the fretboard of your guitar with this simple command-line app.

## TESTED ONLY ON MACOS WITH PYTHON 3.7!

![Screenshot from app running in terminal](screenshot.png?raw=true)

### How it works
Fretboard Learner is a very simple command line app which can help you remember where the notes are on the fretboard.
It tells you a randomly selected note that you need to play on your guitar and then listens to your microphone input to tell which note you are playing.
It doesn't pick a new note until you find the correct note.

### Installation & running
- Install portaudio with homebrew using the command `brew install portaudio` (if you don't have homebrew install it from [here](https://brew.sh/))
- Install required packages from requirements.txt with `python -m pip install -r requirements.txt`
- Go to your terminal and run main.py `python main.py`
- When you first run the program, you will need to authorize access to your microphone like you see below, just click "yes"
![Screenshot of microphone authorization](terminal-notification.png?raw=true)
- Input the string you want to play on (E, A, D, G, B or e)
- Play the notes written in the terminal window
- If you play the correct note, it will move along to a next, randomly selected note
- If you want to quit any time, press cmd+c

### Troubleshooting
If you are having problems with installing pyaudio, because portaudio.h could not be found (still after installing it via homebrew), then it might be that you have homebrew installed in a non-standard directory, just as I had on one laptop I tested. If that is the issue, follow the steps [here](http://www.cdotson.com/2019/03/installing-pyaudio-on-macos/), but **keep in mind that your homebrew install directory might not be the same as the steps specify**. For example, the exact steps for me were (notice for me homebrew was in `/opt/homebrew` and not in `~/homebrew`:
```export C_INCLUDE_PATH=/opt/homebrew/include/:$C_INCLUDE_PATH
export LIBRARY_PATH=/opt/homebrew/lib/:$LIBRARY_PATH
```
After this, pip install pyaudio worked flawlessly (and it took me only 2 frustrated hours to figure this out...)
