import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Claude API key not set' }, { status: 500 });
  }

  const body = await req.json();
  const { messages } = body;
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
  }

  // Convert messages to Anthropic format
  const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
    role: m.role === 'user' ? 'user' as const : 'assistant' as const,
    content: [{ type: 'text' as const, text: m.content }],
  }));

  // Remove keyword check; always pass context to Claude
  // Fetch available sessions for the user (if logged in)
  const sessionToken = req.cookies.get('session')?.value;
  let user = null;
  if (sessionToken) {
    user = await verifySession(sessionToken);
  }
  let sessions: any[] = [];
  let registeredSessions: any[] = [];
  if (user) {
    const userWithGroup = await db.user.findUnique({
      where: { id: user.id },
      include: {
        menteeOf: true,
        sessionAttendances: {
          include: {
            session: {
              include: {
                group: true,
                mentor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                },
                _count: {
                  select: { attendances: true }
                }
              }
            }
          }
        },
      }
    });
    // Sessions user is registered for
    registeredSessions = (userWithGroup?.sessionAttendances || []).map(a => a.session);
    // Sessions user can book (not already registered)
    sessions = await db.mentoringSession.findMany({
      where: {
        OR: [
          { isPublic: true },
          ...(userWithGroup?.menteeOf ? [{ groupId: userWithGroup.menteeOf.id }] : []),
        ]
      },
      include: {
        group: true,
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: { attendances: true }
        }
      },
      orderBy: { date: 'asc' },
      take: 10,
    });
    // Filter out sessions the user is already registered for
    const registeredSessionIds = new Set(registeredSessions.map(s => s.id));
    sessions = sessions.filter(s => !registeredSessionIds.has(s.id));
  } else {
    sessions = await db.mentoringSession.findMany({
      where: { isPublic: true },
      include: {
        group: true,
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: { attendances: true }
        }
      },
      orderBy: { date: 'asc' },
      take: 10,
    });
  }
  const now = new Date();
  const upcomingSessions = sessions.filter(s => new Date(s.date) > now);
  const sessionJson = JSON.stringify(upcomingSessions.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    location: s.location,
    isPublic: s.isPublic,
    category: s.category,
    maxCapacity: s.maxCapacity,
    mentor: s.mentor,
    group: s.group,
    _count: s._count,
  })), null, 2);
  const registeredJson = JSON.stringify(registeredSessions.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    location: s.location,
    isPublic: s.isPublic,
    category: s.category,
    maxCapacity: s.maxCapacity,
    mentor: s.mentor,
    group: s.group,
    _count: s._count,
  })), null, 2);

  const systemPrompt = `
You are a helpful assistant for a programming mentorship dashboard.
- When answering, use markdown for clarity and variety:
  - Use bullet points for lists or options.
  - Use **bold** for key terms, session names, or actions.
  - Use headings or italics for sections if helpful.
  - Use emojis for a friendly tone if appropriate.
- Give clear, visually structured answers.
- If the user is asking for a session suggestion (and only if they are not asking a general question), include a JSON array of the best session(s) (best first, up to 3) between <!--SESSION_SUGGESTIONS_START--> and <!--SESSION_SUGGESTIONS_END-->.
- If not, do not include any session JSON block.
- If there are no relevant sessions, include an empty array and a helpful message.
- Also, if the user is already registered for any upcoming or past sessions, mention these in your answer (e.g., remind them to attend, or reflect on past sessions). Use the registeredSessions list for this.
- Otherwise, answer normally. Only include the session block for bookable sessions.

Example:
User: Suggest a session for learning algorithms
Assistant:
**Here are some great options for learning algorithms:**

- **Python Basics**
  *Date:* July 19, 2025  
  *Mentor:* Jiuyu Zhang  
  *Location:* MPEB 1002
- **Advanced Algorithms**
  *Date:* August 2, 2025  
  *Mentor:* Alice Smith  
  *Location:* ENG 201

You are already registered for:
- **Intro to Programming** (July 10, 2025)

<!--SESSION_SUGGESTIONS_START-->
[{"id":"1","title":"Python Basics"},{"id":"2","title":"Advanced Algorithms"}]
<!--SESSION_SUGGESTIONS_END-->

If the user asks a general question, just answer in markdown as above, without a session block. Only provide a session block when it is important and actually required, and if the user is requesting it.`;

  const userPrompt = `Here are the available sessions you can book as JSON:\n\n${sessionJson}\n\nHere are the sessions you are already registered for as JSON:\n\n${registeredJson}\n\nUser's latest message: ${messages[messages.length-1]?.content || ''}`;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        ...anthropicMessages,
        { role: 'user', content: [{ type: 'text', text: userPrompt }] },
      ],
    });
    const text = msg.content.find(block => block.type === 'text')?.text || '';
    return NextResponse.json({ completion: text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Claude API error' }, { status: 500 });
  }
} 