/* National map presentation. State is provided by lib/national-map-state.js (copied at build). */
(function(){
  "use strict";
  const host=document.getElementById("national-map");
  const slider=document.getElementById("national-date-slider");
  const dataNode=document.getElementById("national-map-regions");
  const status=document.getElementById("national-map-status");
  const fallback=document.getElementById("national-map-fallback");
  if(!host||!slider||!dataNode||!status)return;
  const M=window.NationalFallMapState;
  if(!M){status.textContent="Map model unavailable. The region directory below still works.";return;}
  let regions;
  try{regions=JSON.parse(dataNode.textContent);}catch{return;}
  if(!Array.isArray(regions)||regions.length!==15){
    status.textContent="Regional map data is unavailable. Use the region directory below.";return;
  }
  const now=new Date(),today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
  const year=M.seasonYear(now),dates=M.seasonDates(year);
  let selected=M.initialDate(now,dates),map=null,lastOpened=null;
  const markerRows=new Map(),weatherCache=new Map();
  const labels=document.getElementById("national-selected-date");
  const reset=document.getElementById("national-reset-date");
  const shortlist=document.getElementById("national-color-now");
  const dateText=iso=>new Date(iso+"T12:00:00Z").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"});
  const shortDate=iso=>new Date(iso+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"});
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const inHorizon=()=>Math.floor((Date.parse(selected+"T12:00:00Z")-Date.parse(today+"T12:00:00Z"))/86400000)>=-1 &&
     Math.floor((Date.parse(selected+"T12:00:00Z")-Date.parse(today+"T12:00:00Z"))/86400000)<=7;
  slider.min="0";slider.max=String(dates.length-1);slider.step="1";slider.value=String(dates.indexOf(selected));
  function details(region){
    const s=M.stageFor(region,selected);
    return '<div class="map-popup"><strong>'+escape(region.name)+'</strong>'+
      '<span class="map-popup-stage" style="color:'+s.color+'">'+escape(s.label)+'</span>'+
      '<p><b>Modeled seasonal stage.</b> Based on typical regional timing; not a live leaf-color reading or observed percentage.</p>'+
      '<p>Typical peak window: <b>'+shortDate(s.typicalWindow.from)+'–'+shortDate(s.typicalWindow.to)+'</b>. Changes with elevation, species and weather.</p>'+
      '<p class="map-popup-weekend" data-weekend="'+escape(region.id)+'">'+
       (inHorizon()?"Current weekend weather: available on request when this marker opens.":"Future-date preview: NWS weather is not forecast this far ahead.")+'</p>'+
      '<a class="map-popup-cta" href="/fall-color/'+encodeURIComponent(region.id)+'/">Plan this region →</a></div>';
  }
  function updateShortlist(){
    const active=regions.filter(r=>M.stageFor(r,selected).id==="peak");
    const target=active.length?active:regions.slice().sort((a,b)=>Math.abs(M.doyFromIso(selected)-(a.peak[0]+a.peak[1])/2)-Math.abs(M.doyFromIso(selected)-(b.peak[0]+b.peak[1])/2)).slice(0,3);
    if(!shortlist)return;
    shortlist.replaceChildren();
    const b=document.createElement("strong");
    b.textContent=active.length?"Within their typical peak windows: ":"Closest typical peak windows: ";
    shortlist.append(b);
    target.forEach((r,i)=>{
      if(i)shortlist.append(document.createTextNode(" · "));
      const a=document.createElement("a");a.href="/fall-color/"+encodeURIComponent(r.id)+"/";a.textContent=r.name;
      shortlist.append(a);
    });
  }
  function renderDate(){
    labels.textContent=dateText(selected)+(selected===today?" · Today":" · Seasonal preview");
    slider.setAttribute("aria-valuetext",dateText(selected));
    if(reset){reset.disabled=selected===today||!dates.includes(today);reset.title=dates.includes(today)?"Return to today":"Today is outside this foliage season";}
    status.textContent="All 15 regions show modeled seasonal stages for "+dateText(selected)+". These are not observed leaf-color percentages.";
    updateShortlist();
    for(const [id,row] of markerRows){
      const s=M.stageFor(row.region,selected);
      row.marker.setStyle({color:s.color,fillColor:s.color});
      row.washes.forEach((circle,i)=>circle.setStyle({fillColor:s.color,fillOpacity:M.washAlpha(s.id)*[0.40,0.7,1][i]}));
      row.hit.setPopupContent(details(row.region));
    }
    if(lastOpened){
      const row=markerRows.get(lastOpened);
      if(row&&row.hit.isPopupOpen())showWeather(row.region,row.hit);
    }
  }
  async function showWeather(region,hit){
    if(!inHorizon())return;
    const target=hit.getPopup()?.getElement()?.querySelector('[data-weekend]');
    if(!target)return;
    const key=region.id;
    if(!weatherCache.has(key)){
      const control=new AbortController();
      const timeout=setTimeout(()=>control.abort(),9000);
      weatherCache.set(key,fetch("/api/national-fall-region?region="+encodeURIComponent(key),{signal:control.signal,headers:{accept:"application/json"}})
        .then(response=>{if(!response.ok)throw Error("NWS unavailable");return response.json();})
        .finally(()=>clearTimeout(timeout)).catch(()=>null));
    }
    target.textContent="Checking the current NWS weekend weather…";
    const evidence=await weatherCache.get(key);
    // A date change or closed popup must not put stale data into another popup.
    if(!hit.isPopupOpen()||!inHorizon())return;
    const current=hit.getPopup()?.getElement()?.querySelector('[data-weekend]');
    if(!current||current.getAttribute("data-weekend")!==key)return;
    const w=evidence?.this_weekend?.weather;
    const when=evidence?.this_weekend?.date;
    if(w&&when){
      current.textContent="NWS weekend weather ("+shortDate(when)+"): "+[w.forecast,w.precipitation_risk_pct==null?null:"Rain chance up to "+w.precipitation_risk_pct+"%",w.wind].filter(Boolean).join(" · ")+". Weather is not a foliage observation.";
    }else current.textContent="Current NWS weekend outlook unavailable. The modeled seasonal stage remains usable.";
    hit.getPopup().update();
  }
  function buildMap(){
    if(typeof window.L!=="object")throw Error("Leaflet unavailable");
    map=L.map(host,{zoomControl:true,scrollWheelZoom:false,attributionControl:true,worldCopyJump:false,maxZoom:12,minZoom:2});
    map.setView([39.2,-98.8],4);
    const streets=L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains:"abcd",maxZoom:12});
    streets.on("tileerror",()=>{if(fallback)fallback.textContent="Street tiles may be unavailable; map markers and region links still work.";});
    streets.addTo(map);
    const imageryDate=new Date(Date.now()-3*86400000).toISOString().slice(0,10);
    const imagery=L.tileLayer("https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/"+imageryDate+"/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",{
      attribution:"NASA GIBS / VIIRS",maxNativeZoom:9,maxZoom:12});
    const washes=L.layerGroup().addTo(map),pins=L.layerGroup().addTo(map);
    L.control.layers({"Streets":streets,"NASA satellite":imagery},{"Foliage color wash":washes,"Region markers":pins},{collapsed:true}).addTo(map);
    regions.forEach(region=>{
      const state=M.stageFor(region,selected);
      const ringRadii=[112000,67000,32000];
      const rings=ringRadii.map((radius,i)=>L.circle([region.lat,region.lon],{
        radius,stroke:false,fillColor:state.color,fillOpacity:M.washAlpha(state.id)*[.40,.70,1][i],interactive:false
      }).addTo(washes));
      const marker=L.circleMarker([region.lat,region.lon],{radius:9,color:state.color,weight:2,fillColor:state.color,fillOpacity:.58,interactive:false}).addTo(pins);
      // Invisible touch target gives 36px hit area without changing Michigan's visible 9px marker.
      const hit=L.circleMarker([region.lat,region.lon],{radius:18,weight:0,opacity:0,fillOpacity:0,interactive:true,bubblingMouseEvents:false}).addTo(pins);
      hit.bindPopup(details(region),{maxWidth:275,minWidth:200,autoPan:true,autoPanPadding:[20,20],closeButton:true});
      hit.on("popupopen",()=>{lastOpened=region.id;showWeather(region,hit);});
      hit.on("popupclose",()=>{if(lastOpened===region.id)lastOpened=null;});
      markerRows.set(region.id,{region,marker,hit,washes:rings});
    });
    map.fitBounds([[28,-124],[49.8,-66]],{padding:[12,12],animate:false});
    map.on("baselayerchange",()=>{if(fallback)fallback.textContent="";});
    if(fallback)fallback.textContent="Zoom in on the Northeast to select neighboring regions individually, or use the linked directory below.";
    renderDate();
    // Leaflet needs a post-layout measurement after the browser loads fonts.
    requestAnimationFrame(()=>map.invalidateSize({animate:false}));
  }
  slider.addEventListener("input",()=>{
    selected=dates[Number(slider.value)]||dates[0];
    renderDate();
  });
  if(reset)reset.addEventListener("click",()=>{
    if(!dates.includes(today))return;
    selected=today;slider.value=String(dates.indexOf(today));renderDate();
  });
  try{buildMap();}catch(e){
    if(map)map.remove();
    status.textContent="Interactive map unavailable. All 15 region links below remain accessible.";
    if(fallback)fallback.textContent="Map tiles or scripts could not load. Use the region directory below.";
    updateShortlist();
  }
})();
