/* Nimmt das große Demo-Video der App "Mein Rezeptbuch" auf
   (assets/demo.webm + assets/demo-poster.jpg dieser Page).
   Aufruf: node scripts/record-demo.cjs
   Die App wird aus dem Schwester-Checkout /home/user/Mein-Rezeptbuch bedient
   (Produktions-index.html). Lange Klick-Tour über echte Knöpfe:
   Rezepte → Suche → Rezept anlegen → Zutaten/Schritte → Foto + Zuschnitt →
   Teilen (QR) → Menüplan → Einkaufsliste → Ordner → Sprachen → Themes →
   KI-Scan-Einstieg → Datentresor.
   Beispiel-Rezepte (mit Klaus' Fotos) werden vorab auf einer unsichtbaren
   Setup-Seite gespeichert — die Aufnahme zeigt den ehrlichen Alltag. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'); const path = require('path');
const { makeServer, sub, subOff, glideClick, glideType, moveDot } = require('./record-lib.cjs');

const APP  = '/home/user/Mein-Rezeptbuch';
const OUT  = path.join(__dirname,'..','assets');
const IMGS = '/tmp/claude-0/-home-user/189f57fd-4172-5d13-ad57-347d086405a5/scratchpad/rezept-demo';
const TMP  = fs.mkdtempSync('/tmp/mrz-rec-');
const PORT = 8963;

const b64 = f => 'data:image/'+(f.endsWith('.png')?'png':'jpeg')+';base64,'+fs.readFileSync(path.join(IMGS,f)).toString('base64');

const SEED = [
  {name:'Gyoza — japanische Teigtaschen',cat:'fisch',img:'gyoza.jpg',flavors:['asiatisch'],
   ings:[['30','Stück','Teigblätter für Gyoza'],['300','g','Hähnchen-Hackfleisch'],['200','g','Chinakohl'],['1','Stück','Ingwer (daumengroß)'],['3','EL','Sojasauce']],
   steps:['Kohl fein hacken, salzen und ausdrücken — dann mit Hack, Ingwer und Sojasauce mischen.','Je 1 TL Füllung auf ein Teigblatt geben, Rand anfeuchten und in Falten schließen.','In der Pfanne goldbraun anbraten, ablöschen und zugedeckt 6 Minuten dämpfen.']},
  {name:'Kill-the-Cold-Smoothie',cat:'vegi',img:'smoothie.jpg',flavors:['Ingwer-Kick'],
   ings:[['1','Stück','Ingwer (frisch)'],['1','Stück','Zitrone'],['1','TL','Kurkuma'],['2','EL','Honig'],['300','ml','Hafermilch']],
   steps:['Ingwer schälen und grob würfeln, Zitrone auspressen.','Alles zusammen cremig mixen und sofort genießen.']},
  {name:'Erdbeer-Schoko-Torte',cat:'kuchen',img:'erdbeertorte.png',flavors:['festlich'],
   ings:[['500','g','Erdbeeren'],['200','g','Zartbitterschokolade'],['400','ml','Sahne'],['2','Stück','Schoko-Biskuitböden']],
   steps:['Böden mit Schoko-Creme füllen und stapeln.','Erdbeer-Sahne aufschlagen, Torte einstreichen und kalt stellen.','Mit halbierten Erdbeeren und Schokoraspeln verzieren.']},
  {name:'Würzfleisch nach DDR-Art',cat:'fleisch',img:'wuerzfleisch.png',flavors:['deftig'],
   ings:[['400','g','gekochtes Fleisch'],['30','g','Butter'],['30','g','Mehl'],['300','ml','Fleischbrühe'],['100','ml','Sahne'],['1','EL','Worcester-Sauce'],['','','geriebener Käse']],
   steps:['Butter schmelzen, Mehl einrühren, mit Brühe und Sahne ablöschen.','Fleisch zugeben, würzen und kurz köcheln lassen.','In Förmchen füllen, mit Käse bestreuen und bei 180 °C überbacken.']},
  {name:'Honig-Kaffee mit Kakao',cat:'dessert',img:'honigkaffee.jpg',flavors:['süß & heiß'],
   ings:[['1','Tasse','starker Kaffee'],['1','EL','Honig'],['1','TL','Kakaopulver']],
   steps:['Kaffee brühen, Honig einrühren und mit Kakao bestäuben.']}
];

const SCENES=[]; let page;
async function scene(name, fn){
  try{ await fn(); SCENES.push('✅ '+name); }
  catch(e){ SCENES.push('❌ '+name+': '+String(e).slice(0,120)); }
}
/* navTo() schließt beim ersten Klick erst offene Overlays — deshalb klicken,
   bis der Ziel-Screen wirklich sichtbar ist (max. 3 Versuche). */
