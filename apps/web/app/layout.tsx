import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; import './auth.css'; import './account.css'; import './home-icons.css'; import './homepage.css'; import './site-shell.css'; import './article-reading.css'; import './typography.css';
import { SiteShell } from '@/components/site-shell';
const inter=Inter({subsets:['latin'],display:'swap',variable:'--font-inter'});
const site=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';
export const metadata:Metadata={metadataBase:new URL(site),title:{default:'BharatArchive',template:'%s | BharatArchive'},description:'An independent India-focused knowledge and community platform.',manifest:'/manifest.webmanifest'};
export const viewport:Viewport={themeColor:'#fdfaf6'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en" className={inter.variable}><body><SiteShell>{children}</SiteShell></body></html>}
