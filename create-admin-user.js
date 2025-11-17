/**
 * Create Admin User Script
 * Creates an admin user directly through Supabase Auth
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createAdminUser() {
  console.log('🔧 Creating Admin User...\n')

  const adminEmail = 'admin@videoclipper.com'
  const adminPassword = 'admin123456'

  try {
    // Create user with Supabase Auth Admin API
    console.log('1. Creating admin user with Supabase Auth...')
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        role: 'admin',
        subscription_tier: 'business'
      }
    })

    if (authError) {
      console.log('❌ Failed to create admin user:', authError.message)
      return
    }

    console.log('✅ Admin user created successfully!')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)

    // Try to create user profile in users table (if it exists)
    console.log('\n2. Attempting to create user profile...')
    
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        subscription_tier: 'business',
        email_confirmed: true
      })
      .select()

    if (profileError) {
      console.log('⚠️  Could not create user profile (table might not exist):', profileError.message)
      console.log('   This is OK - the admin system will work with auth.users only')
    } else {
      console.log('✅ User profile created successfully!')
    }

    console.log('\n🎉 Admin user setup complete!')
    console.log('\nLogin credentials:')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('\nYou can now:')
    console.log('1. Login at your app with these credentials')
    console.log('2. Navigate to /admin to access the admin panel')

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
  }
}

createAdminUser()