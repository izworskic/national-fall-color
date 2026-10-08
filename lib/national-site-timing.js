/* National fall-color local timing profiles. Conservative planning scenarios, NOT
 * measurements and NOT a learned/validated forecast of each landmark.
 * Site zones encode official qualitative high->low, north->south and
 * inland->shore progressions; offsets are EDITORIAL scenario choices.
 * The 9-day peak band is illustrative, not a guaranteed peak interval.
 * In particular, never show leaf percentage, live status, or "X days exact".
 *
 * Michigan reference: eight distinct geographies with their own seasonal
 * stage windows and optional live input. We reuse ONLY the honest geographic
 * baseline pattern here; site-specific canopy sensor inputs do not exist.
 */
"use strict";
const sourceLinks=Object.freeze({
 "new-england":"https://www.visitnh.gov/plan-your-trip/fall/foliage-tracker",
 "new-england-vt":"https://vermontvacation.com/vermont-seasons/fall/foliage-forecaster-map/",
 "new-england-me":"https://www.maine.gov/dacf/mfs/projects/fall_foliage/whenandwhere/",
 "great-smoky-mountains":"https://www.nps.gov/grsm/planyourvisit/fallcolor.htm",
 "colorado-aspens":"https://www.colorado.com/activities/fall-season",
 "adirondacks":"https://www.iloveny.com/things-to-do/fall/foliage-report/",
 "north-shore-superior":"https://www.dnr.state.mn.us/state_parks/northshore_treesshrubs.html",
 "ozarks":"https://www.arkansas.com/articles/fall-foliage-arkansas",
 "eastern-sierra":"https://www.visitcalifornia.com/experience/8-perfect-places-see-fabulous-fall-colors/",
 "wasatch":"https://www.visitutah.com/things-to-do/fall-foliage",
 "columbia-river-gorge":"https://traveloregon.com/things-to-do/destinations/parks-forests-wildlife-areas/",
 "door-county":"https://dnr.wisconsin.gov/wnrmag/2019/Fall/Door",
 "poconos":"https://www.poconomountains.com/plan-your-vacation/seasons/fall/fall-foliage-forecast/",
 "texas-hill-country":"https://tpwd.texas.gov/state-parks/lost-maples/nature",
 "west-virginia-highlands":"https://wvstateparks.com/park/blackwater-falls-state-park/",
 "catskills":"https://www.iloveny.com/things-to-do/fall/foliage-report/",
 "shenandoah":"https://www.nps.gov/shen/planyourvisit/fall.htm"
});
// Zone shifts in days relative to parent region's historic-window midpoint.
// This is an ordinal *illustration* of local timing differences, NOT a
// statistical estimate of actual peak-date error or probability.
const p=(description,shift,sourceKey)=>({description,shift,sourceKey});
const catalog=Object.freeze({
 "new-england":{
  zones:{
   farNorth:p("Northern highlands commonly turn first",-13,"new-england"),
   whiteHigh:p("White Mountain high ridges typically precede the low valleys",-8,"new-england"),
   white:p("White Mountain notch and valley season",-3,"new-england"),
   nhLakes:p("New Hampshire lakes and lower valleys commonly turn later",9,"new-england"),
   vtNorth:p("Northern Vermont highlands lead the valley season",-7,"new-england-vt"),
   vtValley:p("Vermont Green Mountain valleys follow high slopes",3,"new-england-vt"),
   vtSouth:p("Southern Vermont and lower valleys often retain color later",12,"new-england-vt"),
   meNorth:p("Northern Maine peaks ahead of western and coastal Maine",-13,"new-england-me"),
   meWest:p("Western Maine mountains typically peak in early-to-mid October",-3,"new-england-me"),
   meCoast:p("Coastal Maine typically lags northern and inland forest",13,"new-england-me")
  },
  drives:["white","vtNorth","meCoast","white"],
  spots:["white","white","whiteHigh","farNorth","nhLakes","vtNorth","vtSouth","vtNorth","vtValley","vtSouth","vtSouth","meWest","meCoast","meWest","meNorth","meWest"]
 },
 "great-smoky-mountains":{
  zones:{
   ridge:p("High ridges and upper-elevation hardwoods turn before valleys",-14,"great-smoky-mountains"),
   middle:p("Middle slopes transition after the high ridges",-3,"great-smoky-mountains"),
   valley:p("Low valleys often show their strongest hardwood colors later",10,"great-smoky-mountains")
  },
  drives:["ridge","valley","middle","middle"],
  spots:["ridge","valley","valley"]
 },
 "colorado-aspens":{
  zones:{
   high:p("High-elevation aspen basins commonly change first",-7,"colorado-aspens"),
   mountain:p("Mountain aspen corridors typically follow early alpine stands",-1,"colorado-aspens"),
   lower:p("Lower-elevation valleys and foothills can retain color later",9,"colorado-aspens")
  },
  drives:["mountain","high","lower","high"],
  spots:["high","high","mountain","lower"]
 },
 "adirondacks":{
  zones:{
   summit:p("High Adirondack ridges turn early",-8,"adirondacks"),
   interior:p("Interior mountain-lake forests follow the highest ridges",-2,"adirondacks"),
   lower:p("Lower lake-and-valley corridors often follow upper elevations",8,"adirondacks")
  },
  drives:["summit","interior","lower"],
  spots:["interior","interior","lower"]
 },
 "north-shore-superior":{
  zones:{
   inland:p("Inland Sawtooth forests change before lake-influenced shores",-7,"north-shore-superior"),
   shore:p("Lake Superior shoreline foliage tends to follow inland ridges",7,"north-shore-superior"),
   up:p("Western U.P. forest ridges can lead Michigan's later southern areas",-2,"north-shore-superior")
  },
  drives:["shore","inland","up"],
  spots:["shore","shore","up"]
 },
 "ozarks":{
  zones:{
   high:p("Higher Ozark hardwood ridges can turn before sheltered valleys",-6,"ozarks"),
   middle:p("Ozark mountain slopes and forested byways are the central seasonal band",0,"ozarks"),
   valley:p("Lower river corridors and warmer valleys can turn later",7,"ozarks")
  },
  drives:["middle","high","middle"],
  spots:["valley","high"]
 },
 "eastern-sierra":{
  zones:{
   alpine:p("High alpine aspen basins can change ahead of lower lakeshore stands",-8,"eastern-sierra"),
   middle:p("Middle-elevation Sierra canyons follow the earliest alpine groves",0,"eastern-sierra"),
   lower:p("Lower eastern Sierra pockets sometimes hold color later",7,"eastern-sierra")
  },
  drives:["alpine","lower","alpine"],
  spots:["middle","alpine","middle"]
 },
 "wasatch":{
  zones:{
   high:p("High Wasatch pass aspens change before lower canyon hardwoods",-8,"wasatch"),
   middle:p("Middle mountain elevations follow early pass color",-1,"wasatch"),
   canyon:p("Lower Wasatch canyons may show color after the upper passes",8,"wasatch")
  },
  drives:["middle","high","high"],
  spots:["canyon","middle"]
 },
 "columbia-river-gorge":{
  zones:{
   high:p("Cooler wooded foothills can change before lower valley roads",-5,"columbia-river-gorge"),
   gorge:p("Gorge slopes have highly variable microclimates",0,"columbia-river-gorge"),
   river:p("Low river corridors can run later than upland sites",6,"columbia-river-gorge")
  },
  drives:["gorge","river","high"],
  spots:["gorge","river"]
 },
 "door-county":{
  zones:{
   inland:p("Inland peninsula hardwoods have a different season from lakeshores",-5,"door-county"),
   west:p("Western peninsula woods and villages have intermediate exposure",1,"door-county"),
   shore:p("Lake Michigan shoreline differs in exposure and tree mix",6,"door-county")
  },
  drives:["west","inland","shore"],
  spots:["shore","inland"]
 },
 "poconos":{
  zones:{
   ridge:p("Cooler Pocono ridge forests can turn before Delaware Valley sites",-7,"poconos"),
   middle:p("Mountain lakes and forested uplands are a middle seasonal band",0,"poconos"),
   river:p("Lower river valleys can lag upland foliage",8,"poconos")
  },
  drives:["river","middle","river"],
  spots:["river","ridge","river"]
 },
 "texas-hill-country":{
  zones:{
   canyonMaples:p("Isolated Lost Maples canyon stands change in late Oct–early Nov",-6,"texas-hill-country"),
   ridge:p("Hill-country oak and canyon roads have mixed species; weak date evidence",2,"texas-hill-country"),
   riparian:p("Riparian cypress and maples differ from canyon hardwoods; weak comparability",9,"texas-hill-country")
  },
  drives:["ridge","canyonMaples","ridge"],
  spots:["riparian","riparian"]
 },
 "west-virginia-highlands":{
  zones:{
   plateau:p("Exposed highland plateaus commonly lead lower valley woods",-8,"west-virginia-highlands"),
   mountain:p("Forested highland ridges are the middle seasonal band",0,"west-virginia-highlands"),
   valley:p("Lower enclosed valleys tend to follow high ridges",8,"west-virginia-highlands")
  },
  drives:["plateau","mountain","valley"],
  spots:["mountain","plateau","valley"]
 },
 "catskills":{
  zones:{
   high:p("High Catskill ridges typically precede warmer lowlands",-7,"catskills"),
   middle:p("Forested Catskill valleys follow the early mountain slopes",1,"catskills"),
   lower:p("Lower basin sites and reservoir edges may turn later",8,"catskills")
  },
  drives:["middle","high","high"],
  spots:["high","lower"]
 },
 "shenandoah":{
  zones:{
   high:p("Skyline Drive high ridges turn earlier than valleys",-8,"shenandoah"),
   middle:p("Middle ridge elevations show an intermediate phase",0,"shenandoah"),
   low:p("Lower park approaches and southern valley margins often change later",8,"shenandoah")
  },
  drives:["low","high","middle","low"],
  spots:["middle","high","high"]
 }
});
const siteProfiles=Object.freeze(catalog);
const HALF_WINDOW=5; // broad 11-day indicative band, NOT calendar-date precision
function pointTiming(region,kind,index){
  const cfg=catalog[region.id];
  if(!cfg)throw Error("Missing profile: "+region.id);
  const zones=kind==="drive"?cfg.drives:kind==="spot"?cfg.spots:null;
  if(!zones||!Number.isInteger(index)||index<0||index>=zones.length)throw Error("Unknown site timing "+region.id+" "+kind+" "+index);
  const zoneId=zones[index],zone=cfg.zones[zoneId];
  if(!zone||!sourceLinks[zone.sourceKey])throw Error("Incomplete timing evidence: "+region.id+" "+zoneId);
  const parent=(region.peak[0]+region.peak[1])/2;
  const center=Math.round(parent+zone.shift);
  return {peak:[center-HALF_WINDOW,center+HALF_WINDOW],
    timing:{zone:zoneId,area:zone.description,sourceUrl:sourceLinks[zone.sourceKey],
      basis:"Indicative local climatology; geography and elevation, not observed live foliage",
      confidence:"illustrative"}};
}
function validateCatalog(regions,spotsById){
  const all=new Set(regions.map(r=>r.id));
  if(Object.keys(catalog).length!==all.size)throw Error("Site timing catalog must cover each region");
  for(const r of regions){
    const c=catalog[r.id];
    if(!c||c.drives.length!==r.drives.length||c.spots.length!==(spotsById[r.id]||[]).length)
      throw Error("Timing zone cardinality mismatch: "+r.id);
    for(const kind of ["drive","spot"])
      c[kind==="drive"?"drives":"spots"].forEach((_,i)=>{
        const t=pointTiming(r,kind,i);
        if(t.peak[0]<225||t.peak[1]>349||t.peak[0]>=t.peak[1]||!t.timing.sourceUrl.startsWith("https://"))
          throw Error("Timing profile outside plausible season "+r.id);
      });
  }
}
module.exports={siteProfiles,pointTiming,validateCatalog};
