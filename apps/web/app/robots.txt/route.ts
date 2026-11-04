export function GET(){return new Response('User-agent: *\nAllow: /\nSitemap: '+(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000')+'/sitemap.xml\n',{headers:{'content-type':'text/plain'}})}
