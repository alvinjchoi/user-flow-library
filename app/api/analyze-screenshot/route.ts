import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, context } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Build context prompt from existing screens
    const contextPrompt = context && context.length > 0
      ? `\n\nFor context, here are other screens in this app:\n${context
          .map((s: any) => `- ${s.title}${s.description ? `: ${s.description}` : ''}`)
          .join('\n')}`
      : '';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing mobile app screenshots. Generate a concise, descriptive title (2-5 words) and a brief description (1-2 sentences) for the screen.

Return your response in this exact JSON format:
{
  "title": "Screen Title",
  "description": "Brief description of what this screen does."
}

Guidelines:
- Title should be clear and concise (e.g., "Login Screen", "Product Details", "Shopping Cart")
- Description should explain the screen's purpose and key elements
- Use consistent naming with existing screens when possible
- Be specific but concise${contextPrompt}`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this mobile app screenshot and provide a title and description:',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const parsed = JSON.parse(response);

    return NextResponse.json({
      title: parsed.title,
      description: parsed.description,
    });
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze screenshot',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

