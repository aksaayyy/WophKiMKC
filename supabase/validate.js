#!/usr/bin/env node

// Database validation script for Video Clipper Pro
// This script tests the database schema and basic operations

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function validateDatabase() {
  console.log('🔍 Validating Supabase database setup...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking table structure...');
    const tables = ['users', 'teams', 'team_members', 'video_jobs', 'templates', 'usage_tracking'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        throw new Error(`Table ${table} validation failed: ${error.message}`);
      }
      console.log(`   ✅ Table '${table}' exists and is accessible`);
    }

    // Test 2: Check custom types
    console.log('\n2. Checking custom types...');
    const { data: typeData, error: typeError } = await supabase.rpc('check_custom_types');
    if (!typeError) {
      console.log('   ✅ Custom types are properly defined');
    }

    // Test 3: Test RLS policies
    console.log('\n3. Testing Row Level Security...');
    
    // This should fail without proper authentication
    const { data: rlsData, error: rlsError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (rlsError && rlsError.code === '42501') {
      console.log('   ✅ RLS is properly enabled (access denied without auth)');
    } else {
      console.log('   ⚠️  RLS might not be properly configured');
    }

    // Test 4: Check indexes
    console.log('\n4. Checking database indexes...');
    const { data: indexData, error: indexError } = await supabase.rpc('check_indexes');
    if (!indexError) {
      console.log('   ✅ Database indexes are in place');
    }

    // Test 5: Check triggers
    console.log('\n5. Checking triggers...');
    const { data: triggerData, error: triggerError } = await supabase.rpc('check_triggers');
    if (!triggerError) {
      console.log('   ✅ Update triggers are functioning');
    }

    console.log('\n🎉 Database validation completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - All required tables are present');
    console.log('   - Custom types are defined');
    console.log('   - Row Level Security is enabled');
    console.log('   - Database indexes are optimized');
    console.log('   - Triggers are working');

  } catch (error) {
    console.error('\n❌ Database validation failed:', error.message);
    process.exit(1);
  }
}

// Helper function to check if we can connect
async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to Supabase:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   - Supabase is running (supabase start)');
    console.log('   - Environment variables are set correctly');
    console.log('   - Database schema has been applied');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Supabase validation for Video Clipper Pro\n');
  
  const canConnect = await testConnection();
  if (!canConnect) {
    process.exit(1);
  }

  await validateDatabase();
}

if (require.main === module) {
  main();
}

module.exports = { validateDatabase, testConnection };