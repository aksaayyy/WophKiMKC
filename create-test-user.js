/**
 * Create Test User Account
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createTestUser() {
  console.log('🔧 Creating Test User Account...\n')

  const testEmail = 'test@videoclipper.com'
  const testPassword = 'test123456'

  try {
    // Create user in auth
    console.log('1. Creating user in Supabase Auth...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Auto-confirm email
    })

    if (authError) {
      console.log('❌ Failed to create auth user:', authError.message)
      return
    }

    console.log('✅ Auth user created successfully!')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)

    // Create user profile in database
    console.log('\n2. Creating user profile in database...')
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: testEmail,
        subscription_tier: 'free'
      })
      .select()
      .single()

    if (profileError) {
      console.log('❌ Failed to create user profile:', profileError.message)
    } else {
      console.log('✅ User profile created successfully!')
    }

    console.log('\n🎉 Test user created successfully!')
    console.log('\n🔑 Login Credentials:')
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${testPassword}`)
    console.log('\n✅ You can now sign in with these credentials!')

  } catch (error) {
    console.error('❌ Creation failed:', error.message)
  }
}

createTestUser()