// Simplified upload handler for production

/**
 * Upload handler - Compatible with multiple hosting platforms
 */
export default async function handler(req, res) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // In production, return a simple error
  return res.status(503).json({ error: 'Upload service not available in production' });
}

// For Vercel compatibility
export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure this is treated as a serverless function
export const runtime = 'nodejs';