/**
 * Check Job Status and Details
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkJobStatus() {
  console.log('🔧 Checking Job Status...\n')

  const jobId = '387bb337-974b-4239-a2c1-c7ff35240a7e'

  try {
    // Get job details from database
    console.log('1. Checking job in database...')
    const { data: job, error: jobError } = await supabase
      .from('video_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError) {
      console.log('❌ Failed to get job from database:', jobError.message)
    } else {
      console.log('✅ Job found in database:')
      console.log('   ID:', job.id)
      console.log('   Status:', job.status)
      console.log('   Original filename:', job.original_filename)
      console.log('   Error message:', job.error_message)
      console.log('   Created at:', job.created_at)
      console.log('   Started at:', job.started_at)
      console.log('   Completed at:', job.completed_at)
    }

    // Test the status API
    console.log('\n2. Testing status API...')
    const response = await fetch(`http://localhost:3000/api/v1/status/${jobId}`)
    
    if (response.ok) {
      const statusData = await response.json()
      console.log('✅ Status API working:')
      console.log('   Status:', statusData.status)
      console.log('   Progress:', statusData.progress)
      console.log('   Message:', statusData.message)
      if (statusData.error) {
        console.log('   Error:', statusData.error)
      }
    } else {
      console.log('❌ Status API failed:', response.status)
      const errorData = await response.json().catch(() => ({}))
      console.log('   Error:', errorData)
    }

    // Check recent jobs to see the pattern
    console.log('\n3. Checking recent jobs...')
    const { data: recentJobs, error: recentError } = await supabase
      .from('video_jobs')
      .select('id, status, error_message, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      console.log('❌ Failed to get recent jobs:', recentError.message)
    } else {
      console.log('✅ Recent jobs:')
      recentJobs.forEach((job, index) => {
        console.log(`   ${index + 1}. ${job.id} - ${job.status}`)
        if (job.error_message) {
          console.log(`      Error: ${job.error_message}`)
        }
      })
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkJobStatus()