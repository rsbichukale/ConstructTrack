'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { triggerHaptic } from '../../lib/haptics';

export const VoiceDictationButton = ({ onTranscript, className = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // Indian English / Global default

    recognition.onstart = () => {
      setIsListening(true);
      triggerHaptic('light');
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      if (text && onTranscript) {
        onTranscript(text);
        triggerHaptic('success');
      }
    };

    recognition.onerror = (event) => {
      console.warn('[Voice Dictation Error]:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      triggerHaptic('light');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript]);

  if (!isSupported) return null;

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Voice recognition already started:', err);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
        isListening
          ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-500/30'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border-slate-700'
      } ${className}`}
      title={isListening ? 'Listening... Speak now' : 'Dictate note with voice'}
    >
      {isListening ? (
        <Mic className="w-4 h-4 text-white animate-bounce" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
};
