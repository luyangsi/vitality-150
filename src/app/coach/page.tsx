'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { useLongevityMetrics } from '@/hooks/useLongevityMetrics';
import { useStreaks } from '@/hooks/useStreaks';
import { computeLongevityScore } from '@/lib/calculations/longevityScore';
import { aggregateWeeklyZone2 } from '@/lib/calculations/zone2';
import { Button } from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';
import { subDays, format } from 'date-fns';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_PROMPTS = [
  "What should I focus on this week to improve my longevity score?",
  "My Zone 2 is below target — give me a specific plan to fix it.",
  "Design a 4-week strength program based on my current benchmarks.",
  "My HRV has been low. What does that mean and what should I do?",
  "How do I estimate my VO2 max without a lab test?",
  "What's the minimum effective dose of exercise for longevity?",
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { sessions } = useWorkoutSessions();
  const { state: longevityState } = useLongevityMetrics();
  const { currentStreak, weeklyWorkouts } = useStreaks(sessions);

  const score = computeLongevityScore(longevityState);
  const profile = longevityState.profile;
  const age = new Date().getFullYear() - profile.birthYear;
  const weeklyZone2 = aggregateWeeklyZone2(sessions, longevityState.dailyLogs, new Date());

  const weeklyVolumeKg = Math.round(
    sessions
      .filter(s => s.status === 'completed' && s.date >= format(subDays(new Date(), 6), 'yyyy-MM-dd'))
      .flatMap(s => s.exercises.flatMap(e => e.sets.filter(st => !st.isWarmup)))
      .reduce((sum, st) => sum + st.weight * st.reps, 0)
  );

  const recentSessions = sessions
    .filter(s => s.status === 'completed')
    .slice(0, 5)
    .map(s => ({
      name: s.name,
      date: formatDate(s.date, 'MMM d'),
      sets: s.exercises.flatMap(e => e.sets.filter(st => !st.isWarmup)).length,
      volumeKg: Math.round(s.exercises.flatMap(e => e.sets.filter(st => !st.isWarmup)).reduce((sum, st) => sum + st.weight * st.reps, 0)),
    }));

  const latestBench = longevityState.strengthBenchmarks.at(-1);
  const strengthVsBenchmark = latestBench
    ? `Grip: ${latestBench.gripStrengthKg ?? '–'}kg | Leg press ratio: ${latestBench.legPressRatio ?? '–'}x | Push-ups: ${latestBench.pushUpCount ?? '–'}`
    : null;

  const context = {
    name: profile.name,
    age,
    gender: profile.gender,
    bodyweightKg: profile.bodyweightKg,
    longevityScore: score.overall,
    pillars: score.breakdown,
    weeklyZone2,
    zone2Target: profile.zone2WeeklyTargetMinutes,
    weeklyWorkouts,
    currentStreak,
    weeklyVolumeKg,
    latestHRV: longevityState.dailyLogs.findLast(l => l.hrv)?.hrv?.hrvMs,
    latestVO2Max: longevityState.vo2MaxHistory.at(-1)?.estimatedVO2Max,
    lastSleepHours: longevityState.dailyLogs.findLast(l => l.sleepHours)?.sleepHours,
    strengthVsBenchmark,
    recentSessions,
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: messages.length === 0 ? context : undefined, // only send context on first message
        }),
      });

      if (!res.ok) throw new Error('API error');
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: full };
          return updated;
        });
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Check that your ANTHROPIC_API_KEY is set in Vercel environment variables.',
        };
        return updated;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-vitality-500" />
            AI Coach
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Personalized advice based on your data · Powered by Claude
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
            <RefreshCw className="w-3.5 h-3.5" /> New chat
          </Button>
        )}
      </div>

      {/* Context pill */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: 'Score', value: `${score.overall}/100` },
          { label: 'Zone 2', value: `${weeklyZone2}/${profile.zone2WeeklyTargetMinutes}min` },
          { label: 'Streak', value: `${currentStreak}d` },
          { label: 'Age', value: `${age}yo` },
        ].map(item => (
          <span key={item.label} className="text-xs bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-slate-400">
            <span className="text-slate-500">{item.label}: </span>
            <span className="text-vitality-500 font-mono font-medium">{item.value}</span>
          </span>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-vitality-500/10 border border-vitality-500/20 flex items-center justify-center mx-auto mb-4 shadow-vitality">
                <Bot className="w-8 h-8 text-vitality-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-200">Your Longevity Coach</h2>
              <p className="text-slate-400 text-sm mt-1 max-w-sm">
                Ask anything about your training, recovery, or longevity goals. I have full access to your data.
              </p>
            </div>

            {/* Starter prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              {STARTER_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-vitality-500/30 rounded-xl px-4 py-3 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-vitality-500/10 border border-vitality-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-vitality-500" />
                </div>
              )}
              <div className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-vitality-500/15 border border-vitality-500/20 text-slate-100'
                  : 'bg-slate-800 border border-slate-700 text-slate-200'
              )}>
                {msg.content
                  ? msg.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))
                  : <span className="text-slate-500 animate-pulse">Thinking...</span>
                }
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2 items-end bg-slate-800 border border-slate-700 rounded-2xl p-3 focus-within:border-vitality-500/40 transition-colors">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your coach anything..."
          rows={1}
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none max-h-32"
          style={{ fieldSizing: 'content' } as React.CSSProperties}
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          size="sm"
          className="flex-shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
      <p className="text-xs text-slate-600 text-center mt-2">Enter to send · Shift+Enter for new line</p>
    </div>
  );
}
