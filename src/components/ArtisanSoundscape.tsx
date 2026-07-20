import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Hammer, 
  Flame, 
  Clock, 
  Compass,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type SoundPreset = 'studio' | 'buffing' | 'tapping' | 'hearth';

export default function ArtisanSoundscape() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePreset, setActivePreset] = useState<SoundPreset>('studio');
  const [volume, setVolume] = useState(0.4);
  const [showInfo, setShowInfo] = useState(false);

  // Audio nodes and context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sound source refs
  const sourcesRef = useRef<{
    noiseNode?: AudioWorkletNode | ScriptProcessorNode;
    noiseGain?: GainNode;
    lfo?: OscillatorNode;
    clockInterval?: NodeJS.Timeout;
    tapInterval?: NodeJS.Timeout;
    crackInterval?: NodeJS.Timeout;
  }>({});

  // Initialize Audio Context and core routing
  const initAudio = () => {
    if (audioCtxRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Analyser for real-time visualization
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Main Gain
      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(volume, ctx.currentTime);
      mainGainRef.current = mainGain;

      // Routing: Sources -> Main Gain -> Analyser -> Destination
      mainGain.connect(analyser);
      analyser.connect(ctx.destination);
    } catch (err) {
      console.error('Failed to initialize AudioContext:', err);
    }
  };

  // Handle play/pause toggle
  const togglePlay = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (isPlaying) {
      ctx.suspend().then(() => {
        setIsPlaying(false);
        stopAllSounds();
      });
    } else {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      setIsPlaying(true);
      startPreset(activePreset);
    }
  };

  // Adjust overall volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (mainGainRef.current && audioCtxRef.current) {
      mainGainRef.current.gain.setValueAtTime(val, audioCtxRef.current.currentTime);
    }
  };

  // Stop all synthesis loops and nodes
  const stopAllSounds = () => {
    const s = sourcesRef.current;
    if (s.noiseNode) {
      try { s.noiseNode.disconnect(); } catch (e) {}
      s.noiseNode = undefined;
    }
    if (s.noiseGain) {
      try { s.noiseGain.disconnect(); } catch (e) {}
      s.noiseGain = undefined;
    }
    if (s.lfo) {
      try { s.lfo.stop(); s.lfo.disconnect(); } catch (e) {}
      s.lfo = undefined;
    }
    if (s.clockInterval) {
      clearInterval(s.clockInterval);
      s.clockInterval = undefined;
    }
    if (s.tapInterval) {
      clearInterval(s.tapInterval);
      s.tapInterval = undefined;
    }
    if (s.crackInterval) {
      clearInterval(s.crackInterval);
      s.crackInterval = undefined;
    }
  };

  // Generate continuous procedural white/pink noise
  const createNoiseBuffer = (ctx: AudioContext) => {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Filter white noise to create soft pink noise (cozier, deeper frequency roll-off)
      output[i] = 0.12 * lastOut + 0.11 * white;
      lastOut = output[i];
    }
    return noiseBuffer;
  };

  // Synthesize specific presets on the fly using Web Audio APIs
  const startPreset = (preset: SoundPreset) => {
    stopAllSounds();
    const ctx = audioCtxRef.current;
    const mainGain = mainGainRef.current;
    if (!ctx || !mainGain || ctx.state === 'suspended') return;

    if (preset === 'studio') {
      // 1. Cozy studio: Gentle background ticking (grandfather clock style) + soft airy breeze
      const noiseBuffer = createNoiseBuffer(ctx);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(150, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);

      noiseSource.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(mainGain);
      noiseSource.start();

      sourcesRef.current.noiseGain = noiseGain;

      // Vintage Ticking Clock
      const triggerTick = () => {
        const time = ctx.currentTime;
        const osc = ctx.createOscillator();
        const tickGain = ctx.createGain();
        const bandpass = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, time);

        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(1400, time);
        bandpass.Q.setValueAtTime(12, time);

        tickGain.gain.setValueAtTime(0.0, time);
        tickGain.gain.linearRampToValueAtTime(0.2, time + 0.002);
        tickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

        osc.connect(bandpass);
        bandpass.connect(tickGain);
        tickGain.connect(mainGain);

        osc.start(time);
        osc.stop(time + 0.06);
      };

      // Interval for rhythmic clock ticks
      triggerTick();
      sourcesRef.current.clockInterval = setInterval(triggerTick, 1000);

    } else if (preset === 'buffing') {
      // 2. Leather Buffing & Polishing: Modulated sliding sweeps using white noise & low frequency oscillator
      const noiseBuffer = createNoiseBuffer(ctx);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.Q.setValueAtTime(4.5, ctx.currentTime);

      const sweepGain = ctx.createGain();
      sweepGain.gain.setValueAtTime(0.12, ctx.currentTime);

      // Create an LFO to sweep the bandpass filter frequency back and forth (mimicking rhythmic sliding)
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.4, ctx.currentTime); // 0.4 Hz slide frequency

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(180, ctx.currentTime); // sweep width

      // Map: LFO -> lfoGain -> bandpass.frequency
      lfo.connect(lfoGain);
      lfoGain.connect(bandpass.frequency);
      bandpass.frequency.setValueAtTime(320, ctx.currentTime); // base sweep frequency

      noiseSource.connect(bandpass);
      bandpass.connect(sweepGain);
      sweepGain.connect(mainGain);

      lfo.start();
      noiseSource.start();

      sourcesRef.current.lfo = lfo;
      sourcesRef.current.noiseGain = sweepGain;

    } else if (preset === 'tapping') {
      // 3. Shoemaker's Tack Tapping: Procedural metallic tack hammering at rhythmic, handmade-intervals
      const triggerTap = () => {
        const time = ctx.currentTime;
        // Two oscillators to create a slightly metallic, hollow hammer strike
        const oscPrimary = ctx.createOscillator();
        const oscMetallic = ctx.createOscillator();
        const tapGain = ctx.createGain();
        const bandpass = ctx.createBiquadFilter();

        oscPrimary.type = 'triangle';
        oscPrimary.frequency.setValueAtTime(310, time);

        oscMetallic.type = 'sine';
        oscMetallic.frequency.setValueAtTime(1450, time);

        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(450, time);
        bandpass.Q.setValueAtTime(3, time);

        tapGain.gain.setValueAtTime(0.0, time);
        // Instant sharp attack, quick ring-out decay
        tapGain.gain.linearRampToValueAtTime(0.18, time + 0.001);
        tapGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

        oscPrimary.connect(bandpass);
        oscMetallic.connect(bandpass);
        bandpass.connect(tapGain);
        tapGain.connect(mainGain);

        oscPrimary.start(time);
        oscMetallic.start(time);
        oscPrimary.stop(time + 0.16);
        oscMetallic.stop(time + 0.16);
      };

      // Simulated manual shoemaker pacing: randomized intervals
      const scheduler = () => {
        triggerTap();
        // Generates organic tapping variations
        const nextTime = 600 + Math.random() * 500;
        sourcesRef.current.tapInterval = setTimeout(scheduler, nextTime);
      };

      scheduler();

    } else if (preset === 'hearth') {
      // 4. Cozy Hearth Fire: Low-rumble fire wind + random crackling ember sparks
      const noiseBuffer = createNoiseBuffer(ctx);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(110, ctx.currentTime);

      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.14, ctx.currentTime);

      noiseSource.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(mainGain);
      noiseSource.start();

      sourcesRef.current.noiseGain = rumbleGain;

      // Random Crackling sparks trigger
      const triggerSpark = () => {
        const time = ctx.currentTime;
        const sparkOsc = ctx.createOscillator();
        const sparkGain = ctx.createGain();
        const bandpass = ctx.createBiquadFilter();

        sparkOsc.type = 'sawtooth';
        sparkOsc.frequency.setValueAtTime(2200 + Math.random() * 1000, time);

        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(2800, time);
        bandpass.Q.setValueAtTime(15, time);

        sparkGain.gain.setValueAtTime(0.0, time);
        sparkGain.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.08, time + 0.001);
        sparkGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.015);

        sparkOsc.connect(bandpass);
        bandpass.connect(sparkGain);
        sparkGain.connect(mainGain);

        sparkOsc.start(time);
        sparkOsc.stop(time + 0.02);
      };

      const scheduler = () => {
        // Trigger multi-point crackling offsets
        triggerSpark();
        if (Math.random() > 0.4) {
          setTimeout(triggerSpark, 30 + Math.random() * 60);
        }
        sourcesRef.current.crackInterval = setTimeout(scheduler, 150 + Math.random() * 450);
      };

      scheduler();
    }
  };

  // Change preset handler
  const handlePresetChange = (preset: SoundPreset) => {
    setActivePreset(preset);
    if (isPlaying) {
      startPreset(preset);
    }
  };

  // HTML Canvas circular audio rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      ctx.clearRect(0, 0, width, height);

      const analyser = analyserRef.current;
      const bufferLength = analyser ? analyser.frequencyBinCount : 128;
      const dataArray = new Uint8Array(bufferLength);

      if (isPlaying && analyser) {
        analyser.getByteTimeDomainData(dataArray);
      } else {
        // Flatline idle waveform if not active
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = 128;
        }
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = 55;

      ctx.beginPath();
      ctx.lineWidth = 1.5;
      
      // Draw dynamic concentric wave paths
      for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * Math.PI * 2;
        // Map PCM byte domain [0, 255] around 128 to clean visual ripples
        const amplitude = (dataArray[i] - 128) / 128.0;
        const currentRadius = baseRadius + amplitude * 18;

        const x = centerX + Math.cos(angle) * currentRadius;
        const y = centerY + Math.sin(angle) * currentRadius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();
      
      // Elegant gold coloring to match Cordwainers Studio visual branding
      if (isPlaying) {
        ctx.strokeStyle = 'rgba(139, 92, 26, 0.6)'; // Rich warm gold/amber
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(217, 119, 6, 0.3)';
      } else {
        ctx.strokeStyle = 'rgba(107, 114, 128, 0.15)'; // Subdued grey line
        ctx.shadowBlur = 0;
      }
      ctx.stroke();

      // Soft decorative inner circle mimicking leather fine stitching details
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius - 6, 0, Math.PI * 2);
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = isPlaying ? 'rgba(139, 92, 26, 0.2)' : 'rgba(107, 114, 128, 0.08)';
      ctx.stroke();
      ctx.setLineDash([]); // Reset
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Handle unmount safety
  useEffect(() => {
    return () => {
      stopAllSounds();
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  const presets = [
    { id: 'studio' as SoundPreset, icon: Clock, label: 'Quiet Studio', desc: 'Slight breeze & rhythmic clocks' },
    { id: 'buffing' as SoundPreset, icon: Compass, label: 'Friction Buffer', desc: 'Rhythmic leather burnishing sweeps' },
    { id: 'tapping' as SoundPreset, icon: Hammer, label: 'Artisan Tap', desc: 'Gentle organic cobbler hammering' },
    { id: 'hearth' as SoundPreset, icon: Flame, label: 'Studio Hearth', desc: 'Warm low rumble & crackling sparks' },
  ];

  return (
    <div id="artisan-soundscape-widget" className="premium-card p-6 bg-white border border-brand-border/60 relative overflow-hidden space-y-5">
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none" />
      
      {/* Widget Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 shadow-sm shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-brand-dark uppercase tracking-wider">Artisan Focus Soundscape</h4>
            <p className="text-[8px] text-brand-muted uppercase tracking-widest font-black leading-none mt-0.5">Procedural Synthesis Mode</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-1.5 rounded-full bg-brand-bg text-brand-muted hover:text-brand-dark transition-colors"
          title="Soundscape Info"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden text-[9px] text-brand-muted uppercase tracking-tight leading-normal bg-brand-bg/50 p-3 rounded-xl border border-brand-border/40 font-bold"
          >
            Synthesizes comforting workshop white noise in real-time. Zero download overhead. Zero network latency. Focus on your repairs.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Synthesis Circular Visualizer and Interactive Playback Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
        
        {/* Dynamic circular canvas */}
        <div className="relative shrink-0 flex items-center justify-center">
          <canvas 
            ref={canvasRef} 
            width={150} 
            height={150} 
            className="w-[130px] h-[130px] rounded-full"
          />
          
          {/* Centered circular toggle button */}
          <button
            onClick={togglePlay}
            className={`absolute w-[80px] h-[80px] rounded-full flex flex-col items-center justify-center transition-all duration-500 ${
              isPlaying 
                ? 'bg-amber-700/15 border-2 border-amber-600/30 text-amber-800 shadow-inner' 
                : 'bg-brand-bg border border-brand-border hover:bg-amber-50 hover:border-amber-200 text-brand-dark shadow-sm'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 text-amber-700 animate-pulse" />
            ) : (
              <Play className="w-7 h-7 translate-x-0.5 text-brand-olive" />
            )}
            <span className="text-[7px] font-black uppercase tracking-widest mt-1">
              {isPlaying ? 'ACTIVE' : 'OFFLINE'}
            </span>
          </button>
        </div>

        {/* Dynamic Parameter Settings Panel */}
        <div className="flex-1 w-full space-y-3">
          <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Select Sound Preset</p>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetChange(preset.id)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden ${
                  activePreset === preset.id
                    ? 'border-amber-600/40 bg-amber-500/5 shadow-sm'
                    : 'border-brand-border hover:border-brand-dark/20 bg-brand-bg/30'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <preset.icon className={`w-3.5 h-3.5 ${activePreset === preset.id ? 'text-amber-700' : 'text-brand-muted'}`} />
                  {activePreset === preset.id && isPlaying && (
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-600"></span>
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <span className={`text-[9px] font-black uppercase tracking-tight block ${
                    activePreset === preset.id ? 'text-amber-800' : 'text-brand-dark'
                  }`}>
                    {preset.label}
                  </span>
                  <span className="text-[7px] font-bold uppercase text-brand-muted mt-0.5 leading-none block truncate opacity-70">
                    {preset.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Volume Control bar */}
          <div className="pt-2 flex items-center gap-3">
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-brand-muted" />
            ) : (
              <Volume2 className="w-4 h-4 text-brand-muted" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-amber-700"
            />
            <span className="text-[8px] font-mono font-bold text-brand-muted uppercase">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
