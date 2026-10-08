/* Representative access/viewing-area anchors for existing catalog scenic drives.
   Each index aligns 1:1 with regions[].drives; these are POINTS, NOT road polylines,
   parking directions, forestwide observations, or surveyed road positions.
   Published-coordinate examples: NPS Acadia GPS
   https://www.nps.gov/acad/planyourvisit/directions.htm ;
   NPS Shenandoah district gateways / Skyline mileposts;
   TPWD Lost Maples https://tpwd.texas.gov/state-parks/lost-maples/map ;
   Wisconsin DNR Peninsula State Park https://dnr.wisconsin.gov/events/location/peninsula ;
   Kancamagus endpoints https://kancamagushighway.com/kancamagus-highway-directions-gps-location/ ;
   some other pins use approximate city/pass gateway positions.
   For navigation use official park/byway road maps; never route to a map pin. */
"use strict";
const corridorAnchors=Object.freeze({
 "new-england":[
   [44.05136,-71.65781,"Lincoln / Kancamagus west approach"],
   [44.550,-72.795,"Smugglers’ Notch / VT-108 vicinity"],
   [44.38126,-68.23005,"Acadia Park Loop Road entrance"],
   [44.216,-71.412,"Crawford Notch / US-302 vicinity"]
 ],
 "great-smoky-mountains":[
   [35.61121,-83.42488,"Newfound Gap Road high ridge"],
   [35.58498,-83.84309,"Cades Cove Visitor Center vicinity"],
   [35.628,-83.941,"Foothills Parkway / Look Rock vicinity"],
   [35.508,-83.301,"Cherokee / Blue Ridge Parkway gateway"]
 ],
 "colorado-aspens":[
   [39.07082,-106.98904,"Maroon Bells scenic area"],
   [38.84987,-107.10035,"Kebler Pass vicinity"],
   [39.961,-105.511,"Nederland / Peak to Peak byway"],
   [39.1081,-106.5644,"Independence Pass vicinity"]
 ],
 "adirondacks":[
   [44.40190,-73.87482,"Whiteface highway approach"],
   [44.360,-73.845,"Wilmington Notch / NY-86 vicinity"],
   [44.222,-74.463,"Tupper Lake / NY-30 gateway"]
 ],
 "north-shore-superior":[
   [47.20002,-91.36915,"Split Rock Lighthouse / MN-61"],
   [48.05600,-90.52427,"Gunflint Trail inland corridor"],
   [47.474,-87.948,"Brockway Mountain / Copper Harbor vicinity"]
 ],
 "ozarks":[
   [36.007,-93.187,"Jasper / Scenic Byway 7"],
   [35.726,-93.783,"Pig Trail / Ozark highlands vicinity"],
   [36.696,-92.558,"Glade Top Trail / Mark Twain Forest vicinity"]
 ],
 "eastern-sierra":[
   [37.170,-118.565,"South Lake / Bishop Creek Canyon vicinity"],
   [37.77984,-119.07541,"June Lake Loop village"],
   [37.45260,-118.73720,"Rock Creek Lake"]
 ],
 "wasatch":[
   [40.381,-111.605,"Alpine Loop / Sundance vicinity"],
   [40.60674,-111.55493,"Guardsman Pass"],
   [40.700,-110.890,"Mirror Lake Highway / high lakes vicinity"]
 ],
 "columbia-river-gorge":[
   [45.577,-122.115,"Multnomah Falls / Historic Highway"],
   [45.714,-121.467,"Bingen / WA-14 riverside gateway"],
   [45.664,-121.546,"Hood River / Fruit Loop gateway"]
 ],
 "door-county":[
   [45.127,-87.246,"Fish Creek / WI-42"],
   [45.14997,-87.21762,"Peninsula State Park"],
   [45.173,-87.095,"Jacksonport / WI-57 shore"]
 ],
 "poconos":[
   [41.09343,-75.00184,"Bushkill / US-209"],
   [41.475,-75.177,"Lake Wallenpaupack / Hawley"],
   [40.983,-75.141,"Delaware Water Gap / PA-611"]
 ],
 "texas-hill-country":[
   [29.72536,-99.76310,"Leakey / FM-337"],
   [29.80772,-99.57070,"Lost Maples entrance / FM-187"],
   [29.775,-99.682,"Real County / FM-336 loop vicinity"]
 ],
 "west-virginia-highlands":[
   [38.353,-80.122,"Highland Scenic Highway / WV-150"],
   [39.126,-79.467,"Davis / Corridor H gateway"],
   [39.020,-79.469,"Canaan Valley / WV-32"]
 ],
 "catskills":[
   [42.083,-74.316,"Phoenicia / NY-28"],
   [42.19332,-74.06345,"Kaaterskill Clove / NY-23A vicinity"],
   [42.305,-74.252,"Windham / NY-23"]
 ],
 "shenandoah":[
   [38.90573,-78.19862,"Front Royal / Skyline north entrance"],
   [38.66096,-78.32076,"Thornton Gap / central district"],
   [38.35774,-78.54559,"Swift Run Gap / southern district"],
   [38.03378,-78.85902,"Rockfish Gap / Blue Ridge Parkway"]
 ]
});
module.exports={corridorAnchors};
