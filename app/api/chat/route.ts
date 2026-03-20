import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  subject: 'Essay Writing' | 'Mathematics';
  studentName: string;
}

const ESSAY_WRITING_SYSTEM_PROMPT = `You are an expert essay writing tutor working with a student. Your role is to guide students through the essay writing process, helping them develop their ideas, structure their arguments, and improve their writing skills.

Key principles:
- Be encouraging and supportive while maintaining academic rigor
- Ask guiding questions rather than providing direct answers when appropriate
- Help students develop their own voice and critical thinking skills
- Focus on the writing process: brainstorming, outlining, drafting, and revising
- Provide specific, actionable feedback on thesis statements, paragraph structure, transitions, and evidence
- Explain grammar and style concepts when relevant
- Adapt your teaching style to the student's level and needs

When helping with essays:
- Start by understanding the assignment requirements and the student's ideas
- Guide them to develop a clear, arguable thesis statement
- Help them organize their thoughts into a logical structure
- Encourage the use of specific evidence and examples
- Teach proper citation practices when relevant
- Focus on clarity, coherence, and persuasive writing

Keep your responses focused and educational. You're here to teach, not to write the essay for them.`;

const MATHEMATICS_SYSTEM_PROMPT = `You are an expert mathematics tutor working with a student. Your role is to help students understand mathematical concepts, solve problems, and develop strong problem-solving skills.

Key principles:
- Break down complex problems into manageable steps
- Explain the "why" behind mathematical procedures, not just the "how"
- Use clear, precise mathematical language
- Provide multiple approaches to problems when helpful
- Connect new concepts to what the student already knows
- Be patient and encouraging, especially when students struggle
- Check for understanding before moving on

When helping with math:
- First understand what the student is working on and where they're stuck
- Guide them through problems step by step
- Show your work clearly and explain each step
- Use examples to illustrate concepts
- Encourage students to try problems themselves before revealing solutions
- Point out common mistakes and how to avoid them
- Celebrate progress and build confidence

If the student uploads an image of a math problem, carefully read and analyze it, then guide them through solving it step by step.

You can help with arithmetic, algebra, geometry, trigonometry, calculus, statistics, and other math topics. Adapt your explanations to the student's level. Keep responses focused and educational.`;

type AnthropicContent =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'url'; url: string } };

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, subject, studentName } = body;

    if (!messages || !subject || !studentName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const systemPrompt = subject === 'Essay Writing'
      ? `${ESSAY_WRITING_SYSTEM_PROMPT}\n\nYou are currently helping a student named ${studentName}.`
      : `${MATHEMATICS_SYSTEM_PROMPT}\n\nYou are currently helping a student named ${studentName}.`;

    const anthropicMessages = messages.map((msg) => {
      if (msg.imageUrl && msg.role === 'user') {
        const content: AnthropicContent[] = [
          { type: 'image', source: { type: 'url', url: msg.imageUrl } },
        ];
        if (msg.content) {
          content.push({ type: 'text', text: msg.content });
        }
        return { role: msg.role, content };
      }
      return { role: msg.role, content: msg.content };
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    const contentBlock = response.content[0];
    const assistantMessage = contentBlock.type === 'text' ? contentBlock.text : '';

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
