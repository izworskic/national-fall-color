/* Editorial viewing-area locations selected for meaningful foliage trip planning.
   APPROXIMATE area/village/viewpoint map markers, not surveyed parking positions,
   routes, road-open claims, or site-level current color observations. The URL
   is an independent official agency/state travel reference, not a route URL.
   Keep regionwide timing separate from observed site data. */
"use strict";
const viewingSpots=Object.freeze({
 "new-england":[
  ["Franconia Notch",44.160,-71.690,"NH","White Mountain cliffs and forested Notch slopes","https://www.visitnh.gov/plan-your-trip/fall/foliage-tracker"],
  ["North Conway",44.054,-71.128,"NH","White Mountains gateway and valley color","https://www.visitnh.gov/plan-your-trip/fall/foliage-report"],
  ["Pinkham Notch",44.257,-71.252,"NH","Mount Washington area: higher-elevation foliage perspective","https://www.visitnh.gov/plan-your-trip/fall/foliage-tracker"],
  ["Dixville Notch",44.868,-71.313,"NH","Northern mountains and earlier typical season","https://www.visitnh.gov/plan-your-trip/fall/foliage-tracker"],
  ["Meredith / Lake Winnipesaukee",43.657,-71.501,"NH","Lakes Region foliage and waterfront setting","https://www.visitnh.gov/plan-your-trip/fall/foliage-tracker"],
  ["Stowe Village",44.465,-72.685,"VT","Classic Green Mountains fall-color base","https://www.visit-vermont.com/state/foliage/"],
  ["Woodstock Village",43.624,-72.518,"VT","Historic village and lower Upper Valley color","https://www.visit-vermont.com/state/foliage/"],
  ["Lake Willoughby",44.737,-72.050,"VT","Northeast Kingdom lake beneath steep wooded cliffs","https://www.visit-vermont.com/state/foliage/"],
  ["Waitsfield / Mad River Valley",44.189,-72.825,"VT","Route 100 valley and Green Mountain ridges","https://www.visit-vermont.com/state/foliage/"],
  ["Quechee Gorge",43.638,-72.402,"VT","Ottauquechee River gorge and covered-bridge country","https://www.visit-vermont.com/state/foliage/"],
  ["Manchester",43.165,-73.070,"VT","Southern Vermont foliage that can run later than mountain ridges","https://www.visit-vermont.com/state/foliage/"],
  ["Height of Land / Rangeley",44.934,-70.732,"ME","Rangeley Lakes and mountain panorama","https://visitmaine.com/articles/fall-foliage-road-trips/"],
  ["Camden Hills",44.219,-69.068,"ME","Mount Battie and Penobscot Bay fall-color views","https://www.maine.gov/dacf/mfs/projects/fall_foliage/whenandwhere/"],
  ["Bethel / Western Mountains",44.405,-70.789,"ME","Western Maine mountain and river-valley foliage","https://visitmaine.com/articles/fall-foliage-road-trips/"],
  ["Baxter / Katahdin Gateway",45.655,-68.708,"ME","Millinocket-side gateway to northern highland forest color","https://www.maine.gov/dacf/mfs/projects/fall_foliage/whenandwhere/"],
  ["Greenville / Moosehead Lake",45.459,-69.590,"ME","Lake and inland forest landscape","https://www.maine.gov/dacf/mfs/projects/fall_foliage/whenandwhere/"]
 ],
 "colorado-aspens":[
  ["Trail Ridge Road / Grand Lake",40.252,-105.824,"CO","Rocky Mountain National Park high-country approach","https://www.colorado.com/articles/10-places-see-colorados-fall-color"],
  ["Guanella Pass",39.600,-105.710,"CO","High-elevation aspen byway with seasonal road restrictions","https://www.colorado.com/byways/guanella-pass"],
  ["Dallas Divide",38.100,-107.891,"CO","San Juan aspen valley and Mount Sneffels views","https://www.colorado.com/articles/10-places-see-colorados-fall-color"],
  ["Telluride",37.938,-107.812,"CO","Town, gondola and mountain slopes with fall aspens","https://www.telluride.com/discover/blog/fall-foliage-update/"]
 ],
 "great-smoky-mountains":[
  ["Kuwohi / Clingmans Dome",35.562,-83.498,"TN","High-elevation observation area; park access rules apply","https://www.nps.gov/grsm/planyourvisit/fallcolor.htm"],
  ["Roaring Fork Motor Nature Trail",35.683,-83.478,"TN","Gatlinburg-side wooded mountain road; seasonal access","https://www.nps.gov/grsm/planyourvisit/fallcolor.htm"],
  ["Oconaluftee",35.515,-83.300,"NC","Cherokee-side valley color and visitor area","https://www.nps.gov/grsm/planyourvisit/fallcolor.htm"]
 ],
 "adirondacks":[
  ["Lake Placid",44.279,-73.981,"NY","Lake, mountain and High Peaks fall scenery","https://www.iloveny.com/things-to-do/nature/fall-foliage/"],
  ["Saranac Lake",44.328,-74.131,"NY","Village lakes and woodland foliage","https://www.iloveny.com/things-to-do/nature/fall-foliage/"],
  ["Old Forge",43.712,-74.975,"NY","Western Adirondack lake and forest scenery","https://www.iloveny.com/things-to-do/nature/fall-foliage/"]
 ],
 "north-shore-superior":[
  ["Gooseberry Falls",47.145,-91.474,"MN","Waterfalls and mixed hardwood forest","https://www.dnr.state.mn.us/fall_colors/index.html"],
  ["Tettegouche State Park",47.337,-91.203,"MN","Lake Superior cliffs and inland color","https://www.dnr.state.mn.us/fall_colors/index.html"],
  ["Porcupine Mountains",46.823,-89.674,"MI","Western Upper Peninsula forest and mountain overlooks","https://www.michigan.gov/dnr/places/state-parks/porcupine-mountains"]
 ],
 "ozarks":[
  ["Buffalo National River / Jasper",36.008,-93.187,"AR","Bluff-lined river and oak-forest hillsides","https://www.nps.gov/buff/index.htm"],
  ["Mount Magazine State Park",35.168,-93.648,"AR","Highland panoramas in Arkansas","https://www.arkansasstateparks.com/parks/mount-magazine-state-park"]
 ],
 "eastern-sierra":[
  ["Convict Lake",37.594,-118.850,"CA","Alpine lake framed by aspen groves","https://www.visitcalifornia.com/experience/eastern-sierra/"],
  ["Lundy Canyon",38.016,-119.205,"CA","Eastern Sierra canyon color; check road conditions","https://www.visitcalifornia.com/experience/eastern-sierra/"],
  ["McGee Creek",37.567,-118.806,"CA","Aspen and willow stands along an eastern Sierra drainage","https://www.visitcalifornia.com/experience/eastern-sierra/"]
 ],
 "wasatch":[
  ["Big Cottonwood Canyon",40.634,-111.653,"UT","Mixed mountain-maple and aspen corridor","https://www.visitutah.com/things-to-do/road-trips/fall-color"],
  ["Logan Canyon",41.741,-111.737,"UT","Northern Wasatch foliage and mountain byway","https://www.visitutah.com/things-to-do/road-trips/fall-color"]
 ],
 "columbia-river-gorge":[
  ["Crown Point / Vista House",45.540,-122.244,"OR","Classic gorge viewpoint overlooking the Columbia","https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=108"],
  ["Rowena Crest",45.682,-121.297,"OR","Eastern gorge switchbacks and oakland slopes","https://traveloregon.com/things-to-do/destinations/parks-forests-wildlife-areas/"]
 ],
 "door-county":[
  ["Cave Point County Park",45.166,-87.034,"WI","Limestone bluffs and Lake Michigan shoreline","https://www.doorcounty.com/experience/fall"],
  ["Newport State Park",45.244,-86.993,"WI","Northern peninsula forest and quieter shore","https://dnr.wisconsin.gov/topic/parks/newport"]
 ],
 "poconos":[
  ["Bushkill Falls",41.119,-74.999,"PA","Forested waterfall area; ticketed private attraction","https://www.poconomountains.com/things-to-do/parks-natural-areas/waterfalls/"],
  ["Hickory Run State Park",41.026,-75.695,"PA","Hardwood forest and Boulder Field region","https://www.dcnr.pa.gov/StateParks/FindAPark/HickoryRunStatePark/Pages/default.aspx"],
  ["Lehigh Gorge / Jim Thorpe",40.876,-75.733,"PA","Rail-trail gorge foliage and river setting","https://www.dcnr.pa.gov/StateParks/FindAPark/LehighGorgeStatePark/Pages/default.aspx"]
 ],
 "texas-hill-country":[
  ["Garner State Park / Concan",29.590,-99.736,"TX","Frio River cypress and canyon scenery","https://tpwd.texas.gov/state-parks/garner"],
  ["South Llano River State Park",30.447,-99.797,"TX","Riparian color near Junction; later-season possibility","https://tpwd.texas.gov/state-parks/south-llano-river"]
 ],
 "west-virginia-highlands":[
  ["Blackwater Falls",39.108,-79.496,"WV","Waterfall surrounded by colorful highland forest","https://wvstateparks.com/park/blackwater-falls-state-park/"],
  ["Dolly Sods Wilderness",39.034,-79.359,"WV","Open plateau and red-leaved heath vegetation","https://www.fs.usda.gov/recarea/mnf/recarea/?recid=12366"],
  ["Seneca Rocks",38.835,-79.373,"WV","Monongahela mountains and dramatic rock formation","https://www.fs.usda.gov/recarea/mnf/recarea/?recid=7051"]
 ],
 "catskills":[
  ["Hunter Mountain",42.204,-74.225,"NY","High-elevation resort and surrounding maple slopes","https://www.iloveny.com/things-to-do/nature/fall-foliage/"],
  ["Ashokan Reservoir",42.071,-74.173,"NY","Catskill ridge reflections and reservoir views","https://www.iloveny.com/things-to-do/nature/fall-foliage/"]
 ],
 "shenandoah":[
  ["Big Meadows",38.521,-78.436,"VA","High-ridge meadow and surrounding forest","https://www.nps.gov/shen/planyourvisit/fall.htm"],
  ["Skyland / Stony Man",38.594,-78.385,"VA","Skyline Drive high-ridge overlooks and trail access","https://www.nps.gov/shen/planyourvisit/fall.htm"],
  ["Hawksbill Mountain vicinity",38.553,-78.400,"VA","Highest summit area; hiking required","https://www.nps.gov/shen/planyourvisit/fall.htm"]
 ]
});
module.exports={viewingSpots};
