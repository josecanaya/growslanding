import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Save to your database
    // 2. Send to your email service (Mailchimp, ConvertKit, etc.)
    // 3. Send notification email to your team
    
    // For now, we'll just log it and return success
    console.log('New lead captured:', email);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email captured successfully',
        email 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error capturing lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
