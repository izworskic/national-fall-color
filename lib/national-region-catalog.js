// National fall-color regional catalog. Dates are broad editorial planning windows,
// NOT measured foliage or a 2027 forecast. Local NWS weather/observations are separate.
const regions = [
  {id:"new-england",name:"New England Fall Color",states:["NH","VT","ME"],lat:44.35,lon:-71.31,tz:"America/New_York",peak:[269,292],type:"mixed-hardwoods",why:"The mountains turn before lake-level valleys and the Maine coast. Compare elevations before choosing a weekend.",drives:[
    ["Kancamagus Highway","Lincoln to Conway, NH","White Mountain elevations and overlooks"],
    ["Smugglers’ Notch / VT-108","Stowe to Jeffersonville, VT","Steep mountain corridor; verify seasonal road access"],
    ["Park Loop Road","Acadia National Park, ME","Coastal color; park entry and road conditions apply"],
    ["NH-302 Crawford Notch","Bartlett to Twin Mountain, NH","Valley and notch scenery"]
  ]},
  {id:"great-smoky-mountains",name:"Great Smoky Mountains Fall Color",states:["TN","NC"],lat:35.60,lon:-83.50,tz:"America/New_York",peak:[278,309],type:"elevation-hardwoods",why:"High ridge forests change before lower Gatlinburg and Cades Cove. A single park-wide peak date is misleading.",drives:[
    ["Newfound Gap Road / US-441","Gatlinburg to Cherokee","High-to-low elevation comparison"],
    ["Cades Cove Loop Road","Cades Cove, TN","Low-elevation color and wildlife; traffic can be slow"],
    ["Foothills Parkway","Townsend / Wears Valley area","Long ridge views"],
    ["Blue Ridge Parkway southern section","Cherokee area, NC","Verify closures and road access"]
  ]},
  {id:"colorado-aspens",name:"Colorado Aspen Color",states:["CO"],lat:39.11,lon:-106.90,tz:"America/Denver",peak:[257,280],type:"aspen",why:"Aspens react to elevation, frost, and wind; high-elevation road access can change rapidly.",drives:[
    ["Maroon Creek Road","Aspen to Maroon Bells","Reservations/shuttles may be required"],
    ["Kebler Pass","Crested Butte to Paonia area","Unpaved pass conditions matter"],
    ["Peak to Peak Scenic Byway","Estes Park to Black Hawk","Front Range elevations"],
    ["Independence Pass","Aspen to Twin Lakes","Seasonal and weather-related closures possible"]
  ]},
  {id:"adirondacks",name:"Adirondacks Fall Color",states:["NY"],lat:44.28,lon:-73.98,tz:"America/New_York",peak:[261,286],type:"mixed-hardwoods",why:"Summits and interior lakes can change earlier than sheltered valleys. Compare Whiteface with Lake Placid.",drives:[
    ["Whiteface Veterans’ Memorial Highway","Wilmington, NY","Seasonal access and summit weather"],
    ["NY-86 through Wilmington Notch","Lake Placid to Wilmington","Mountain slopes and water"],
    ["NY-30 Adirondack Scenic Highway","Tupper Lake to Long Lake","Lakes and forest canopy"]
  ]},
  {id:"north-shore-superior",name:"Minnesota North Shore & Western U.P. Color",states:["MN","MI"],lat:47.15,lon:-91.16,tz:"America/Chicago",peak:[260,284],type:"lake-mixed-hardwoods",why:"Superior moderates shoreline trees while inland ridges and western U.P. maples turn earlier.",drives:[
    ["North Shore Scenic Drive / MN-61","Duluth to Grand Marais","Split Rock lighthouse and inland detours"],
    ["Gunflint Trail","Grand Marais inland","Interior ridges usually differ from lakeshore"],
    ["US-41 / Brockway Mountain Drive","Copper Harbor, MI","Existing Michigan U.P. coverage"]
  ]},
  {id:"ozarks",name:"Ozarks Fall Color",states:["AR","MO"],lat:35.91,lon:-93.15,tz:"America/Chicago",peak:[292,314],type:"oak-hardwoods",why:"Oak-heavy hillsides often reach color later than northern hardwood destinations.",drives:[
    ["Arkansas Scenic Byway 7","Jasper to Russellville corridor","Ozark highland overlooks"],
    ["Pig Trail Scenic Byway / AR-23","Ozark to Eureka Springs area","Winding forest corridor"],
    ["Glade Top Trail","Mark Twain National Forest, MO","Unpaved sections; verify access"]
  ]},
  {id:"eastern-sierra",name:"Eastern Sierra Aspen Color",states:["CA"],lat:37.24,lon:-118.57,tz:"America/Los_Angeles",peak:[263,286],type:"aspen",why:"High aspen basins may peak well before Owens Valley; fall storms affect passes.",drives:[
    ["Bishop Creek Canyon","Bishop to South Lake / Lake Sabrina","Multiple elevation bands"],
    ["June Lake Loop / CA-158","June Lake","Aspens around the lakes"],
    ["Rock Creek Road","Tom’s Place toward Rock Creek Lake","High-altitude access and early snow"]
  ]},
  {id:"wasatch",name:"Wasatch Fall Color",states:["UT"],lat:40.56,lon:-111.67,tz:"America/Denver",peak:[262,285],type:"aspen-maple",why:"Wasatch slopes mix aspens with red mountain maple and vary sharply with elevation.",drives:[
    ["Alpine Loop Scenic Byway","American Fork to Provo Canyon","Seasonal closures possible"],
    ["Guardsman Pass","Park City to Big Cottonwood Canyon","Steep weather-sensitive pass"],
    ["Mirror Lake Highway / UT-150","Kamas toward Mirror Lake","Higher elevation color and weather"]
  ]},
  {id:"columbia-river-gorge",name:"Columbia River Gorge Fall Color",states:["OR","WA"],lat:45.69,lon:-121.73,tz:"America/Los_Angeles",peak:[282,309],type:"mixed-hardwoods",why:"Oregon and Washington slopes, river elevation and microclimates develop color unevenly.",drives:[
    ["Historic Columbia River Highway","Troutdale to Multnomah Falls area","Verify timed-use/parking rules"],
    ["WA-14 Columbia River Scenic Byway","Vancouver to Hood River area","Washington-bank viewpoints"],
    ["Hood River Fruit Loop","Hood River Valley","Orchards and foothills"]
  ]},
  {id:"door-county",name:"Door County Fall Color",states:["WI"],lat:45.17,lon:-87.16,tz:"America/Chicago",peak:[277,299],type:"lake-hardwoods",why:"Lake Michigan moderates some shoreline stands; inland maples and park corridors can differ.",drives:[
    ["WI-42 north peninsula","Fish Creek to Northport","Peninsula coastal villages"],
    ["Peninsula State Park Scenic Drive","Fish Creek","Park admission and road notices"],
    ["WI-57 eastern shore","Jacksonport to Sister Bay","Quieter eastern shoreline"]
  ]},
  {id:"poconos",name:"Poconos Fall Color",states:["PA","NJ"],lat:41.04,lon:-75.09,tz:"America/New_York",peak:[278,302],type:"mixed-hardwoods",why:"Ridge-top stands, Delaware valley sites and lakes can reach their color windows at different times.",drives:[
    ["Delaware Water Gap / US-209","Bushkill to Milford","Water gap and river valley"],
    ["PA-402 / Lake Wallenpaupack corridor","Pike County","Lakes and hardwood slopes"],
    ["PA-611 Delaware River corridor","Delaware Water Gap","River overlooks and trailheads"]
  ]},
  {id:"texas-hill-country",name:"Texas Hill Country Fall Color",states:["TX"],lat:29.83,lon:-99.57,tz:"America/Chicago",peak:[304,331],type:"maple-riparian",why:"Lost Maples offers localized canyon color, not uniform Hill Country foliage. Fall timing is unusually variable.",drives:[
    ["FM-337","Medina to Leakey","Hill Country canyon roads"],
    ["FM-187 / Lost Maples approach","Vanderpool","Park entry and capacity matter"],
    ["FM-336 / FM-335 loop","Leakey area","Scenic terrain; limited services"]
  ]},
  {id:"west-virginia-highlands",name:"West Virginia Highlands Fall Color",states:["WV"],lat:39.04,lon:-79.40,tz:"America/New_York",peak:[271,295],type:"highland-hardwoods",why:"Dolly Sods and Canaan Valley elevations turn earlier than sheltered lower slopes.",drives:[
    ["Highland Scenic Highway / WV-150","Monongahela National Forest","High elevation scenic highway"],
    ["US-48 / Corridor H overlooks","Davis to Thomas area","Highlands views"],
    ["WV-32","Canaan Valley to Davis","Valley and ridgeline color"]
  ]},
  {id:"catskills",name:"Catskills Fall Color",states:["NY"],lat:42.19,lon:-74.21,tz:"America/New_York",peak:[273,297],type:"mixed-hardwoods",why:"Hunter and Windham ridges often shift earlier than Hudson Valley lowlands.",drives:[
    ["Catskill Mountains Scenic Byway / NY-28","Phoenicia to Margaretville","Mountain valleys"],
    ["NY-23A / Kaaterskill Clove","Tannersville to Palenville","Steep gorge and viewpoints"],
    ["NY-23 Windham corridor","Prattsville to Windham","Northern Catskill slopes"]
  ]},
  {id:"shenandoah",name:"Shenandoah Skyline Drive Fall Color",states:["VA"],lat:38.53,lon:-78.45,tz:"America/New_York",peak:[281,304],type:"elevation-hardwoods",why:"Skyline Drive runs along high ridges; east and west valley trees may peak days later.",drives:[
    ["Skyline Drive North District","Front Royal to Thornton Gap","High ridge overlooks"],
    ["Skyline Drive Central District","Thornton Gap to Swift Run Gap","Big Meadows and mountain views"],
    ["Skyline Drive South District","Swift Run Gap to Rockfish Gap","South ridge and Blue Ridge tie-in"],
    ["Blue Ridge Parkway northern section","Waynesboro south","Continue the elevation comparison"]
  ]}
];
const byId=Object.fromEntries(regions.map(x=>[x.id,x]));
module.exports={regions,byId};
