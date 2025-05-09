# Sound Files for Slot Machine

This directory should contain the following sound effect files for the slot machine to work with audio:

1. `lever-pull.mp3` - The sound of the lever being pulled
2. `spinning.mp3` - The sound of the reels spinning (looping sound)
3. `win.mp3` - The celebratory sound when the player wins

## Sound Credits

For demonstration purposes, you should add sound files with appropriate licensing. Here are some suggestions:

- You can find free sound effects on websites like [Freesound](https://freesound.org/) or [Mixkit](https://mixkit.co/free-sound-effects/game/)
- Make sure to check the licensing requirements for any sounds you use
- Consider creating your own sounds if needed

## Implementation Notes

The slot machine app uses the Web Audio API to play these sounds. The files should be in MP3 format for maximum browser compatibility.

If you're using custom files, update the file names in the `useSoundEffects.ts` file if necessary. 