import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00,
  0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00,
  0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02,
  0x44, 0x01, 0x00, 0x3b,
]);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const token = pathParts[pathParts.length - 2];
    const action = pathParts[pathParts.length - 1];

    if (!token) {
      throw new Error('Missing tracking token');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'open') {
      await supabase.rpc('update_email_tracking', {
        token,
        event_type: 'open',
      });

      return new Response(TRACKING_PIXEL, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    if (action === 'accept' || action === 'decline') {
      const status = action === 'accept' ? 'accepted' : 'declined';

      const result = await supabase.rpc('update_offer_status', {
        token,
        new_status: status,
      });

      if (result.error) {
        throw result.error;
      }

      const htmlResponse = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Réponse enregistrée</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 500px;
              }
              .icon {
                font-size: 64px;
                margin-bottom: 20px;
              }
              h1 {
                color: #333;
                margin: 0 0 15px;
                font-size: 28px;
              }
              p {
                color: #666;
                line-height: 1.6;
                margin: 0;
              }
              .success { color: #10b981; }
              .decline { color: #ef4444; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">${status === 'accepted' ? '🎉' : '👋'}</div>
              <h1 class="${status === 'accepted' ? 'success' : 'decline'}">
                ${status === 'accepted' ? 'Merci pour votre acceptation !' : 'Réponse enregistrée'}
              </h1>
              <p>
                ${status === 'accepted'
                  ? 'Votre réponse a été enregistrée. Le créateur de l\'offre sera notifié et vous contactera bientôt.'
                  : 'Votre réponse a été enregistrée. Merci de nous avoir informés.'}
              </p>
            </div>
          </body>
        </html>
      `;

      return new Response(htmlResponse, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    await supabase.rpc('update_email_tracking', {
      token,
      event_type: 'click',
    });

    return new Response(
      JSON.stringify({ success: true, action: 'click' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error tracking offer:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
