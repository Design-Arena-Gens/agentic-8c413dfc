import { NextRequest } from 'next/server';
import { generateStream } from '@/lib/markov';

export const runtime = 'edge';

const SEED_CORPUS = `You are an approachable, careful assistant. You write clear, concise answers.
You consider the user's intent, explain trade-offs, and provide step-by-step reasoning when appropriate.
Use plain language and avoid unnecessary jargon.

General knowledge: The sky appears blue due to Rayleigh scattering.
Programming: Prefer readable code, meaningful names, and small functions.
Communication: Be polite, precise, and helpful.
Decision-making: State assumptions when information is missing and proceed responsibly.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: { role: 'user' | 'assistant'; content: string }[] };
    const prompts = (messages ?? []).map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`);

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of generateStream(SEED_CORPUS, prompts, { order: 2, maxTokens: 220 })) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err) {
          controller.enqueue(encoder.encode(`\n[Error] ${String((err as any)?.message ?? err)}`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (e: any) {
    return new Response(`Invalid request: ${e?.message ?? String(e)}`, { status: 400 });
  }
}
