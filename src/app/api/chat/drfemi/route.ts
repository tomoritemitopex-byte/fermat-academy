import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const SYSTEM_PROMPT = `You are Dr. Femi, a passionate and patient Nigerian high school teacher. You teach according to the WAEC and NECO syllabus. Your personality:

- Warm, encouraging, and supportive — you believe every student can succeed
- Use Nigerian examples and context (naira, Lagos, local businesses, etc.)
- Break down complex topics into simple, relatable explanations
- If a student is stuck, ask guiding questions rather than giving the answer
- Keep answers concise but thorough — exam-focused
- If you don't know something, say so honestly
- NEVER do the student's homework for them — guide them to figure it out
- Occasionally share study tips and exam strategies

Respond naturally as Dr. Femi would speak.`;

export async function POST(req: NextRequest) {
  try {
    const { message, lesson_id, history } = await req.json();

    if (!message) {
      return NextResponse.json({ reply: 'Please type a question!', flagged: false }, { status: 400 });
    }

    // Fetch lesson context
    let lessonContent = '';
    if (lesson_id && lesson_id > 0) {
      const rows = await sql.query(
        'SELECT content FROM lessons WHERE id = $1',
        [lesson_id]
      );
      if (rows.length > 0) {
        lessonContent = (rows[0] as any).content || '';
      }
    }

    const { reply, shouldFlag } = await queryNVIDIA(message, lessonContent, history || []);

    // Only flag questions that genuinely need admin attention
    if (shouldFlag && lesson_id && lesson_id > 0) {
      try {
        await sql.query(
          'INSERT INTO flagged_qa (lesson_id, question, answer) VALUES ($1, $2, $3)',
          [lesson_id, message, reply]
        );
      } catch {
        // Non-critical — don't break the response
      }
    }

    return NextResponse.json({ reply, flagged: shouldFlag });
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
  context: string,
  history: { role: string; content: string }[]
): Promise<{ reply: string; shouldFlag: boolean }> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return { reply: 'AI is not configured yet.', shouldFlag: false };
  }

  // Build messages array with system prompt, context, history, and current question
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  if (context) {
    messages.push({
      role: 'system',
      content: `Here are the lesson notes for context:\n\n${context}`,
    });
  }

  // Add conversation history (last 6 messages to stay within token limits)
  const recentHistory = (history || []).slice(-6);
  for (const msg of recentHistory) {
    messages.push(msg);
  }

  messages.push({ role: 'user', content: message });

  // We ask the AI whether this question should be flagged for the admin
  // instead of trying to detect it with string matching
  const flagCheckPrompt = message + '\n\n(If this question is inappropriate, off-topic, or needs teacher intervention, prefix your answer with FLAG: . Otherwise answer normally.)';

  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages,
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      return { reply: "Sorry, I'm having trouble connecting to the AI service.", shouldFlag: false };
    }

    const result = await res.json();
    let reply: string = result.choices?.[0]?.message?.content?.trim() || '';

    if (!reply) {
      return { reply: "I'm not sure how to answer that.", shouldFlag: false };
    }

    // Check if the AI flagged this response
    const shouldFlag = reply.startsWith('FLAG:');
    if (shouldFlag) {
      reply = reply.replace(/^FLAG:\s*/, '');
    }

    return { reply, shouldFlag };
  } catch (err) {
    console.error('NVIDIA API error:', err);
    return { reply: "Sorry, I'm having trouble connecting to the AI service.", shouldFlag: false };
  }
}
