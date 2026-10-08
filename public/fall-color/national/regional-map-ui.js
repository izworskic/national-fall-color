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
const today=localDate(new Date());
const dates=state.seasonDates(state.seasonYear(new Date()));
let selected=state.initialDate(new Date(),dates);
const currentLabel=document.getElementById("regional-selected-date");
const reset=document.getElementById("regional-reset-date");
const switchButton=document.getElementById("regional-switch-basemap");
const sourceLabel=document.getElementById("regional-basemap-status");
const note=document.getElementById("regional-map-fallback");
let map,activeBase,cartoCount=0,cartoFailures=0,lastOpen=null;
const rows=[];
slider.min="0";slider.max=String(dates.length-1);slider.step="1";slider.value=String(dates.indexOf(selected));
const stage=()=>state.stageFor(data,selected);
function popup(d){
  const s=stage();
  return '<div class="regional-map-popup"><strong>'+escape(d.name)+'</strong>'+
    '<span class="regional-map-stage" style="color:'+s.color+'">'+escape(s.label)+'</span>'+
    '<p><b>Access vicinity:</b> '+escape(d.vicinity)+'</p>'+
    '<p>'+escape(d.corridor)+'. '+escape(d.tip)+'</p>'+
    '<p><b>Regionwide seasonal model:</b> '+fmt(s.typicalWindow.from)+'–'+fmt(s.typicalWindow.to)+
    '. Not an observed reading for this individual drive.</p>'+
    '<a class="regional-map-cta" href="#drive-'+d.index+'">View drive '+d.index+' details →</a></div>';
}
function render(){
  const s=stage();
  const text=fmt(selected)+(selected===today?" · Today":" · Seasonal preview");
  currentLabel.textContent=text;
  slider.setAttribute("aria-valuetext",text);
  if(reset)reset.disabled=!dates.includes(today)||selected===today;
  status.textContent=s.label+" · Broad regional seasonal estimate for "+fmt(selected)+". All drive markers share this planning stage; local elevation and conditions vary.";
  for(const r of rows){
    r.pin.setStyle({color:s.color,fillColor:s.color});
    r.pin.getElement()?.setAttribute("data-stage",s.id);
    r.washes.forEach((w,i)=>w.setStyle({fillColor:s.color,fillOpacity:state.washAlpha(s.id)*[.40,.70,1][i]}));
    r.hit.setPopupContent(popup(r.drive));
  }
  if(lastOpen!==null){
    const r=rows.find(x=>x.drive.index===lastOpen);
    if(r&&r.hit.isPopupOpen())r.hit.getPopup()?.update();
  }
}
try{
  map=L.map(host,{zoomControl:true,scrollWheelZoom:false,worldCopyJump:false,maxZoom:15,minZoom:3});
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
    {"Seasonal color wash":washes,"Scenic drives":pins},{collapsed:true}).addTo(map);
  if(switchButton)switchButton.addEventListener("click",()=>{
    choose(activeBase===osm?carto:osm);
  });
  map.on("baselayerchange",e=>choose(e.layer));
  window.setTimeout(()=>{
    if(map&&map.hasLayer(carto)&&cartoCount===0)
      choose(osm,"CARTO did not load — OpenStreetMap backup active");
  },7000);
  const bounds=[];
  data.drives.forEach(d=>{
    if(!Number.isFinite(d.lat)||!Number.isFinite(d.lon))return;
    const coords=[d.lat,d.lon],s=stage();
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
  if(!bounds.length)throw Error("No mapped drives");
  map.fitBounds(bounds,{padding:[32,32],maxZoom:9,animate:false});
  render();
  requestAnimationFrame(()=>map.invalidateSize({animate:false}));
}catch{
  if(map)map.remove();
  status.textContent="Interactive map unavailable; scenic drive information is available below.";
  if(note)note.textContent="Map scripts or tiles could not load; drive cards below are available.";
}
slider.addEventListener("input",()=>{
  selected=dates[Number(slider.value)]||dates[0];
  render();
});
if(reset)reset.addEventListener("click",()=>{
  if(!dates.includes(today))return;
  selected=today;
  slider.value=String(dates.indexOf(today));
  render();
});
})();