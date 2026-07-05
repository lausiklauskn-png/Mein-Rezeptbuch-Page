/* Aufnahme-Helfer für das Demo-Video (Playwright recordVideo).
   Muster aus yami-kreativ26/scripts (2026-07-05), hier gesichert, damit
   keine Folge-Sitzung das Skript neu erfinden muss.
   - Erklär-Tooltip wandert MIT dem Cursor-Punkt mit (verdeckt keine Knöpfe),
     geht bei jeder Erklärung auf und blendet nach der Lesezeit selbst aus
   - Cursor-Punkt (orange), gleitet zu jedem Klick-Ziel */
const http = require('http'); const fs = require('fs'); const path = require('path');

const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webm':'video/webm','.pdf':'application/pdf'};

function makeServer(root, port){
  const srv = http.createServer((req,res)=>{
    let p = decodeURIComponent(req.url.split('?')[0]);
    if(p.endsWith('/')) p += 'index.html';
    fs.readFile(path.join(root,p),(err,data)=>{
      if(err){res.writeHead(404);res.end('nf');return;}
      res.writeHead(200,{'Content-Type':MIME[path.extname(p).toLowerCase()]||'application/octet-stream'});
      res.end(data);
    });
  });
  return new Promise(r=>srv.listen(port,()=>r(srv)));
}

async function mountOverlay(page){
  await page.evaluate(()=>{
    if(document.getElementById('capDot')) return;
    const d=document.createElement('div'); d.id='capDot';
    d.style.cssText='position:fixed;left:-40px;top:-40px;width:22px;height:22px;border-radius:50%;'+
      'background:rgba(255,150,40,.85);border:2.5px solid #fff;z-index:2147483647;'+
      'box-shadow:0 0 10px rgba(0,0,0,.4);transition:left .55s ease,top .55s ease;pointer-events:none';
    document.body.appendChild(d);
    const s=document.createElement('div'); s.id='capTip';
    s.style.cssText='position:fixed;left:-9999px;top:-9999px;max-width:380px;'+
      'background:rgba(10,16,28,.90);color:#fff;font:700 17px/1.35 system-ui,sans-serif;'+
      'padding:10px 16px;border-radius:12px;text-align:center;z-index:2147483646;'+
      'box-shadow:0 6px 24px rgba(0,0,0,.45);opacity:0;'+
      'transition:opacity .3s,left .55s ease,top .55s ease;pointer-events:none';
    document.body.appendChild(s);
    window.__capPlaceTip=(dx,dy)=>{
      const t=document.getElementById('capTip'); if(!t) return;
      const vw=innerWidth, vh=innerHeight;
      const onScreen = dx>=0 && dy>=0 && dx<=vw && dy<=vh;
      const w=Math.min(t.offsetWidth||320,380), h=t.offsetHeight||60;
      let x,y;
      if(onScreen){
        x=Math.max(12,Math.min(vw-w-12,dx-w/2));
        y=(dy>vh*0.55)?(dy-h-34):(dy+34);
        y=Math.max(10,Math.min(vh-h-10,y));
      }else{ x=(vw-w)/2; y=vh-h-40; }
      t.style.left=x+'px'; t.style.top=y+'px';
    };
    window.__capDotXY=[-40,-40];
    window.__capTipTimer=null;
  });
}

async function moveDot(page,x,y){
  await mountOverlay(page);
  await page.evaluate(([px,py])=>{
    const d=document.getElementById('capDot');
    d.style.left=(px-11)+'px'; d.style.top=(py-11)+'px';
    window.__capDotXY=[px,py];
    window.__capPlaceTip(px,py);
  },[x,y]);
}

async function sub(page, text, holdMs){
  await mountOverlay(page);
  const readMs = holdMs ?? Math.max(2400, text.length*45);
  await page.evaluate(([t,ms])=>{
    const s=document.getElementById('capTip');
    s.textContent=t;
    const [dx,dy]=window.__capDotXY;
    window.__capPlaceTip(dx,dy);
    s.style.opacity='1';
    clearTimeout(window.__capTipTimer);
    window.__capTipTimer=setTimeout(()=>{s.style.opacity='0';},ms);
  },[text,readMs]);
  if(holdMs) await page.waitForTimeout(holdMs);
}
async function subOff(page){
  await page.evaluate(()=>{const s=document.getElementById('capTip');if(s)s.style.opacity='0';
    clearTimeout(window.__capTipTimer);}).catch(()=>{});
}

async function glideClick(page, selector, opts={}){
  const loc = (typeof selector==='string') ? page.locator(selector).first() : selector;
  await loc.scrollIntoViewIfNeeded().catch(()=>{});
  await page.waitForTimeout(250);
  const box = await loc.boundingBox();
  if(!box) throw new Error('kein boundingBox: '+selector);
  const x = box.x+box.width/2, y = box.y+box.height/2;
  await moveDot(page,x,y);
  await page.waitForTimeout(opts.beforeMs ?? 700);
  await page.mouse.click(x,y);
  await page.waitForTimeout(opts.afterMs ?? 500);
}

async function glideType(page, selector, text, perChar=45){
  const loc = (typeof selector==='string') ? page.locator(selector).first() : selector;
  await loc.scrollIntoViewIfNeeded().catch(()=>{});
  const box = await loc.boundingBox();
  if(box) await moveDot(page,box.x+box.width/2,box.y+box.height/2), await page.waitForTimeout(400);
  await loc.click();
  await loc.pressSequentially(text,{delay:perChar});
}

module.exports = { makeServer, mountOverlay, moveDot, sub, subOff, glideClick, glideType };
