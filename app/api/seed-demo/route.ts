import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// This endpoint creates a demo user for testing purposes
// Only works in development or when explicitly enabled

export async function POST() {
  // Create admin client with service role key
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const demoEmail = 'demo@researchflow.app'
  const demoPassword = 'demo123456'

  try {
    // Check if demo user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const demoUser = existingUsers?.users?.find(u => u.email === demoEmail)

    if (demoUser) {
      // Update profile to complete onboarding
      await supabaseAdmin
        .from('profiles')
        .update({
          full_name: 'Demo Researcher',
          university_id: null,
          department: 'Computer Science',
          academic_level: 'masters',
          bio: 'A demo account to explore ResearchFlow features.',
          roles: ['student_researcher'],
          research_interests: ['Machine Learning', 'Data Science', 'AI Ethics'],
          skills: ['Python', 'TensorFlow', 'Data Analysis', 'Technical Writing'],
          looking_for: ['Data Scientists', 'Research Advisors', 'Co-authors'],
          weekly_hours_available: 20,
          onboarding_completed: true,
          onboarding_step: 5
        })
        .eq('id', demoUser.id)

      return NextResponse.json({ 
        success: true, 
        message: 'Demo user already exists and profile updated',
        email: demoEmail,
        password: demoPassword
      })
    }

    // Create demo user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Demo Researcher'
      }
    })

    if (createError) {
      console.error('Error creating demo user:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Update profile with demo data
    if (newUser?.user) {
      await supabaseAdmin
        .from('profiles')
        .update({
          full_name: 'Demo Researcher',
          department: 'Computer Science',
          academic_level: 'masters',
          bio: 'A demo account to explore ResearchFlow features.',
          roles: ['student_researcher'],
          research_interests: ['Machine Learning', 'Data Science', 'AI Ethics'],
          skills: ['Python', 'TensorFlow', 'Data Analysis', 'Technical Writing'],
          looking_for: ['Data Scientists', 'Research Advisors', 'Co-authors'],
          weekly_hours_available: 20,
          onboarding_completed: true,
          onboarding_step: 5
        })
        .eq('id', newUser.user.id)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Demo user created successfully',
      email: demoEmail,
      password: demoPassword
    })
  } catch (error) {
    console.error('Error in seed-demo:', error)
    return NextResponse.json({ error: 'Failed to create demo user' }, { status: 500 })
  }
}
