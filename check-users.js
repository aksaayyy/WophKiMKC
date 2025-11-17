/**
 * Check Users in Database
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUsers() {
  console.log('🔧 Checking Users in Database...\n')

  try {
    // Get all users from auth
    console.log('1. Checking auth users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.log('❌ Failed to get auth users:', authError.message)
    } else {
      console.log(`✅ Found ${authUsers.users.length} auth users:`)
      authUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`)
        console.log(`      Created: ${user.created_at}`)
        console.log(`      Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
      })
    }

    // Get users from database
    console.log('\n2. Checking database users...')
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*')

    if (dbError) {
      console.log('❌ Failed to get database users:', dbError.message)
    } else {
      console.log(`✅ Found ${dbUsers.length} database users:`)
      dbUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`)
        console.log(`      Subscription: ${user.subscription_tier}`)
        console.log(`      Created: ${user.created_at}`)
      })
    }

    console.log('\n🎯 Available login credentials:')
    console.log('   Admin: admin@videoclipper.com / admin123456')
    
    if (authUsers.users.length > 1) {
      const regularUsers = authUsers.users.filter(u => u.email !== 'admin@videoclipper.com')
      console.log('   Regular users:')
      regularUsers.forEach(user => {
        console.log(`   - ${user.email} (password unknown - you need to reset or know it)`)
      })
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkUsers()