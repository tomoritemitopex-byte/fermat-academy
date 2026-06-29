import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ reply: 'Unauthorized', flagged: false }, { status: 401 });
    }

    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ reply: 'Message is required', flagged: false }, { status: 400 });
    }

    // Get analytics context
    const studentRows = await sql.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const contextData = (studentRows[0] as any)?.count || 0;

    const reply = await queryNVIDIAAdmin(message, `Admin analytics context: ${contextData}`);

    return NextResponse.json({ reply, flagged: false });
  } catch (err) {
    console.error('AdminChat error:', err);
    return NextResponse.json(
      { reply: 'Sorry, I had trouble processing your request.', flagged: false },
      { status: 500 }
    );
  }
}

async function queryNVIDIAAdmin(message: string, context: string): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return 'AI is not configured yet. Please set NVIDIA_API_KEY.';
  }

  const prompt = `You are an analytics assistant for Fermat Academy admin. ${context}\n\nAdmin question: ${message}`;

  try {
    const res = await fetch('https://api.nvcf.nvidia.com/v2/llm/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      return "Sorry, I'm having trouble connecting to the AI service.";
    }

    const result = await res.json();
    const reply = result.choices?.[0]?.message?.content?.trim();
    return reply || "I'm not sure how to answer that.";
  } catch (err) {
    console.error('NVIDIA API error:', err);
    return "Sorry, I'm having trouble connecting to the AI service.";
  }
}
