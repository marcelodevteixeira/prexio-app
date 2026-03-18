import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../src/lib/supabaseClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { qrCodeUrl } = req.body;

    // Create a job in the database
    const { data: job, error } = await supabase
      .from('jobs')
      .insert([
        {
          type: 'NFE_PROCESSING',
          payload: { qrCodeUrl },
          status: 'pending'
        }
      ])
      .select('id')
      .single();

    if (error) throw error;

    // Return the job_id immediately
    return res.status(202).json({ job_id: job.id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