async function gotoTab(btnSel, scId){
  for(let i=0;i<3;i++){
    const collapsed = await page.evaluate(()=>document.getElementById('bnav')?.classList.contains('nav-collapsed'));
    if(collapsed) await glideClick(page,'.nav-pull',{beforeMs:400,afterMs:600});
    await glideClick(page, btnSel, {afterMs:900});
    const vis = await page.evaluate(id=>{
      const el=document.getElementById(id);
      return !!el && getComputedStyle(el).display!=='none';
    }, scId);
    if(vis) return;
  }
  throw new Error('Screen '+scId+' nicht sichtbar');
}

(async () => {
  const srv = await makeServer(APP, PORT);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport:{width:1280,height:720},
    recordVideo:{dir:TMP, size:{width:1280,height:720}},
    deviceScaleFactor:1
  });
  // Klaus 2026-07-05: Eruda-Debug-Blase bleibt im Video aus
  await ctx.addInitScript(()=>{ try{ localStorage.setItem('eruda9','0'); }catch(_){} });

  /* ── Unsichtbares Setup: Beispiel-Rezepte mit Fotos speichern ── */
  const setup = await ctx.newPage();
  setup.on('dialog', d=>d.accept());
  await setup.goto(`http://localhost:${PORT}/`);
  await setup.waitForSelector('#boot-splash',{state:'detached',timeout:20000});
  const seedData = SEED.map(s=>({...s, img:b64(s.img)}));
  await setup.evaluate(async recs=>{
    for(const s of recs.reverse()){
      const img = await resizeImage(s.img, 800, 0.75);
      R.unshift({id:Date.now()+Math.floor(Math.random()*1e5),name:s.name,cat:s.cat,shut:true,img,
        folder:'',blank:false,servings:4,imgCrop:{x:50,y:50,scale:1},
        flavors:s.flavors,
        ings:s.ings.map((i,k)=>({id:Date.now()+k+1,amt:i[0],unit:i[1],name:i[2],ck:false,note:''})),
        steps:s.steps.map((t,k)=>({id:Date.now()+k+50,txt:t,note:''})),
        rating:{stars:0,comment:'',imps:[]}});
    }
    sv();
  }, seedData);
  await setup.waitForTimeout(600);
  await setup.close();

  /* ── Aufnahme ── */
  page = await ctx.newPage();
  page.on('dialog', d=>d.accept());
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForSelector('#boot-splash',{state:'detached',timeout:20000});
  await page.waitForTimeout(900);

  await scene('Intro', async()=>{
    await sub(page,'Mein Rezeptbuch — dein digitales Kochbuch. Läuft offline, alles bleibt auf deinem Gerät.',3600);
    await sub(page,'Deine Rezepte als Karten — mit Foto, Zutaten und Schritten.',2400);
    await page.mouse.wheel(0,500); await page.waitForTimeout(1200);
    await page.mouse.wheel(0,-500); await page.waitForTimeout(800);
  });

  await scene('Suche', async()=>{
    await sub(page,'Blitzschnelle Suche über alle Rezepte …');
    await glideType(page,'#srchIn','Gyoza',80);
    await page.waitForTimeout(1600);
    await glideClick(page,'#srchX',{afterMs:700});
  });

  let newId;
  await scene('Rezept anlegen', async()=>{
    await sub(page,'Ein neues Rezept ist in Sekunden angelegt.');
    await glideClick(page,'.srch-act-btn.add',{afterMs:700});
    await glideType(page,'#newName','Sushi-Teller nach Tomy-Art',40);
    await page.selectOption('#newCat','fisch').catch(()=>{});
    await glideType(page,'#newFlavor','frisch & fein',40);
    await glideClick(page,'#btnCreate',{afterMs:1200});
    newId = await page.evaluate(()=>R.find(r=>!r.blank&&r.name.includes('Sushi'))?.id);
    if(!newId) throw new Error('Rezept nicht angelegt');
  });

  await scene('Zutaten + Schritt', async()=>{
    await page.locator(`#c${newId} .rcard-hd`).click().catch(()=>{});
    await page.waitForTimeout(700);
    await sub(page,'Zutaten mit Menge und Einheit — die App rechnet Portionen automatisch um.');
    await glideType(page,`#ia-${newId}`,'300',70);
    await glideType(page,`#iu-${newId}`,'g',80);
    await glideType(page,`#in-${newId}`,'Sushi-Reis',45);
    await page.locator(`#in-${newId}`).press('Enter'); await page.waitForTimeout(700);
    await glideType(page,`#ia-${newId}`,'200',70);
    await glideType(page,`#iu-${newId}`,'g',80);
    await glideType(page,`#in-${newId}`,'frischer Lachs',45);
    await page.locator(`#in-${newId}`).press('Enter'); await page.waitForTimeout(700);
    await sub(page,'Zubereitungsschritte einfach eintippen …');
    await glideType(page,`#sti-${newId}`,'Reis kochen, würzen und Rollen formen — mit Lachs belegen.',30);
    await glideClick(page,`#c${newId} .stepadd`,{afterMs:900});
  });

  await scene('Foto + Zuschnitt', async()=>{
    await sub(page,'Jedes Rezept bekommt ein Foto — der Ausschnitt lässt sich frei anpassen.');
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser',{timeout:8000}),
      glideClick(page,`#c${newId} [onclick*="pickImgForCard"]`,{afterMs:0})
    ]);
    await chooser.setFiles(path.join(IMGS,'sushi-platte.png'));
    await page.waitForSelector('#cropOv',{state:'visible',timeout:8000});
    await page.waitForTimeout(1600);
    await sub(page,'Zoomen, verschieben — und speichern.');
    await glideClick(page,'#cropSaveBtn',{afterMs:1400});
  });

  await scene('Poster-Screenshot', async()=>{
    await page.locator(`#c${newId}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await page.screenshot({path:path.join(OUT,'demo-poster.jpg'),type:'jpeg',quality:82});
  });

  await scene('Teilen (QR)', async()=>{
    await sub(page,'Teilen: Rezept als QR-Code oder Link an Familie und Freunde.');
    await glideClick(page,`#c${newId} [onclick*="shareRecipeQR"]`,{afterMs:2400});
    const cl = page.locator('.share-btn-cl').first();
    if(await cl.count()) await glideClick(page,cl,{afterMs:500});
    await page.evaluate(()=>{const o=document.getElementById('shareOv');if(o)o.remove();});
    await page.waitForTimeout(300);
  });

  await scene('Food-Zine', async()=>{
    await sub(page,'Das KI-Kreativbuch: Aus jedem Rezept wird ein Food-Zine — Poster, Magazinseite oder Rezeptkarte.');
    await glideClick(page,`#c${newId} .fz-bar`,{afterMs:1400});
    await page.waitForSelector('#aiBookOv',{state:'visible',timeout:8000});
    await sub(page,'Format wählen — zum Beispiel die Zeitungsseite …');
    const tiles = page.locator('.fz-fmt-tile');
    if(await tiles.count()>3) await glideClick(page,tiles.nth(3),{afterMs:1200});
    const extra = page.locator('.fz-extra-row').first();
    if(await extra.count()) await glideClick(page,extra,{afterMs:1000});
    await sub(page,'Der fertige Prompt: kopieren und direkt zu Claude oder ChatGPT springen.');
    await page.locator('#aiBookPromptBox').scrollIntoViewIfNeeded().catch(()=>{});
    await page.waitForTimeout(1600);
    await glideClick(page,'#aiBookCopyBtn',{afterMs:1400});
    await sub(page,'Die fertigen Bilder kommen zurück in die Galerie — mehrere auf einmal, per Ziehen sortierbar.');
    const gal = page.locator('label[for="fzgFileIn"]').first();
    if(await gal.count()) await gal.scrollIntoViewIfNeeded().catch(()=>{});
    await page.setInputFiles('#fzgFileIn',[path.join(IMGS,'foodzine-gulasch.png'),path.join(IMGS,'foodzine-bowl.png')]).catch(()=>{});
    await page.waitForTimeout(2600);
    const thumbs = page.locator('.fzg-thumb');
    if(await thumbs.count()) await thumbs.first().scrollIntoViewIfNeeded().catch(()=>{});
    await page.waitForTimeout(1600);
    await glideClick(page,'#aiBookOv .fov-back',{afterMs:800});
    await page.evaluate(()=>{const o=document.getElementById('aiBookOv');if(o)o.style.display='none';});
    await page.waitForTimeout(400);
  });

  await scene('In den Menüplan', async()=>{
    await sub(page,'Ein Tipp auf „+ Menü" — und das Rezept steht im Wochenplan.');
    await glideClick(page,`#c${newId} [onclick*="openCSheet"]`,{afterMs:900});
    const chip = page.locator('#courseGrid > *').first();
    if(await chip.count()) await glideClick(page,chip,{afterMs:700});
    await glideClick(page,'#csConfirm',{afterMs:1000});
    await page.evaluate(()=>{try{closeCSheet();}catch(_){}});
  });

  await scene('Wochenplan', async()=>{
    await gotoTab('#bn-menu','sc-menu');
    await sub(page,'Der Wochenplan: Frühstück, Mittag, Abend — pro Tag planbar.',2800);
    const add = page.locator('.wk-add').first();
    if(await add.count()){
      await glideClick(page,add,{afterMs:900});
      await sub(page,'Mahlzeit wählen, Gang wählen, Rezept wählen — fertig.');
      await glideClick(page, page.locator('.asl-meal-btn').nth(1), {afterMs:900});
      const course = page.locator('#aslCourseGrid > *').first();
      if(await course.count()) await glideClick(page,course,{afterMs:900});
      // Rezept-Wähler (#_rp): erst „Alle Rezepte anzeigen", dann echtes Rezept
      await page.waitForSelector('#_rp',{timeout:6000}).catch(()=>{});
      const showAll = page.locator('#_rp button').filter({hasText:/Alle Rezepte/i}).first();
      if(await showAll.count()) await glideClick(page,showAll,{afterMs:1000});
      const pick = page.locator('#_rp [onclick*="assignR"]').first();
      if(await pick.count()) await glideClick(page,pick,{afterMs:1400});
      await page.evaluate(()=>{document.getElementById('_rp')?.remove();const a=document.getElementById('aslBg');if(a)a.style.display='none';});
      await page.waitForTimeout(600);
    }
  });

  await scene('Einkaufsliste', async()=>{
    await gotoTab('#bn-menu','sc-menu');
    const mv = page.locator('.mact.gld').first();
    if(!(await mv.count())) throw new Error('kein MV-Button');
    await sub(page,'Menü & Einkaufsliste — automatisch aus dem Wochenplan gebaut.');
    await glideClick(page,mv,{afterMs:1400});
    let open = await page.evaluate(()=>getComputedStyle(document.getElementById('mv')).display!=='none');
    if(!open){ await glideClick(page,mv,{afterMs:1400});
      open = await page.evaluate(()=>getComputedStyle(document.getElementById('mv')).display!=='none'); }
    if(!open) throw new Error('MV-Overlay öffnet nicht');
    await glideClick(page,'#mvTabSh',{afterMs:2000});
    await glideClick(page,'#mvTabCk',{afterMs:1600});
    await glideClick(page,'#mv .mv-back',{afterMs:600});
    await page.evaluate(()=>closeMV());
    await page.waitForTimeout(400);
  });

  await scene('Ordner', async()=>{
    await gotoTab('#bn-folders','sc-folders');
    await sub(page,'Ordner bringen Ordnung — zum Beispiel nach Küche oder Anlass.');
    await glideClick(page,'.fldact.r',{afterMs:800});
    await glideType(page,'#fldNameIn','Asiatische Küche',45);
    await page.locator('#fldNameIn').press('Enter');
    await page.waitForTimeout(1200);
  });

  await scene('Sprachen', async()=>{
    await sub(page,'8 Sprachen — die ganze App wechselt mit einem Tipp.');
    await glideClick(page,'#langBtn',{afterMs:900});
    let en = page.locator('#langChips .lang-chip').filter({hasText:/English|EN/i}).first();
    if(!(await en.count())) en = page.locator('#langChips .lang-chip').nth(1);
    await glideClick(page,en,{afterMs:1800});
    await sub(page,'… and back to German.',1400);
    await glideClick(page,'#langBtn',{afterMs:800});
    let de = page.locator('#langChips .lang-chip').filter({hasText:/Deutsch|DE/i}).first();
    if(!(await de.count())) de = page.locator('#langChips .lang-chip').first();
    await glideClick(page,de,{afterMs:1200});
  });

  await scene('Themes', async()=>{
    await gotoTab('#bn-settings','sc-settings');
    await sub(page,'Acht Design-Themes — von hell bis Hologramm.');
    const chips = page.locator('#themeGrid .theme-chip');
    const n = await chips.count();
    if(n>1){
      await glideClick(page,chips.nth(1),{afterMs:1500});
      await glideClick(page,chips.nth(Math.min(3,n-1)),{afterMs:1500});
      await page.evaluate(()=>setTheme('spektral'));
      await page.waitForTimeout(700);
    }
  });

  await scene('KI-Scan', async()=>{
    await sub(page,'KI-Scan: Ein Foto aus Kochbuch oder Zeitung — die App liest das Rezept.');
    await page.evaluate(()=>openImport());
    await page.waitForTimeout(800);
    const tab = page.locator('#impTabScan');
    if(await tab.count()) await glideClick(page,tab,{afterMs:900});
    await page.setInputFiles('#scanFileIn', path.join(IMGS,'zeitung-lachsnudeln.png')).catch(()=>{});
    await page.waitForTimeout(1800);
    await sub(page,'Zutaten, Schritte, Portionen — alles wird erkannt (mit eigenem KI-Schlüssel).',3000);
    await page.evaluate(()=>{const o=document.getElementById('importOv');if(o)o.style.display='none';});
    await page.waitForTimeout(400);
  });

  await scene('Tresor', async()=>{
    await gotoTab('#bn-backup','sc-backup');
    await sub(page,'Der Datentresor sichert alles — verschlüsselt, auf deinem Gerät.',3000);
  });

  await scene('Abschluss', async()=>{
    await gotoTab('#bn-recipes','sc-recipes');
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));
    await page.waitForTimeout(800);
    await sub(page,'Mein Rezeptbuch — kostenlos, offline, deins. Viel Freude beim Kochen!',3400);
    await subOff(page); await page.waitForTimeout(800);
  });

  const vidPath = await page.video().path();
  await ctx.close(); await browser.close(); srv.close();
  fs.copyFileSync(vidPath, path.join(OUT,'demo.webm'));
  fs.rmSync(TMP,{recursive:true,force:true});
  console.log(SCENES.join('\n'));
  const kb = Math.round(fs.statSync(path.join(OUT,'demo.webm')).size/1024);
  console.log(`demo.webm neu aufgenommen (${kb} KB) + demo-poster.jpg`);
})();
