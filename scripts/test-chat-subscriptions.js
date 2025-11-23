// Test script to verify chat real-time subscriptions
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testChatSubscriptions() {
  console.log('🧪 Testing Chat Real-time Subscriptions...\n');

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1. Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('chats')
      .select('count', { count: 'exact', head: true });

    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      return;
    }
    console.log('✅ Supabase connection successful\n');

    // Test 2: Test real-time subscription
    console.log('2. Testing real-time subscription...');
    let subscriptionTriggered = false;

    const testChannel = supabase
      .channel('test-chat-subscription')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats'
        },
        (payload) => {
          console.log('✅ Real-time subscription triggered:', payload.eventType);
          subscriptionTriggered = true;
        }
      );

    testChannel.subscribe((status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to chat changes\n');
      }
    });

    // Wait a bit for subscription to establish
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Insert a test message
    console.log('3. Testing message insertion...');
    const testMessage = {
      user_id: 'test-user-123',
      message: 'Test message for subscription verification',
      is_admin: false
    };

    const { data: insertData, error: insertError } = await supabase
      .from('chats')
      .insert([testMessage])
      .select();

    if (insertError) {
      console.error('❌ Message insertion failed:', insertError);
    } else {
      console.log('✅ Test message inserted successfully');
      console.log('Message ID:', insertData[0].id);
    }

    // Wait for subscription to trigger
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (subscriptionTriggered) {
      console.log('✅ Real-time subscription working correctly\n');
    } else {
      console.log('⚠️  Real-time subscription may not be working (check Supabase RLS policies)\n');
    }

    // Cleanup: Delete test message
    console.log('4. Cleaning up test data...');
    if (insertData && insertData[0]) {
      const { error: deleteError } = await supabase
        .from('chats')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.error('❌ Failed to delete test message:', deleteError);
      } else {
        console.log('✅ Test message deleted');
      }
    }

    // Unsubscribe
    testChannel.unsubscribe();
    console.log('✅ Unsubscribed from test channel\n');

    console.log('🎉 Chat subscription test completed!');
    console.log('\n📋 Summary:');
    console.log('- Supabase connection: ✅');
    console.log('- Real-time subscription: ' + (subscriptionTriggered ? '✅' : '⚠️'));
    console.log('- Message insertion: ' + (insertError ? '❌' : '✅'));
    console.log('\n💡 If real-time subscription shows ⚠️, check:');
    console.log('   1. Supabase RLS policies allow real-time subscriptions');
    console.log('   2. Network connectivity to Supabase');
    console.log('   3. Browser console for any WebSocket errors');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testChatSubscriptions();