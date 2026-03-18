import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Worker needs its own Supabase client, potentially with a service role key
// For this example, we'll use the public URL and ANON key, but in production
// a service role key is recommended to bypass RLS for background jobs.
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
if (supabaseUrl.includes(':5432')) {
  supabaseUrl = supabaseUrl.replace(':5432', ':6543');
}
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function processNfeJob(job: any) {
  console.log(`Processing NFE job ${job.id}...`);
  // Simulate heavy processing (scraping, parsing)
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Simulate product matching logic using pg_trgm (fuzzy matching)
  // In a real scenario, we would query the database to normalize product names
  console.log('Running product normalization and matching...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    market: 'Supermercado Exemplo',
    date: new Date().toISOString(),
    items: [
      { name: 'Arroz 5kg', price: 25.90, quantity: 1 },
      { name: 'Feijão 1kg', price: 8.50, quantity: 2 }
    ],
    total: 42.90
  };
}

async function processOcrJob(job: any) {
  console.log(`Processing OCR job ${job.id}...`);
  // Simulate heavy processing (OCR, image recognition)
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return {
    market: "Assaí Atacadista",
    city: "Brasília",
    date: new Date().toISOString(),
    items: [
      { name: "Arroz 5kg", price: 22.90, quantity: 2 },
      { name: "Feijão Preto 1kg", price: 7.50, quantity: 3 },
      { name: "Leite Integral 1L", price: 4.90, quantity: 12 }
    ]
  };
}

async function pollJobs() {
  console.log('Worker started, polling for jobs...');
  
  while (true) {
    try {
      // Fetch a pending job
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) {
        console.error('Error fetching jobs:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      if (!jobs || jobs.length === 0) {
        // No jobs, wait before polling again
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }

      const job = jobs[0];
      
      // Mark as processing
      await supabase
        .from('jobs')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', job.id);

      let result;
      try {
        if (job.type === 'NFE_PROCESSING') {
          result = await processNfeJob(job);
        } else if (job.type === 'OCR_PROCESSING') {
          result = await processOcrJob(job);
        } else {
          throw new Error(`Unknown job type: ${job.type}`);
        }

        // Mark as completed
        await supabase
          .from('jobs')
          .update({ 
            status: 'completed', 
            result, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', job.id);
          
        console.log(`Job ${job.id} completed successfully.`);
      } catch (jobError: any) {
        console.error(`Job ${job.id} failed:`, jobError);
        // Mark as failed
        await supabase
          .from('jobs')
          .update({ 
            status: 'failed', 
            error: jobError.message, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', job.id);
      }
    } catch (err) {
      console.error('Unexpected worker error:', err);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Start the worker
pollJobs();
