/* Reusable regional-map layer: national -> region -> scenic corridor.
   One schematic access-area point per existing drive (NOT a route trace).
   Modeled regional timing only. Never report live observed leaf percentages. */
(function(){
"use strict";
const host=document.getElementById("regional-map");
const dataNode=document.getElementById("regional-map-data");
const slider=document.getElementById("regional-date-slider");
const state=window.NationalFallMapState;
const status=document.getElementById("regional-map-status");
if(!host||!dataNode||!slider||!status)return;
let data;
try{data=JSON.parse(dataNode.textContent);}
catch{status.textContent="Map data unavailable; use the scenic drive cards below.";return;}
if(!state||typeof window.L!=="object"||!Array.isArray(data.drives)||!data.drives.length){
  status.textContent="Interactive map unavailable; the scenic drive details below remain accessible.";
  return;
}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const localDate=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const fmt=iso=>new Date(iso+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"});
const clock=new Date();
const today=localDate(clock);
const baselineYear=state.seasonYear(clock);
let dates=state.seasonDates(baselineYear);
const calendarOffSeason=!dates.includes(today);
let offSeason=calendarOffSeason;
let selected=offSeason?dates[dates.length-1]:state.initialDate(clock,dates);
const currentLabel=document.getElementById("regional-selected-date");
const reset=document.getElementById("regional-reset-date");
const preview=document.getElementById("regional-preview-next");
const switchButton=document.getElementById("regional-switch-basemap");
const sourceLabel=document.getElementById("regional-basemap-status");
const note=document.getElementById("regional-map-fallback");
let map,activeBase,cartoCount=0,cartoFailures=0,lastOpen=null;
const rows=[];
const spotRows=[];
let lastOpenSpot=null;
const areaPicker=document.getElementById("regional-area-picker");
slider.min="0";slider.max=String(dates.length-1);slider.step="1";slider.value=String(dates.indexOf(selected));
const stage=()=>offSeason?state.offSeasonStage(data,baselineYear):state.stageFor(data,selected);
const siteStage=point=>offSeason?state.offSeasonStage(point,baselineYear):state.stageFor(point,selected);
const localModel=point=>point.timing&&point.timing.basis&&Array.isArray(point.peak);
function popup(d){
  const s=siteStage(d);
  return '<div class="regional-map-popup"><strong>'+escape(d.name)+'</strong>'+
    '<span class="regional-map-stage" style="color:'+s.color+'">'+escape(s.label)+'</span>'+
    '<p><b>Access vicinity:</b> '+escape(d.vicinity)+'</p>'+
    '<p>'+escape(d.corridor)+'. '+escape(d.tip)+'</p>'+
    '<p><b>Illustrative local color window:</b> '+fmt(s.typicalWindow.from)+'–'+fmt(s.typicalWindow.to)+
    '. Based on '+escape(d.timing.area)+'. Not an observed reading for this individual drive.</p>'+
    '<p><a href="'+escape(d.timing.sourceUrl)+'" rel="noopener noreferrer" target="_blank">Source: regional foliage progression ↗</a></p>'+
    '<a class="regional-map-cta" href="#drive-'+d.index+'">View drive '+d.index+' details →</a></div>';
}
function spotPopup(x){
  const stateInfo=siteStage(x);
  const source=(typeof x.sourceUrl==="string"&&x.sourceUrl.startsWith("https://"))?x.sourceUrl:null;
  return '<div class="regional-map-popup"><strong>'+escape(x.name)+'</strong>'+
    '<span class="regional-map-stage" style="color:'+stateInfo.color+'">'+escape(stateInfo.label)+'</span>'+
    '<p><b>Viewing area · '+escape(x.state)+'</b> (approximate map location)</p>'+
    '<p>'+escape(x.reason)+'</p>'+
    '<p><b>Illustrative local color window:</b> '+fmt(stateInfo.typicalWindow.from)+'–'+fmt(stateInfo.typicalWindow.to)+'</p>'+
    '<p>'+escape(x.timing.area)+'. This is not a current leaf-color reading here.</p>'+
    '<p><a href="'+escape(x.timing.sourceUrl)+'" rel="noopener noreferrer" target="_blank">Source: regional seasonal progression ↗</a></p>'+
    '<a class="regional-map-cta" href="#viewing-'+x.index+'">View location details →</a>'+
    (source?'<p><a href="'+escape(source)+'" target="_blank" rel="noopener noreferrer">Official regional travel or park reference ↗</a></p>':'')+
    '</div>';
}
function render(){
  const text=offSeason?"Season complete · "+baselineYear:fmt(selected)+(selected===today?" · Today":" · Seasonal preview");
  currentLabel.textContent=text;
  slider.setAttribute("aria-valuetext",offSeason?"Season complete; select a historic fall date or preview next season":text);
  if(reset){
    reset.disabled=offSeason||(selected===today&&!calendarOffSeason);
    reset.textContent=calendarOffSeason?"Season status":"Today";
  }
  if(preview){
    preview.hidden=!calendarOffSeason;
    preview.textContent="Preview fall "+(baselineYear+1);
  }
  const stages=[...rows.map(r=>siteStage(r.drive)),...spotRows.map(r=>siteStage(r.place))];
  const peaks=stages.filter(s=>s.id==="peak").length;
  const developing=stages.filter(s=>["developed","approaching","gold","early"].includes(s.id)).length;
  status.textContent=offSeason
    ?"Season complete · muted gray-brown map. Select a past fall date to review the progression, or preview fall "+(baselineYear+1)+". Not live foliage readings."
    :"On "+fmt(selected)+": "+peaks+" of "+stages.length+" locations within their modeled typical peak windows; "+
    developing+" progressing toward color. Dots differ by landscape, not by live site observations.";
  for(const r of rows){
    const own=siteStage(r.drive);
    r.pin.setStyle({color:own.color,fillColor:own.color});
    r.pin.getElement()?.setAttribute("data-stage",own.id);
    r.washes.forEach((w,i)=>w.setStyle({fillColor:own.color,fillOpacity:state.washAlpha(own.id)*[.40,.70,1][i]}));
    r.hit.setPopupContent(popup(r.drive));
  }
  for(const r of spotRows){
    const own=siteStage(r.place);
    r.pin.setStyle({fillColor:own.color,color:"#ffffff"});
    r.pin.getElement()?.setAttribute("data-stage",own.id);
    r.hit.setPopupContent(spotPopup(r.place));
  }
  if(lastOpenSpot!==null){
    const r=spotRows.find(x=>x.place.index===lastOpenSpot);
    if(r&&r.hit.isPopupOpen())r.hit.getPopup()?.update();
  }
  if(lastOpen!==null){
    const r=rows.find(x=>x.drive.index===lastOpen);
    if(r&&r.hit.isPopupOpen())r.hit.getPopup()?.update();
  }
}
try{
  map=L.map(host,{zoomControl:true,scrollWheelZoom:false,worldCopyJump:false,maxZoom:15,minZoom:3});
  // Leaflet must have an initial view before addTo(map), otherwise paths have no
  // SVG element when the data attributes and 36px interactive targets are wired.
  map.setView([data.lat,data.lon],7);
  const carto=L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_2y8f_1_1ee5e3a872c91d0ebf5d7b88",{
    subdomains:"abcd",maxZoom:15,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  });
  const osm=L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
    maxZoom:15,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });
  const imageDate=new Date(Date.now()-3*86400000).toISOString().slice(0,10);
  const satellite=L.tileLayer("https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/"+imageDate+"/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",{
    maxNativeZoom:9,maxZoom:15,attribution:"NASA GIBS / VIIRS"
  });
  const washes=L.layerGroup().addTo(map);
  const pins=L.layerGroup().addTo(map);
  const spotsLayer=L.layerGroup().addTo(map);
  activeBase=carto;
  function choose(layer,message){
    if(activeBase!==layer){
      if(map.hasLayer(carto))map.removeLayer(carto);
      if(map.hasLayer(osm))map.removeLayer(osm);
      if(map.hasLayer(satellite))map.removeLayer(satellite);
      layer.addTo(map);activeBase=layer;
    }
    if(switchButton){
      switchButton.disabled=layer===satellite;
      switchButton.textContent=layer===osm?"Use CARTO streets instead":"Use OpenStreetMap instead";
    }
    if(sourceLabel)sourceLabel.textContent=message||(
      layer===carto?"CARTO Voyager streets":layer===osm?"OpenStreetMap streets":"NASA satellite");
  }
  carto.on("tileload",()=>{cartoCount++;});
  carto.on("tileerror",()=>{
    if(!map.hasLayer(carto))return;
    cartoFailures++;
    if(cartoCount===0&&cartoFailures>=3)
      choose(osm,"CARTO unavailable — OpenStreetMap backup active");
  });
  osm.on("tileerror",()=>{if(map.hasLayer(osm)&&note)note.textContent="Map tiles unavailable; use the drive list below.";});
  carto.addTo(map);
  L.control.layers({"CARTO streets":carto,"OpenStreetMap":osm,"NASA satellite":satellite},
    {"Seasonal color wash":washes,"Scenic drives":pins,"Viewing locations":spotsLayer},{collapsed:true}).addTo(map);
  if(switchButton)switchButton.addEventListener("click",()=>{
    choose(activeBase===osm?carto:osm);
  });
  map.on("baselayerchange",e=>{
    // Leaflet's own layer selector already switches providers; only sync the UI.
    // Calling choose() here can re-enter the layer-control event and undo
    // a user's manual switch.
    activeBase=e.layer;
    if(switchButton){
      switchButton.disabled=activeBase===satellite;
      switchButton.textContent=activeBase===osm?"Use CARTO streets instead":"Use OpenStreetMap instead";
    }
    if(sourceLabel)sourceLabel.textContent=
      activeBase===osm?"OpenStreetMap streets":activeBase===satellite?"NASA satellite":"CARTO Voyager streets";
  });
  window.setTimeout(()=>{
    if(map&&map.hasLayer(carto)&&cartoCount===0)
      choose(osm,"CARTO did not load — OpenStreetMap backup active");
  },7000);
  const bounds=[];
  data.drives.forEach(d=>{
    if(!Number.isFinite(d.lat)||!Number.isFinite(d.lon)||!localModel(d))return;
    const coords=[d.lat,d.lon],s=siteStage(d);
    bounds.push(coords);
    // Three restrained rings, like Michigan. Illustrative, not a polygon of color.
    const ringRadii=[26000,16000,9000];
    const washLayers=ringRadii.map((radius,i)=>L.circle(coords,{
      radius,stroke:false,fillColor:s.color,fillOpacity:state.washAlpha(s.id)*[.40,.70,1][i],interactive:false
    }).addTo(washes));
    const pin=L.circleMarker(coords,{radius:9,weight:2,color:s.color,
      fillColor:s.color,fillOpacity:.60,interactive:false}).addTo(pins);
    pin.getElement()?.setAttribute("data-regional-drive",String(d.index));
    pin.getElement()?.setAttribute("data-stage",s.id);
    const hit=L.circleMarker(coords,{radius:18,weight:0,opacity:0,
      fillOpacity:0,interactive:true,bubblingMouseEvents:false}).addTo(pins);
    const el=hit.getElement();
    if(el){
      el.setAttribute("data-regional-drive-hit",String(d.index));
      el.setAttribute("tabindex","0");
      el.setAttribute("role","button");
      el.setAttribute("aria-label","View "+d.name+" foliage planning details");
      el.addEventListener("keydown",e=>{
        if(e.key==="Enter"||e.key===" "){e.preventDefault();hit.openPopup();}
      });
    }
    hit.bindPopup(popup(d),{maxWidth:285,minWidth:210,autoPan:true,autoPanPadding:[18,18]});
    hit.on("popupopen",()=>{lastOpen=d.index;});
    hit.on("popupclose",()=>{if(lastOpen===d.index)lastOpen=null;});
    rows.push({drive:d,pin,hit,washes:washLayers});
  });
  (Array.isArray(data.spots)?data.spots:[]).forEach(place=>{
    if(!Number.isFinite(place.lat)||!Number.isFinite(place.lon)||!localModel(place))return;
    const coords=[place.lat,place.lon],s=siteStage(place);
    bounds.push(coords);
    // Deliberately smaller than the 9px scenic-drive corridor symbols;
    // secondary locations receive no extra wash to avoid giant color blobs.
    const pin=L.circleMarker(coords,{radius:6,weight:2,color:"#ffffff",fillColor:s.color,
      fillOpacity:.90,interactive:false}).addTo(spotsLayer);
    pin.getElement()?.setAttribute("data-regional-spot",String(place.index));
    pin.getElement()?.setAttribute("data-stage",s.id);
    const hit=L.circleMarker(coords,{radius:16,weight:0,opacity:0,
      fillOpacity:0,interactive:true,bubblingMouseEvents:false}).addTo(spotsLayer);
    const el=hit.getElement();
    if(el){
      el.setAttribute("data-regional-spot-hit",String(place.index));
      el.setAttribute("tabindex","0");
      el.setAttribute("role","button");
      el.setAttribute("aria-label","View "+place.name+" on the foliage map");
      el.addEventListener("keydown",e=>{
        if(e.key==="Enter"||e.key===" "){e.preventDefault();hit.openPopup();}
      });
    }
    hit.bindPopup(spotPopup(place),{maxWidth:285,minWidth:210,
      autoPan:true,autoPanPadding:[18,18]});
    hit.on("popupopen",()=>{lastOpenSpot=place.index;});
    hit.on("popupclose",()=>{if(lastOpenSpot===place.index)lastOpenSpot=null;});
    spotRows.push({place,pin,hit});
  });
  if(!bounds.length)throw Error("No mapped drives");
  const fitLocations=coordinates=>{
    if(coordinates.length)map.fitBounds(coordinates,{padding:[32,32],maxZoom:9,animate:false});
  };
  fitLocations(bounds);
  if(areaPicker)areaPicker.addEventListener("change",()=>{
    const code=areaPicker.value;
    if(code==="all"){fitLocations(bounds);return;}
    const areaSpots=spotRows.filter(row=>row.place.state===code).map(row=>[row.place.lat,row.place.lon]);
    fitLocations(areaSpots);
  });
  document.querySelectorAll("[data-regional-spot-pick]").forEach(button=>{
    button.addEventListener("click",()=>{
      const index=Number(button.getAttribute("data-regional-spot-pick"));
      const row=spotRows.find(item=>item.place.index===index);
      if(!row)return;
      // Location-list selection resolves ambiguity among nearby dots.
      map.setView([row.place.lat,row.place.lon],Math.max(map.getZoom(),10),{animate:false});
      row.hit.openPopup();
      host.scrollIntoView({behavior:"smooth",block:"center"});
    });
  });
  render();
  requestAnimationFrame(()=>map.invalidateSize({animate:false}));
}catch{
  if(map)map.remove();
  status.textContent="Interactive map unavailable; scenic drive information is available below.";
  if(note)note.textContent="Map scripts or tiles could not load; drive cards below are available.";
}
slider.addEventListener("input",()=>{
  selected=dates[Number(slider.value)]||dates[0];
  offSeason=false;
  render();
});
if(reset)reset.addEventListener("click",()=>{
  if(calendarOffSeason){
    dates=state.seasonDates(baselineYear);
    slider.min="0";slider.max=String(dates.length-1);
    slider.value=String(dates.length-1);
    selected=dates[dates.length-1];
    offSeason=true;
  }else{
    selected=today;
    slider.value=String(dates.indexOf(today));
    offSeason=false;
  }
  render();
});
if(preview)preview.addEventListener("click",()=>{
  if(!calendarOffSeason)return;
  dates=state.seasonDates(baselineYear+1);
  slider.min="0";slider.max=String(dates.length-1);
  slider.value="0";
  selected=dates[0];
  offSeason=false;
  render();
});
})();