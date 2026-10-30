import {spawn} from 'node:child_process';
import {mkdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=JSON.parse(await readFile(path.join(root,'site.config.json'),'utf8'));
const mode=process.argv[2]||'mobile';
if(!['mobile','desktop'].includes(mode))throw new Error('Usar mobile o desktop.');
const target=new URL(process.env.SITE_URL||config.url);
if(!['http:','https:'].includes(target.protocol))throw new Error('La URL debe usar HTTP o HTTPS.');
const directory=path.resolve(process.env.AUDIT_OUTPUT||path.join(root,'artifacts/lighthouse'));
await mkdir(directory,{recursive:true});
const output=path.join(directory,mode);
const args=['--yes','lighthouse@13.6.0',target.href,
  '--only-categories=performance,accessibility,best-practices,seo',
  '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage',
  '--output=json','--output=html','--output-path='+output,'--quiet'];
if(mode==='desktop')args.push('--preset=desktop');
const audit=spawn('npx',args,{cwd:root,stdio:'inherit'});
const result=await new Promise((resolve,reject)=>{audit.on('error',reject);audit.on('exit',resolve);});
if(result!==0)process.exit(result||1);
const report=JSON.parse(await readFile(output+'.report.json','utf8'));
if(report.runtimeError)throw new Error(report.runtimeError.message);
console.log(JSON.stringify({url:report.finalDisplayedUrl,mode,lighthouse:report.lighthouseVersion,
  scores:Object.fromEntries(Object.entries(report.categories).map(([name,category])=>[name,Math.round(category.score*100)])),
  html:output+'.report.html',json:output+'.report.json'},null,2));
