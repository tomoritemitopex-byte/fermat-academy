import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  try {
    const { message, lesson_id } = await req.json();
    const user = await getSessionUser();

    if (!message) {
      return NextResponse.json({ reply: 'Message is required', flagged: false }, { status: 400 });
    }

    // Fetch lesson context
    let lessonContent = '';
    if (lesson_id && lesson_id > 0) {
      const rows = await sql.query('SELECT content FROM lessons WHERE id = $1', [lesson_id]);
      if (rows.length > 0) {
        lessonContent = (rows[0] as any).content || '';
      }
    }

    const { reply, flagged } = await queryNVIDIA(message, lessonContent);

    // Flag if the AI thinks the question needs attention
    if (flagged && lesson_id && lesson_id > 0) {
      const userId = user?.id ?? null;
      await sql.query(
        'INSERT INTO flagged_qa (user_id, lesson_id, question, answer) VALUES ($1, $2, $3, $4)',
        [userId, lesson_id, message, reply]
      );
    }

    return NextResponse.json({ reply, flagged });
  } catch (err) {
    console.error('DrFemiChat error:', err);
    return NextResponse.json(
      { reply: 'Sorry, I had trouble processing your request.', flagged: false },
      { status: 500 }
    );
  }
}

async function queryNVIDIA(
  message: string,
  context: string
): Promise<{ reply: string; flagged: boolean }> {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return {
      reply: 'AI is not configured yet. Please set NVIDIA_API_KEY.',
      flagged: false,
    };
  }

  let prompt = message;
  if (context) {
    prompt =
      'Context from lesson notes:\n' +
      context +
      '\n\nStudent question: ' +
      message +
      "\n\nAnswer the question using the context above. If the context doesn't contain the answer, answer from general knowledge and flag this.";
  }

  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
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
      return { reply: 'Sorry, I\'m having trouble connecting to the AI service.', flagged: false };
    }

    const result = await res.json();
    const reply = result.choices?.[0]?.message?.content?.trim();
    const flagged = prompt.toLowerCase().includes('flag this');

    if (reply) {
      return { reply, flagged };
    }

    return { reply: "I'm not sure how to answer that.", flagged: false };
  } catch (err) {
    console.error('NVIDIA API error:', err);
    return { reply: 'Sorry, I\'m having trouble connecting to the AI service.', flagged: false };
  }
}
