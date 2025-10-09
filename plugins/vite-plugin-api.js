import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Vite plugin to handle API routes in development
 * This creates API endpoints that work in both dev and production
 */
export default function apiPlugin() {
  return {
    name: 'vite-plugin-api',
    configureServer(server) {
      // Handle /api/* routes
      server.middlewares.use('/api', async (req, res, next) => {
        try {
          // Remove /api prefix
          const apiPath = req.url.replace('/api', '');
          
          // Map to the actual API file
          let apiFile;
          if (apiPath === '/upload' || apiPath === '/upload.js') {
            // Let the file upload plugin handle uploads in development
            return next();
          } else {
            // Let other middleware handle it
            return next();
          }

          // Check if API file exists
          if (!fs.existsSync(apiFile)) {
            return next();
          }

          // Import and execute the API handler
          const { default: handler } = await import(apiFile);
          
          // Create a mock request/response that matches the API format
          const apiReq = req; // Pass the original request object directly

          const apiRes = {
            status: (code) => ({
              json: (data) => {
                res.statusCode = code;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              },
              end: (data) => {
                res.statusCode = code;
                res.end(data);
              }
            }),
            setHeader: (name, value) => res.setHeader(name, value),
            end: (data) => res.end(data)
          };

          // Execute the handler
          await handler(apiReq, apiRes);

        } catch (error) {
          console.error('API handler error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });
    }
  };
}
