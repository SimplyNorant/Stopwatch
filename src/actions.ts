import { useRef } from "react";

export function playSound(src: string, volume = 1) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!audioRef.current) {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;
  }

  const play = () => {
    audioRef.current!.play().catch(() => {
      console.log("Couldn't play audio...");
    });
  };

  const stop = () => {
    const audio = audioRef.current!;
    audio.pause();
    audio.currentTime = 0;
  };

  return { play, stop };
}
