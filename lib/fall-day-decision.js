/* Shared, source-labeled fall-color day ranker. Timing is illustrative, not observed. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.FallDayDecision=api;})(typeof globalThis!=="undefined"?globalThis:null,function(){
"use strict";
const profiles={
"new-england":{
starts:[["North Conway, NH",44.054,-71.128],["Lincoln, NH",44.045,-71.670],["Stowe, VT",44.465,-72.685],["Burlington, VT",44.477,-73.213],["Portland, ME",43.659,-70.256],["Boston, MA",42.36,-71.059]],
accessUrl:"https://www.fs.usda.gov/alerts/whitemountain/alerts-notices/",accessLabel:"White Mountain National Forest alerts",
relaxed:["North Conway","Meredith / Lake Winnipesaukee","Stowe Village","Woodstock Village","Waitsfield / Mad River Valley","Manchester","Greenville / Moosehead Lake","Bethel / Western Mountains"],
cautions:{"Baxter / Katahdin Gateway":"Verify park entry and seasonal access.","Camden Hills":"Check park and summit-road access.","Franconia Notch":"Parking and congestion can affect your visit."}},
"great-smoky-mountains":{
starts:[["Gatlinburg, TN",35.714,-83.511],["Townsend, TN",35.679,-83.757],["Cherokee, NC",35.477,-83.32],["Asheville, NC",35.595,-82.551],["Knoxville, TN",35.961,-83.92]],
accessUrl:"https://www.nps.gov/grsm/planyourvisit/temproadclose.htm",accessLabel:"NPS current road and trail cautions",
relaxed:["Cades Cove Loop Road","Oconaluftee","Foothills Parkway"],
cautions:{"Kuwohi / Clingmans Dome":"Kuwohi Road is seasonal and may close in hazardous weather.","Roaring Fork Motor Nature Trail":"Seasonal one-way road with vehicle restrictions.","Blue Ridge Parkway southern section":"Verify parkway closures and access.","Cades Cove Loop Road":"Check loop hours, closures and congestion."}},
"colorado-aspens":{
starts:[["Aspen, CO",39.191,-106.818],["Crested Butte, CO",38.869,-106.988],["Estes Park, CO",40.377,-105.522],["Denver, CO",39.74,-104.99],["Telluride, CO",37.937,-107.812]],
accessUrl:"https://www.codot.gov/travel",accessLabel:"CDOT / COtrip conditions",
relaxed:["Telluride","Dallas Divide","Peak to Peak Scenic Byway"],
cautions:{"Independence Pass":"High pass closes seasonally; check CDOT and vehicle restrictions.","Trail Ridge Road / Grand Lake":"High-altitude NPS road subject to snow and seasonal closures.","Guanella Pass":"Verify high pass conditions before travel.","Kebler Pass":"Check unpaved-road and seasonal access.","Maroon Creek Road":"Reservations or shuttles may be required."}},

"adirondacks":{
 starts:[["Lake Placid, NY",44.279,-73.981],["Saranac Lake, NY",44.329,-74.131],["Tupper Lake, NY",44.224,-74.464],["Old Forge, NY",43.709,-74.974],["Lake George, NY",43.426,-73.713]],
 accessUrl:"https://dec.ny.gov/places/adirondack-backcountry-information",accessLabel:"NYS DEC Adirondack access notices",
 relaxed:["Lake Placid","Saranac Lake","Old Forge","NY-30 Adirondack Scenic Highway"],
 cautions:{"Whiteface Veterans’ Memorial Highway":"Summit highway operates seasonally; verify official dates, hours, weather and entry rules.","NY-86 through Wilmington Notch":"Check mountain road conditions and parking.","Hunter Mountain":"Verify access before traveling."},
 accessByName:{"Whiteface Veterans’ Memorial Highway":["https://whiteface.com/todo/whiteface-veterans-memorial-highway/","Official Whiteface highway hours and season"]}},
"north-shore-superior":{
 starts:[["Duluth, MN",46.787,-92.100],["Two Harbors, MN",47.022,-91.671],["Grand Marais, MN",47.750,-90.334],["Houghton, MI",47.121,-88.569],["Marquette, MI",46.544,-87.395]],
 accessUrl:"https://www.dnr.state.mn.us/current_conditions/index.html",accessLabel:"Minnesota DNR current park/trail conditions",
 accessByState:{"MI":["https://www.michigan.gov/dnr/places/state-parks/porcupine-mountains","Michigan DNR destination access"]},
 accessByName:{"US-41 / Brockway Mountain Drive":["https://www.michigan.gov/mdot/travel/traffic","Michigan DOT road and traffic information"]},
 relaxed:["North Shore Scenic Drive / MN-61","Gooseberry Falls","US-41 / Brockway Mountain Drive"],
 cautions:{"Gunflint Trail":"Remote road with weather-sensitive stretches and limited services.","Porcupine Mountains":"Verify park road, trail, and overnight access.","Brockway Mountain Drive":"Steep and seasonal road conditions may affect access."}},
"ozarks":{
 starts:[["Jasper, AR",36.009,-93.187],["Eureka Springs, AR",36.402,-93.737],["Russellville, AR",35.278,-93.133],["Branson, MO",36.643,-93.218],["Harrison, AR",36.230,-93.107]],
 accessUrl:"https://www.idrivearkansas.com/",accessLabel:"Arkansas official road conditions",
 accessByState:{"MO":["https://traveler.modot.org/","Missouri DOT road conditions"]},
 accessByName:{"Glade Top Trail":["https://www.fs.usda.gov/r09/marktwain","Mark Twain National Forest information"]},
 relaxed:["Arkansas Scenic Byway 7","Buffalo National River / Steel Creek","Mount Magazine State Park"],
 cautions:{"Glade Top Trail":"Unpaved national-forest route: check weather, surface and motor-vehicle access.","Pig Trail Scenic Byway / AR-23":"Narrow, winding corridor; check travel conditions.","Buffalo National River / Steel Creek":"Parking and river access vary with weather and park conditions."}},
"eastern-sierra":{
 starts:[["Bishop, CA",37.361,-118.395],["Mammoth Lakes, CA",37.648,-118.972],["June Lake, CA",37.779,-119.076],["Lee Vining, CA",37.957,-119.120],["Lone Pine, CA",36.606,-118.063]],
 accessUrl:"https://quickmap.dot.ca.gov/",accessLabel:"Caltrans QuickMap road conditions",
 relaxed:["June Lake Loop / CA-158","Convict Lake","Bishop Creek Canyon"],
 cautions:{"Rock Creek Road":"High-elevation road: snowfall can restrict access early.","Lundy Canyon":"Some access is on unpaved or rough road; confirm road and trail conditions.","Bishop Creek Canyon":"High canyon roads, trailheads and lakes can see early snow.","McGee Creek":"Check seasonal trailhead access and weather."}},
"wasatch":{
 starts:[["Salt Lake City, UT",40.760,-111.891],["Park City, UT",40.647,-111.498],["Provo, UT",40.234,-111.659],["Kamas, UT",40.643,-111.282],["Logan, UT",41.736,-111.834]],
 accessUrl:"https://udottraffic.utah.gov/",accessLabel:"UDOT official traffic and road conditions",
 relaxed:["Big Cottonwood Canyon","Logan Canyon"],
 cautions:{"Alpine Loop Scenic Byway":"Seasonal mountain road, closures and narrow switchbacks.","Guardsman Pass":"High pass closes with snow or hazardous weather.","Mirror Lake Highway / UT-150":"Seasonal high-elevation access; check restrictions.","Big Cottonwood Canyon":"Weather, rockfall and canyon traffic can affect road access."}},
"columbia-river-gorge":{
 starts:[["Portland, OR",45.515,-122.678],["Hood River, OR",45.705,-121.521],["The Dalles, OR",45.601,-121.183],["Stevenson, WA",45.695,-121.886],["Vancouver, WA",45.638,-122.662]],
 accessUrl:"https://tripcheck.com/",accessLabel:"ODOT TripCheck road conditions",
 accessByState:{"WA":["https://wsdot.com/travel/real-time/","Washington State DOT travel alerts"]},
 accessByName:{"WA-14 Columbia River Scenic Byway":["https://wsdot.com/travel/real-time/","Washington State DOT travel alerts"]},
 relaxed:["Hood River Fruit Loop","Crown Point / Vista House","Rowena Crest","WA-14 Columbia River Scenic Byway"],
 cautions:{"Historic Columbia River Highway":"Check waterfall corridor parking, timed-use permits and closures.","Crown Point / Vista House":"Verify hours, parking access and wind conditions.","Hood River Fruit Loop":"Individual orchards and stops may be seasonal; no operating hours are assumed."}},
"door-county":{
 starts:[["Sturgeon Bay, WI",44.834,-87.377],["Fish Creek, WI",45.127,-87.247],["Sister Bay, WI",45.189,-87.123],["Egg Harbor, WI",45.049,-87.277],["Baileys Harbor, WI",45.064,-87.123]],
 accessUrl:"https://511wi.gov/",accessLabel:"Wisconsin 511 road conditions",
 relaxed:["WI-42 north peninsula","WI-57 eastern shore","Peninsula State Park Scenic Drive","Cave Point County Park"],
 cautions:{"Peninsula State Park Scenic Drive":"State park vehicle admission and seasonal road conditions apply.","Cave Point County Park":"Busy shoreline access; watch wet or icy limestone edges.","Newport State Park":"Trail conditions and park facilities vary by season."}},
"poconos":{
 starts:[["Stroudsburg, PA",40.986,-75.195],["Milford, PA",41.323,-74.802],["Jim Thorpe, PA",40.875,-75.732],["Scranton, PA",41.409,-75.662],["Bushkill, PA",41.094,-75.006]],
 accessUrl:"https://www.511pa.com/",accessLabel:"PennDOT 511 road conditions",
 accessByState:{"NJ":["https://www.511nj.org/","New Jersey 511 travel conditions"]},
 relaxed:["PA-402 / Lake Wallenpaupack corridor","PA-611 Delaware River corridor","Lehigh Gorge / Jim Thorpe"],
 cautions:{"Bushkill Falls":"Private attraction: check tickets, hours and stair/trail access.","Hickory Run State Park":"Check seasonal trailhead and park access.","Delaware Water Gap / US-209":"Road and trail restrictions may change in the recreation area."}},
"texas-hill-country":{
 starts:[["Kerrville, TX",30.047,-99.140],["Fredericksburg, TX",30.275,-98.872],["Bandera, TX",29.726,-99.074],["Leakey, TX",29.724,-99.762],["San Antonio, TX",29.425,-98.494]],
 accessUrl:"https://drivetexas.org/",accessLabel:"TxDOT DriveTexas travel conditions",
 relaxed:["FM-337","Garner State Park / Concan","South Llano River State Park"],
 cautions:{"FM-187 / Lost Maples approach":"Lost Maples State Natural Area entry can fill; check reservation requirements.","Garner State Park / Concan":"Verify park day-use reservations, capacity and access.","South Llano River State Park":"Check day-use reservations and park status.","FM-336 / FM-335 loop":"Remote, winding roads with limited services; check conditions."},
 accessByName:{"FM-187 / Lost Maples approach":["https://tpwd.texas.gov/state-parks/lost-maples","Texas Parks and Wildlife — Lost Maples visits"]}},
"west-virginia-highlands":{
 starts:[["Davis, WV",39.128,-79.467],["Canaan Valley, WV",39.059,-79.433],["Elkins, WV",38.926,-79.847],["Seneca Rocks, WV",38.835,-79.365],["Marlinton, WV",38.224,-80.094]],
 accessUrl:"https://www.wv511.org/",accessLabel:"West Virginia 511 road conditions",
 relaxed:["US-48 / Corridor H overlooks","WV-32","Blackwater Falls"],
 cautions:{"Highland Scenic Highway / WV-150":"High-elevation route can close or become dangerous in ice and snow.","Dolly Sods Wilderness":"Remote access can include rough forest roads; hiking terrain and weather require care.","Seneca Rocks":"Viewing can be accessible; summit hikes are steep and not an easy outing."}},
"catskills":{
 starts:[["Woodstock, NY",42.040,-74.119],["Phoenicia, NY",42.084,-74.317],["Hunter, NY",42.212,-74.215],["Windham, NY",42.307,-74.252],["Kingston, NY",41.927,-73.998]],
 accessUrl:"https://dec.ny.gov/places/catskill-backcountry-information",accessLabel:"NYS DEC Catskill access notices",
 relaxed:["Catskill Mountains Scenic Byway / NY-28","NY-23 Windham corridor","Ashokan Reservoir"],
 cautions:{"NY-23A / Kaaterskill Clove":"Steep roads and trail parking can restrict stops; never park in no-parking areas.","Hunter Mountain":"Lift and attraction schedules may vary; mountain hiking requires preparation.","Ashokan Reservoir":"Check permitted viewing areas and watershed access restrictions."}},
"shenandoah":{
 starts:[["Front Royal, VA",38.918,-78.195],["Luray, VA",38.665,-78.459],["Harrisonburg, VA",38.450,-78.869],["Waynesboro, VA",38.068,-78.890],["Charlottesville, VA",38.029,-78.477]],
 accessUrl:"https://www.nps.gov/shen/planyourvisit/driving-skyline-drive.htm",accessLabel:"NPS Skyline Drive status and alerts",
 relaxed:["Skyline Drive North District","Skyline Drive Central District","Skyline Drive South District","Big Meadows"],
 cautions:{"Hawksbill Mountain vicinity":"Summit viewpoint requires hiking; do not classify as an easy roadside stop.","Blue Ridge Parkway northern section":"Parkway weather closures are separate from Shenandoah's Skyline Drive.","Skyland / Stony Man":"Verify available parking and trail conditions."},
 accessByName:{"Blue Ridge Parkway northern section":["https://www.nps.gov/blri/planyourvisit/roadclosures.htm","NPS Blue Ridge Parkway road closures"]}}

};
const stagePoints={peak:100,approaching:88,developed:76,fading:67,gold:55,early:34,past:24,green:12,bare:0,offseason:0};
const maxAirMiles={short:75,half:155,day:300};
function airMiles(a,b){
 if(!a||!b||![a.lat,a.lon,b.lat,b.lon].every(Number.isFinite))return null;
 const t=Math.PI/180,dlat=(b.lat-a.lat)*t,dlon=(b.lon-a.lon)*t;
 const q=Math.sin(dlat/2)**2+Math.cos(a.lat*t)*Math.cos(b.lat*t)*Math.sin(dlon/2)**2;
 return 3958.8*2*Math.asin(Math.min(1,Math.sqrt(q)));
}
function allowedStyle(profile,point,style){
 if(style==="drive")return point.kind==="drive";
 if(style==="relaxed")return profile.relaxed.includes(point.name);
 return true; // photo: overlooks, scenic drives and viewing areas, no trails inferred
}
function rank(map,opts,model){
 if(!map||!profiles[map.id]||!model||!validDate(opts.date))return[];
 const profile=profiles[map.id],style=["drive","relaxed","photo"].includes(opts.style)?opts.style:"drive";
 const radius=maxAirMiles[opts.length]||maxAirMiles.half;
 const points=[...(map.drives||[]).map(p=>({...p,kind:"drive"})),...(map.spots||[]).map(p=>({...p,kind:"spot"}))];
 return points.flatMap(point=>{
  if(!Number.isFinite(point.lat)||!Number.isFinite(point.lon)||!Array.isArray(point.peak)||!allowedStyle(profile,point,style))return[];
  const stage=model.stageFor(point,opts.date),value=stagePoints[stage.id]||0;
  if(value<20)return[];
  const distance=opts.origin?airMiles(opts.origin,point):null;
  if(distance!==null&&distance>radius)return[];
  const caution=profile.cautions[point.name]||null;
  const access=profile.accessByName?.[point.name]||profile.accessByState?.[point.state]||[profile.accessUrl,profile.accessLabel];
  const score=value-(distance===null?0:25*distance/radius)-(caution?5:0)+(point.kind==="drive"&&style==="drive"?5:0);
  return [{...point,stage,distance,score,accessCaution:caution,
    accessUrl:access[0],accessLabel:access[1],
    sourceUrl:point.sourceUrl||point.timing?.sourceUrl||access[0]}];
 }).sort((a,b)=>b.score-a.score||(a.distance??0)-(b.distance??0)||a.name.localeCompare(b.name)).slice(0,3);
}
function companion(top,results){return top?results.slice(1).find(p=>(airMiles(top,p)??Infinity)<=30)||null:null;}
function validDate(date){
 if(typeof date!=="string"||!/^(20\d\d)-(\d\d)-(\d\d)$/.test(date))return false;
 const d=new Date(date+"T12:00:00Z");if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==date)return false;
 const m=d.getUTCMonth()+1;return m>=9&&(m<=11||m===12&&d.getUTCDate()<=8);
}
return Object.freeze({profiles,stagePoints,maxAirMiles,rank,airMiles,companion,validDate});
});