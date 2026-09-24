const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

const users = [
  { email: 'kofifah@perawat.com', name: 'Siti Kofifah', role: 'caregiver' },
  { email: 'wardoyo@perawat.com', name: 'Sri Wardoyo', role: 'caregiver' },
  { email: 'Hafizah@perawat.com', name: 'Nur Hafizah', role: 'caregiver' }
];

async function createAccounts() {
  for (const user of users) {
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: 'password123',
      options: {
        data: {
          name: user.name,
          role: user.role
        }
      }
    });

    if (error) {
      console.error(`Error creating ${user.email}:`, error.message);
    } else {
      console.log(`Successfully created ${user.email}`);
      if (!data.session) {
        console.log(`Note: ${user.email} created but requires email confirmation!`);
      }
    }
  }
}

createAccounts();
