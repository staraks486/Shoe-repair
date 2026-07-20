import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface VoiceToTextProps {
  onTranscription: (text: string) => void;
  className?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceToText({ onTranscription, className }: VoiceToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // Default to Indian English context

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscription(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isListening, onTranscription]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={clsx(
        "p-2 rounded-lg transition-all flex items-center justify-center gap-2",
        isListening 
          ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20" 
          : "bg-brand-bg text-brand-dark border border-brand-border hover:bg-brand-light",
        className
      )}
      title={isListening ? "Stop Recording" : "Dictate Instructions"}
    >
      {isListening ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest">Listening...</span>
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Dictate</span>
        </>
      )}
    </button>
  );
}
