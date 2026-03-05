import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an elite longevity-focused fitness coach with deep expertise in:
- Exercise physiology and periodization
- Peter Attia's longevity framework (Zone 2, VO2 max, strength, stability)
- Inigo San Millan's metabolic health research
- Aging science and healthspan optimization

Your philosophy: training is not about aesthetics — it's about building a body that functions at the highest level for 100+ years. Every recommendation must be grounded in the science of longevity.

You will receive the user's current fitness data and profile. Use this to give highly personalized, specific, and actionable advice.

Guidelines:
- Be direct and concise. No fluff.
- Reference their actual numbers (e.g. "Your Zone 2 was 45 min this week — you're at 25% of your 180-min target")
- Prioritize the longevity pillars: Zone 2 cardio > VO2 max > strength > mobility > sleep
- If HRV is low, recommend recovery. If streak is broken, reframe it constructively.
- Give specific weekly targets, not vague advice
- When suggesting workouts, be precise: sets, reps, duration, heart rate zones
- Use the strength benchmarks to identify gaps and suggest targeted programming
- Always explain the "why" behind each recommendation using longevity science`;

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    // Build a context summary to prepend to the conversation
    const contextBlock = context ? `
## User's Current Fitness Data

**Profile:** ${context.name || 'User'}, age ${context.age}, ${context.gender}, ${context.bodyweightKg}kg

**Longevity Score:** ${context.longevityScore}/100
- Zone 2 Cardio: ${context.pillars?.zone2_cardio ?? '–'}/100
- VO2 Max: ${context.pillars?.vo2max ?? '–'}/100
- Strength: ${context.pillars?.strength ?? '–'}/100
- HRV/Readiness: ${context.pillars?.hrv_readiness ?? '–'}/100
- Mobility: ${context.pillars?.mobility ?? '–'}/100
- Sleep: ${context.pillars?.sleep_recovery ?? '–'}/100

**This Week:**
- Zone 2 minutes: ${context.weeklyZone2 ?? 0} / ${context.zone2Target ?? 180} min target
- Workouts completed: ${context.weeklyWorkouts ?? 0}
- Current streak: ${context.currentStreak ?? 0} days
- Weekly volume: ${context.weeklyVolumeKg ?? 0} kg

**Recent HRV:** ${context.latestHRV ? `${context.latestHRV}ms` : 'Not logged'}
**Latest VO2 Max:** ${context.latestVO2Max ? `${context.latestVO2Max} ml/kg/min` : 'Not logged'}
**Last sleep:** ${context.lastSleepHours ? `${context.lastSleepHours}h` : 'Not logged'}

**Strength vs benchmarks (for age ${context.age}, ${context.gender}):**
${context.strengthVsBenchmark ? context.strengthVsBenchmark : 'No benchmark data logged yet'}

**Recent sessions (last 5):**
${context.recentSessions?.length > 0
  ? context.recentSessions.map((s: { name: string; date: string; sets: number; volumeKg: number }) =>
      `- ${s.date}: ${s.name} (${s.sets} sets, ${s.volumeKg}kg volume)`
    ).join('\n')
  : 'No sessions logged yet'}
` : '';

    // Inject context into the first user message if it's the start of conversation
    const anthropicMessages = messages.map((m: { role: string; content: string }, i: number) => ({
      role: m.role as 'user' | 'assistant',
      content: i === 0 && contextBlock
        ? `${contextBlock}\n\n---\n\n${m.content}`
        : m.content,
    }));

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Coach API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get coaching response' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
