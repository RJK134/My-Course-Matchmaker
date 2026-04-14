import { useState, useCallback } from "react";

// ─── NATIONALITY → HOME COUNTRY MAPPING ──────────────────────────────────────
const NAT_MAP = {
  "british":"UK","english":"UK","scottish":"Scotland","welsh":"UK","northern irish":"UK",
  "irish":"Ireland","republic of ireland":"Ireland",
  "american":"USA","us citizen":"USA","united states":"USA",
  "canadian":"Canada","australian":"Australia","new zealander":"New Zealand",
  "french":"France","german":"Germany","dutch":"Netherlands","belgian":"Belgium",
  "italian":"Italy","spanish":"Spain","portuguese":"Portugal","greek":"Greece",
  "austrian":"Austria","swiss":"Switzerland","swedish":"Sweden","danish":"Denmark",
  "finnish":"Finland","norwegian":"Norway","icelandic":"Iceland",
  "polish":"Poland","czech":"Czech Republic","hungarian":"Hungary","romanian":"Romania",
  "bulgarian":"Bulgaria","croatian":"Croatia","slovenian":"Slovenia","slovak":"Slovakia",
  "lithuanian":"Lithuania","latvian":"Latvia","estonian":"Estonia","luxembourgish":"Luxembourg",
  "maltese":"Malta","cypriot":"Cyprus",
  "chinese":"China","indian":"India","japanese":"Japan","south korean":"South Korea",
  "brazilian":"Brazil","mexican":"Mexico","nigerian":"Nigeria","south african":"South Africa",
  "kenyan":"Kenya","ghanaian":"Ghana","pakistani":"Pakistan","bangladeshi":"Bangladesh",
  "thai":"Thailand","vietnamese":"Vietnam","filipino":"Philippines","indonesian":"Indonesia",
  "malaysian":"Malaysia","singaporean":"Singapore","turkish":"Turkey","egyptian":"Egypt",
  "saudi":"Saudi Arabia","emirati":"UAE","qatari":"Qatar","kuwaiti":"Kuwait",
  "russian":"Russia","ukrainian":"Ukraine","colombian":"Colombia","chilean":"Chile",
  "argentinian":"Argentina","peruvian":"Peru","taiwanese":"Taiwan",
  "uk":"UK","england":"UK","scotland":"Scotland","wales":"UK","northern ireland":"UK",
  "ireland":"Ireland","usa":"USA","united states":"USA","us":"USA",
  "canada":"Canada","australia":"Australia","new zealand":"New Zealand",
  "france":"France","germany":"Germany","netherlands":"Netherlands","belgium":"Belgium",
  "italy":"Italy","spain":"Spain","portugal":"Portugal","greece":"Greece",
  "austria":"Austria","switzerland":"Switzerland","sweden":"Sweden","denmark":"Denmark",
  "finland":"Finland","norway":"Norway","iceland":"Iceland",
  "poland":"Poland","czech republic":"Czech Republic","hungary":"Hungary","romania":"Romania",
  "bulgaria":"Bulgaria","croatia":"Croatia","slovenia":"Slovenia","slovakia":"Slovakia",
  "lithuania":"Lithuania","latvia":"Latvia","estonia":"Estonia","luxembourg":"Luxembourg",
  "malta":"Malta","cyprus":"Cyprus","china":"China","india":"India","japan":"Japan",
  "south korea":"South Korea","brazil":"Brazil","mexico":"Mexico","nigeria":"Nigeria",
  "south africa":"South Africa","hong kong":"Hong Kong","singapore":"Singapore",
  "malaysia":"Malaysia","turkey":"Turkey",
};
const NATIONALITIES = [...new Set(Object.keys(NAT_MAP).map(k => k.charAt(0).toUpperCase() + k.slice(1)))];
const EU_EEA = new Set(["France","Germany","Netherlands","Belgium","Italy","Spain","Portugal","Greece","Austria","Sweden","Denmark","Finland","Norway","Iceland","Poland","Czech Republic","Hungary","Romania","Bulgaria","Croatia","Slovenia","Slovakia","Lithuania","Latvia","Estonia","Luxembourg","Malta","Cyprus","Ireland"]);

function resolveNat(raw) { if(!raw) return null; return NAT_MAP[raw.trim().toLowerCase()]||raw.trim(); }

function detFeeStatus(nat,res,courseCo,ukNation) {
  if(courseCo==="Online") return "home";
  const nc=resolveNat(nat), rc=resolveNat(res);
  if(!nc) return "international";
  if(courseCo==="Scotland") {
    const h=new Set(["UK","England","Scotland","Wales","Northern Ireland","Ireland"]);
    if(!h.has(nc)) return "international";
    // Scottish-domiciled = SAAS free (fH), rest-of-UK = fS (£9,250)
    if(ukNation==="Scotland") return "home"; // gets fH (SAAS rate / free)
    return "ruk"; // rest-of-UK: England/Wales/NI pay £9,250
  }
  if(courseCo==="UK") { const h=new Set(["UK","England","Scotland","Wales","Northern Ireland","Ireland"]); return h.has(nc)?"home":"international"; }
  if(EU_EEA.has(courseCo)) return (EU_EEA.has(nc)||nc===courseCo)?"home":"international";
  if(courseCo==="USA") return (nc==="USA"||(rc==="USA"))?"home":"international";
  if(courseCo==="Canada") return (nc==="Canada"||rc==="Canada")?"home":"international";
  if(courseCo==="Australia") return (nc==="Australia"||rc==="Australia")?"home":"international";
  if(courseCo==="Switzerland") return nc==="Switzerland"?"home":"international";
  return nc===courseCo?"home":"international";
}
function getFee(c,fs) { if(fs==="ruk") return c.fS||9250; return fs==="home"?c.feeHome:c.feeIntl; }

function getFund(co,fs,nat) {
  const nc=resolveNat(nat); const s=[];
  if(co==="UK"||co==="Scotland") {
    if(fs==="home") { s.push({t:"Student Finance England — loans up to £9,250/yr tuition + maintenance",u:"https://www.gov.uk/student-finance"}); s.push({t:"SAAS (Scotland) — Scottish-domiciled: NO tuition fees",u:"https://www.saas.gov.uk/"}); s.push({t:"Student Finance Wales",u:"https://www.studentfinancewales.co.uk/"}); s.push({t:"UCAS — scholarships, grants & bursaries",u:"https://www.ucas.com/student-finance-england/scholarships-grants-and-bursaries"}); s.push({t:"Save the Student — grants guide",u:"https://www.savethestudent.org/student-finance/grants-bursaries.html"}); s.push({t:"Disabled Students' Allowance",u:"https://www.gov.uk/disabled-students-allowance-dsa"});
    } else { s.push({t:"Chevening Scholarships (fully funded)",u:"https://www.chevening.org/"}); s.push({t:"Commonwealth Scholarships",u:"https://cscuk.fcdo.gov.uk/scholarships/"}); s.push({t:"GREAT Scholarships",u:"https://study-uk.britishcouncil.org/scholarships/great-scholarships"}); s.push({t:"British Council — study in UK",u:"https://study-uk.britishcouncil.org/scholarships"}); }
  } else if(co==="USA") {
    if(fs==="home") { s.push({t:"Federal Student Aid (FAFSA)",u:"https://studentaid.gov/"}); s.push({t:"Federal Pell Grants",u:"https://studentaid.gov/understand-aid/types/grants/pell"}); }
    else { s.push({t:"Fulbright Program",u:"https://fulbrightprogram.org/"}); s.push({t:"Scholarships.com",u:"https://www.scholarships.com/"}); s.push({t:"Funding for US Study",u:"https://www.fundingusstudy.org/"}); }
  } else if(co==="Canada") {
    s.push({t:"Canada Student Grants & Loans",u:"https://www.canada.ca/en/services/benefits/education/student-aid.html"}); if(fs!=="home") s.push({t:"EduCanada scholarships",u:"https://www.educanada.ca/scholarships-bourses/index.aspx"});
  } else if(co==="Australia") {
    if(fs==="home") s.push({t:"HECS-HELP loan",u:"https://www.studyassist.gov.au/help-loans/hecs-help"}); else s.push({t:"Australia Awards",u:"https://www.dfat.gov.au/people-to-people/australia-awards"}); s.push({t:"Study Australia scholarships",u:"https://www.studyaustralia.gov.au/en/plan-your-studies/scholarships"});
  } else if(co==="Germany") {
    s.push({t:"DAAD Scholarships",u:"https://www.daad.de/en/study-and-research-in-germany/scholarships/"}); s.push({t:"No tuition fees at public universities",u:"https://www.study-in-germany.de/en/plan-your-studies/costs-funding/"}); s.push({t:"Deutschlandstipendium",u:"https://www.deutschlandstipendium.de/en/"});
  } else if(co==="France") {
    s.push({t:"Campus France scholarships",u:"https://www.campusfrance.org/en/scholarships"}); s.push({t:"Eiffel Excellence Scholarship",u:"https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence"});
  } else if(co==="Netherlands") {
    s.push({t:"Holland Scholarship",u:"https://www.studyinholland.nl/finances/scholarships/find-a-scholarship/holland-scholarship"}); s.push({t:"DUO student finance (EU/EEA)",u:"https://duo.nl/particulier/student-finance/"});
  } else if(co==="Denmark"||co==="Sweden"||co==="Finland"||co==="Norway") {
    s.push({t:"Free tuition for EU/EEA/Swiss students",u:"https://www.study.eu/article/study-in-europe-for-free-or-low-tuition-fees"}); if(co==="Sweden") s.push({t:"Swedish Institute Scholarships",u:"https://si.se/en/apply/scholarships/"}); if(co==="Norway") s.push({t:"Lånekassen",u:"https://lanekassen.no/en-US/"});
  } else if(co==="Switzerland") {
    s.push({t:"Swiss Government Excellence Scholarships",u:"https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants.html"}); s.push({t:"ETH/EPFL — same low fees for all",u:"https://ethz.ch/en/studies/financial/tuition-fees.html"});
  } else if(co==="Italy") {
    s.push({t:"Study in Italy scholarships",u:"https://www.studiare-in-italia.it/studentistranieri/"});
  }
  if(co==="Online") { s.push({t:"Coursera Financial Aid",u:"https://www.coursera.org/financial-aid"}); s.push({t:"edX Financial Assistance",u:"https://support.edx.org/hc/en-us/articles/215167857"}); s.push({t:"FutureLearn free courses",u:"https://www.futurelearn.com/courses?filter_category=free"}); }
  s.push({t:"QS Scholarships — global search",u:"https://www.topuniversities.com/scholarships"});
  s.push({t:"The Scholarship Hub",u:"https://www.thescholarshiphub.org.uk/"});
  if(nc==="UK"&&co!=="UK"&&co!=="Scotland") { s.push({t:"Turing Scheme — UK govt study abroad funding",u:"https://www.gov.uk/guidance/turing-scheme-apply-for-funding-for-international-placements"}); }
  return s;
}

const DOMAIN_FAMILIES = {
  performing_arts:["acting","drama","theatre","dance","musical theatre","performing arts","performance","stage","choreography","devised theatre","physical theatre","voice","circus","opera"],
  music:["music","composition","songwriting","music production","audio","conducting","music performance","music technology","sound design","recording","jazz","classical music"],
  visual_arts:["fine art","painting","sculpture","printmaking","photography","illustration","visual arts","ceramics","textiles","art","contemporary art"],
  design:["graphic design","fashion design","interior design","product design","UX design","UI","industrial design","animation","motion graphics","design thinking","game design"],
  film_media:["film","filmmaking","film production","screenwriting","cinematography","directing","media production","broadcasting","television","documentary","media studies"],
  creative_writing:["creative writing","fiction","poetry","playwriting","screenwriting","publishing","literature","literary studies","journalism","editing","english literature"],
  computer_science:["computer science","programming","software engineering","algorithms","AI","machine learning","data science","cybersecurity","web development","computing"],
  engineering:["engineering","mechanical","electrical","civil","chemical","aerospace","robotics","manufacturing","automotive","biomedical engineering"],
  business:["business","management","marketing","finance","economics","accounting","entrepreneurship","strategy","leadership","MBA"],
  sciences:["biology","chemistry","physics","environmental science","neuroscience","biomedical","pharmacology","geology","ecology","mathematics","statistics"],
  medicine_health:["medicine","nursing","healthcare","clinical","patient care","dentistry","pharmacy","public health","physiotherapy","midwifery"],
  law:["law","criminal law","constitutional law","human rights","legal studies","international law","criminology"],
  social_sciences:["psychology","sociology","anthropology","politics","international relations","social work","counselling","political science"],
  humanities:["history","classics","languages","linguistics","theology","archaeology","cultural studies","philosophy","religious studies"],
  architecture:["architecture","urban planning","landscape","built environment","spatial design"],
  education:["education","teaching","pedagogy","PGCE","child development","TESOL","early years"],
  sports:["sport science","sports management","kinesiology","exercise science","coaching"],
  hospitality_tourism:["hospitality","tourism","hotel management","event management","culinary arts"],
  agriculture_environment:["agriculture","forestry","marine biology","conservation","environmental management","geography"],
};
const DL={performing_arts:"Performing Arts",music:"Music",visual_arts:"Visual Arts",design:"Design",film_media:"Film & Media",creative_writing:"Creative Writing",computer_science:"Computer Science",engineering:"Engineering",business:"Business",sciences:"Sciences",medicine_health:"Medicine & Health",law:"Law",social_sciences:"Social Sciences",humanities:"Humanities",architecture:"Architecture",education:"Education",sports:"Sport Science",hospitality_tourism:"Hospitality",agriculture_environment:"Environment"};

// ─── COST OF LIVING DATA BY CITY (monthly estimates in local currency → GBP) ─
const COL = {
  "London":{rent:1400,food:350,transport:160,utils:180,misc:200,currency:"£",note:"Zone 2 avg studio/1-bed. Student Oyster: £86/mo"},
  "Edinburgh":{rent:850,food:280,transport:55,utils:140,misc:150,currency:"£",note:"New Town/Marchmont area. Lothian Buses student pass"},
  "Glasgow":{rent:700,food:260,transport:50,utils:130,misc:140,currency:"£",note:"West End/Southside. SPT Subway + bus. Affordable city"},
  "Oxford":{rent:1100,food:300,transport:40,utils:150,misc:170,currency:"£",note:"College accommodation often available. Cycling city"},
  "Cambridge":{rent:1050,food:300,transport:35,utils:145,misc:165,currency:"£",note:"College accommodation year 1. Cycling essential"},
  "Manchester":{rent:750,food:270,transport:70,utils:130,misc:150,currency:"£",note:"Fallowfield/Withington student areas. Bee Network buses"},
  "Bristol":{rent:850,food:280,transport:60,utils:140,misc:160,currency:"£",note:"Redland/Clifton. FirstBus student passes available"},
  "Leeds":{rent:650,food:260,transport:60,utils:125,misc:140,currency:"£",note:"Hyde Park/Headingley. Very affordable student city"},
  "York":{rent:700,food:270,transport:40,utils:130,misc:140,currency:"£",note:"Compact walkable city. Low transport costs"},
  "Bath":{rent:900,food:290,transport:50,utils:145,misc:160,currency:"£",note:"Historic city. Pricier than average but stunning"},
  "Norwich":{rent:650,food:250,transport:45,utils:120,misc:130,currency:"£",note:"Golden Triangle area. One of UK's most affordable"},
  "Brighton":{rent:900,food:280,transport:55,utils:140,misc:160,currency:"£",note:"Kemptown/Hanover. Vibrant but above-average costs"},
  "Coventry":{rent:600,food:250,transport:55,utils:120,misc:130,currency:"£",note:"Very affordable. Near Warwick campus"},
  "Sheffield":{rent:600,food:250,transport:55,utils:120,misc:130,currency:"£",note:"Broomhill/Crookes. Excellent value student city"},
  "Nottingham":{rent:625,food:255,transport:55,utils:125,misc:135,currency:"£",note:"Lenton/Beeston. Good value"},
  "Guildford":{rent:950,food:290,transport:70,utils:150,misc:160,currency:"£",note:"Surrey commuter town. Higher costs"},
  "Bournemouth":{rent:700,food:260,transport:50,utils:130,misc:140,currency:"£",note:"Coastal town. Moderate costs"},
  "Exeter":{rent:720,food:265,transport:45,utils:130,misc:140,currency:"£",note:"Compact city. Walking distance to campus"},
  "Falmouth":{rent:650,food:255,transport:35,utils:120,misc:130,currency:"£",note:"Small coastal town. Low costs but limited amenities"},
  "Loughborough":{rent:550,food:245,transport:40,utils:115,misc:125,currency:"£",note:"Campus university town. Very affordable"},
  "Durham":{rent:600,food:255,transport:30,utils:120,misc:130,currency:"£",note:"Compact historic city. College accommodation available"},
  "Reading":{rent:800,food:275,transport:60,utils:140,misc:150,currency:"£",note:"Thames Valley. Good London links"},
  "Southampton":{rent:700,food:265,transport:55,utils:130,misc:140,currency:"£",note:"Port city. Moderate costs"},
  "Plymouth":{rent:575,food:245,transport:40,utils:115,misc:125,currency:"£",note:"Coastal. One of UK's most affordable"},
  "Preston":{rent:500,food:240,transport:50,utils:110,misc:120,currency:"£",note:"Very affordable Lancashire city"},
  "Stirling":{rent:600,food:255,transport:45,utils:125,misc:130,currency:"£",note:"Small historic city. Campus university"},
  "St Andrews":{rent:750,food:270,transport:30,utils:135,misc:145,currency:"£",note:"Small town. Limited but charming"},
  // International cities
  "New York":{rent:2200,food:500,transport:130,utils:200,misc:300,currency:"$",note:"Manhattan avg. Brooklyn/Queens cheaper. MTA unlimited $33/week student"},
  "Los Angeles":{rent:1800,food:450,transport:100,utils:180,misc:250,currency:"$",note:"Car often needed. Santa Monica/Westwood areas"},
  "Boston":{rent:1900,food:450,transport:90,utils:180,misc:250,currency:"$",note:"Back Bay/Allston. MBTA student pass"},
  "Pittsburgh":{rent:1000,food:350,transport:70,utils:150,misc:180,currency:"$",note:"Oakland/Squirrel Hill. Very affordable for US"},
  "Providence":{rent:1100,food:380,transport:60,utils:155,misc:180,currency:"$",note:"East Side. Moderate costs for Northeast US"},
  "Baltimore":{rent:1000,food:350,transport:70,utils:145,misc:170,currency:"$",note:"Mount Vernon/Charles Village. Affordable"},
  "Valencia":{rent:900,food:350,transport:50,utils:140,misc:160,currency:"$",note:"CalArts area. Car helpful"},
  "Toronto":{rent:1600,food:400,transport:120,utils:170,misc:220,currency:"CAD",note:"Annex/Kensington. TTC student pass"},
  "Montreal":{rent:900,food:350,transport:55,utils:120,misc:160,currency:"CAD",note:"Plateau/Mile End. Very affordable. STM student pass"},
  "Melbourne":{rent:1400,food:400,transport:80,utils:160,misc:200,currency:"AUD",note:"Carlton/Fitzroy. Myki student fare"},
  "Sydney":{rent:1600,food:420,transport:90,utils:170,misc:220,currency:"AUD",note:"Newtown/Surry Hills. Opal student fare"},
  // Europe
  "Berlin":{rent:700,food:250,transport:29,utils:120,misc:150,currency:"€",note:"Kreuzberg/Neukölln. Semester ticket covers all transport (~€210/6mo)"},
  "Munich":{rent:900,food:280,transport:33,utils:140,misc:170,currency:"€",note:"Schwabing/Maxvorstadt. Semester ticket. Higher than German avg"},
  "Mannheim":{rent:550,food:240,transport:30,utils:110,misc:130,currency:"€",note:"Affordable Rhine-Neckar region. Semester ticket"},
  "Paris":{rent:950,food:300,transport:38,utils:140,misc:180,currency:"€",note:"5th/13th arr. Imagine R student pass €38/mo. CAF housing aid available"},
  "Fontainebleau":{rent:700,food:270,transport:50,utils:120,misc:150,currency:"€",note:"INSEAD campus area. Quieter than Paris"},
  "Amsterdam":{rent:900,food:280,transport:35,utils:130,misc:170,currency:"€",note:"Oost/De Pijp. OV-chipkaart student. DUO housing allowance for EU students"},
  "Delft":{rent:650,food:260,transport:30,utils:120,misc:140,currency:"€",note:"Compact cycling city. Very student-friendly"},
  "Eindhoven":{rent:600,food:250,transport:28,utils:115,misc:135,currency:"€",note:"Tech hub. Affordable. Good cycling infrastructure"},
  "Utrecht":{rent:700,food:265,transport:30,utils:125,misc:145,currency:"€",note:"Beautiful canal city. Student-friendly. Cycling"},
  "Maastricht":{rent:550,food:245,transport:25,utils:110,misc:130,currency:"€",note:"Small, walkable, international. Very affordable"},
  "Gothenburg":{rent:600,food:300,transport:40,utils:100,misc:150,currency:"€",note:"Vasastan/Haga. Västtrafik student card"},
  "Uppsala":{rent:500,food:280,transport:35,utils:90,misc:130,currency:"€",note:"Student nations provide cheap social life. Very affordable"},
  "Helsinki":{rent:700,food:300,transport:35,utils:100,misc:150,currency:"€",note:"Kallio/Töölö. HSL student card. Unicafe student meals ~€2.95"},
  "Copenhagen":{rent:800,food:300,transport:25,utils:110,misc:160,currency:"€",note:"Nørrebro/Vesterbro. Cycling city. SU grant for EU workers"},
  "Zurich":{rent:1200,food:400,transport:45,utils:150,misc:200,currency:"CHF",note:"Kreis 4/5. ZVV student pass. High costs but high quality"},
  "Lausanne":{rent:1000,food:380,transport:40,utils:140,misc:180,currency:"CHF",note:"Flon/Sous-gare. Mobilis student pass. EPFL campus"},
  "Milan":{rent:650,food:280,transport:22,utils:120,misc:150,currency:"€",note:"Città Studi/Navigli. ATM student pass €22/mo. Very affordable for quality"},
};

// ─── INSTITUTION DATA ────────────────────────────────────────────────────────
const INST_DATA = {
  "RADA":{full:"Royal Academy of Dramatic Art",type:"Conservatoire",founded:1904,students:200,url:"https://www.rada.ac.uk",apply:"https://www.rada.ac.uk/courses",contact:"enquiries@rada.ac.uk",lat:51.5246,lng:-0.1340,desc:"World-renowned drama school in Bloomsbury. Intensive, audition-based training. Notable alumni include Anthony Hopkins, Ralph Fiennes, and Phoebe Waller-Bridge."},
  "Royal Central School of Speech and Drama":{full:"Royal Central School of Speech and Drama",type:"Conservatoire",founded:1906,students:700,url:"https://www.cssd.ac.uk",apply:"https://www.cssd.ac.uk/courses",contact:"enquiries@cssd.ac.uk",lat:51.5463,lng:-0.1780,desc:"Part of University of London. Located in Swiss Cottage. Strong industry connections in theatre, film, and TV."},
  "Tisch School of the Arts, NYU":{full:"Tisch School of the Arts, New York University",type:"University School",founded:1965,students:4800,url:"https://tisch.nyu.edu",apply:"https://tisch.nyu.edu/admissions",contact:"tisch.admissions@nyu.edu",lat:40.7291,lng:-73.9965,desc:"One of the premier performing arts schools globally. Located in Greenwich Village, Manhattan. Alumni include Martin Scorsese, Lady Gaga, and Spike Lee."},
  "Royal Conservatoire of Scotland":{full:"Royal Conservatoire of Scotland",type:"Conservatoire",founded:1847,students:1100,url:"https://www.rcs.ac.uk",apply:"https://www.rcs.ac.uk/apply",contact:"admissions@rcs.ac.uk",lat:55.8642,lng:-4.2708,desc:"Scotland's national conservatoire in central Glasgow. Scottish-domiciled students: FREE tuition via SAAS."},
  "Carnegie Mellon University":{full:"Carnegie Mellon University School of Drama",type:"University",founded:1914,students:400,url:"https://www.drama.cmu.edu",apply:"https://admission.enrollment.cmu.edu",contact:"admission@cmu.edu",lat:40.4432,lng:-79.9428,desc:"Top US drama school in Pittsburgh. BFA programme is intensely competitive."},
  "Juilliard School":{full:"The Juilliard School",type:"Conservatoire",founded:1905,students:850,url:"https://www.juilliard.edu",apply:"https://www.juilliard.edu/admissions",contact:"admissions@juilliard.edu",lat:40.7738,lng:-73.9830,desc:"Lincoln Center, Manhattan. Among the world's leading performing arts conservatories."},
  "University of Leeds":{full:"University of Leeds",type:"Russell Group University",founded:1904,students:38000,url:"https://www.leeds.ac.uk",apply:"https://www.leeds.ac.uk/study",contact:"study@leeds.ac.uk",lat:53.8067,lng:-1.5550,desc:"Large Russell Group university in West Yorkshire. Strong arts and humanities faculty."},
  "Birkbeck, University of London":{full:"Birkbeck, University of London",type:"University",founded:1823,students:12000,url:"https://www.bbk.ac.uk",apply:"https://www.bbk.ac.uk/courses",contact:"info@bbk.ac.uk",lat:51.5218,lng:-0.1306,desc:"Specialist in evening/part-time study in Bloomsbury. Ideal for mature students."},
  "University of Exeter":{full:"University of Exeter",type:"Russell Group University",founded:1955,students:25000,url:"https://www.exeter.ac.uk",apply:"https://www.exeter.ac.uk/study",contact:"admissions@exeter.ac.uk",lat:50.7354,lng:-3.5345,desc:"Beautiful campus in Devon. Russell Group. Strong for humanities and sciences."},
  "University of Bristol":{full:"University of Bristol",type:"Russell Group University",founded:1876,students:28000,url:"https://www.bristol.ac.uk",apply:"https://www.bristol.ac.uk/study",contact:"ug-admissions@bristol.ac.uk",lat:51.4584,lng:-2.6030,desc:"Major Russell Group university in vibrant Bristol. Excellent theatre and drama department."},
  "Zürich University of the Arts (ZHdK)":{full:"Zürich University of the Arts",type:"Arts University",founded:2007,students:2700,url:"https://www.zhdk.ch/en",apply:"https://www.zhdk.ch/en/degree-programmes",contact:"info@zhdk.ch",lat:47.3822,lng:8.5355,desc:"Switzerland's largest arts university. Toni-Areal campus. Same low fees for all nationalities."},
  "University of Amsterdam (DAS)":{full:"University of Amsterdam — DAS Theatre",type:"Research University",founded:1632,students:39000,url:"https://www.uva.nl/en",apply:"https://www.uva.nl/en/programmes",contact:"studentenservice@uva.nl",lat:52.3560,lng:4.9554,desc:"One of Europe's leading research universities in the heart of Amsterdam."},
  "Berklee College of Music":{full:"Berklee College of Music",type:"Music Conservatoire",founded:1945,students:6500,url:"https://www.berklee.edu",apply:"https://www.berklee.edu/admissions",contact:"admissions@berklee.edu",lat:42.3467,lng:-71.0875,desc:"World's largest independent college of contemporary music in Boston's Back Bay."},
  "Royal Academy of Music":{full:"Royal Academy of Music",type:"Conservatoire",founded:1822,students:800,url:"https://www.ram.ac.uk",apply:"https://www.ram.ac.uk/study",contact:"registry@ram.ac.uk",lat:51.5231,lng:-0.1501,desc:"UK's oldest conservatoire, near Regent's Park. Part of University of London."},
  "Sibelius Academy (Helsinki)":{full:"Sibelius Academy, Uniarts Helsinki",type:"Arts University",founded:1882,students:1500,url:"https://www.uniarts.fi/en/units/sibelius-academy/",apply:"https://www.uniarts.fi/en/admissions/",contact:"admissions@uniarts.fi",lat:60.1812,lng:24.9440,desc:"One of Europe's largest music academies. FREE tuition for ALL nationalities."},
  "Hochschule für Musik Hanns Eisler Berlin":{full:"Hochschule für Musik Hanns Eisler Berlin",type:"Conservatoire",founded:1950,students:600,url:"https://www.hfm-berlin.de/en/",apply:"https://www.hfm-berlin.de/en/studies/application/",contact:"info@hfm-berlin.de",lat:52.5133,lng:13.3898,desc:"Elite Berlin conservatoire. No tuition fees. Historic Mitte location."},
  "University of York":{full:"University of York",type:"Russell Group University",founded:1963,students:20000,url:"https://www.york.ac.uk",apply:"https://www.york.ac.uk/study",contact:"ug-admissions@york.ac.uk",lat:53.9470,lng:-1.0540,desc:"Campus university with lake. Russell Group. Excellent music and film departments."},
  "University of Surrey":{full:"University of Surrey",type:"University",founded:1966,students:16000,url:"https://www.surrey.ac.uk",apply:"https://www.surrey.ac.uk/apply",contact:"admissions@surrey.ac.uk",lat:51.2430,lng:-0.5890,desc:"Guildford campus. #1 for hospitality management. Excellent employability record."},
  "Goldsmiths":{full:"Goldsmiths, University of London",type:"University",founded:1891,students:10000,url:"https://www.gold.ac.uk",apply:"https://www.gold.ac.uk/study",contact:"admissions@gold.ac.uk",lat:51.4742,lng:-0.0354,desc:"New Cross, South London. Famous for creative and cultural studies. Turner Prize winners."},
  "USC Cinematic Arts":{full:"USC School of Cinematic Arts",type:"University School",founded:1929,students:1200,url:"https://cinema.usc.edu",apply:"https://cinema.usc.edu/admissions",contact:"cntv@cinema.usc.edu",lat:34.0224,lng:-118.2851,desc:"Premier film school in Hollywood. Alumni: George Lucas, Ryan Coogler. Industry connections."},
  "University of Warwick":{full:"University of Warwick",type:"Russell Group University",founded:1965,students:28000,url:"https://warwick.ac.uk",apply:"https://warwick.ac.uk/study",contact:"ugadmissions@warwick.ac.uk",lat:52.3793,lng:-1.5615,desc:"Top-10 UK university near Coventry. Excellent arts centre and creative writing programme."},
  "DFFB (Berlin Film Academy)":{full:"Deutsche Film- und Fernsehakademie Berlin",type:"Film School",founded:1966,students:180,url:"https://www.dffb.de/en/",apply:"https://www.dffb.de/en/application/",contact:"info@dffb.de",lat:52.5094,lng:13.3730,desc:"Prestigious German film school at Potsdamer Platz. FREE tuition. All nationalities."},
  "University of Amsterdam":{full:"University of Amsterdam",type:"Research University",founded:1632,students:39000,url:"https://www.uva.nl/en",apply:"https://www.uva.nl/en/programmes",contact:"studentenservice@uva.nl",lat:52.3560,lng:4.9554,desc:"Top European research university in Amsterdam's city centre."},
  "London Film School":{full:"London Film School",type:"Film School",founded:1956,students:220,url:"https://www.lfs.org.uk",apply:"https://www.lfs.org.uk/apply",contact:"info@lfs.org.uk",lat:51.5155,lng:-0.1310,desc:"Independent postgraduate film school in Covent Garden. Highly practical training."},
  "Bournemouth University":{full:"Bournemouth University",type:"University",founded:1992,students:17000,url:"https://www.bournemouth.ac.uk",apply:"https://www.bournemouth.ac.uk/study",contact:"futurestudents@bournemouth.ac.uk",lat:50.7418,lng:-1.8978,desc:"Known for world-class animation and VFX. Many graduates at Pixar, Aardman, and Framestore."},
  "University of Sussex":{full:"University of Sussex",type:"University",founded:1961,students:20000,url:"https://www.sussex.ac.uk",apply:"https://www.sussex.ac.uk/study",contact:"ug.enquiries@sussex.ac.uk",lat:50.8657,lng:-0.0873,desc:"Campus university near Brighton. Strong media and journalism."},
  "University of East Anglia":{full:"University of East Anglia",type:"University",founded:1963,students:17000,url:"https://www.uea.ac.uk",apply:"https://www.uea.ac.uk/study",contact:"admissions@uea.ac.uk",lat:52.6220,lng:1.2424,desc:"Norwich campus. Iconic Sainsbury Centre. #1 for Creative Writing — alumni: Ian McEwan, Kazuo Ishiguro."},
  "University of Oxford":{full:"University of Oxford",type:"University",founded:1096,students:24000,url:"https://www.ox.ac.uk",apply:"https://www.ox.ac.uk/admissions",contact:"undergraduate.admissions@admin.ox.ac.uk",lat:51.7520,lng:-1.2577,desc:"World's oldest English-speaking university. Tutorial system. 39 colleges."},
  "Columbia University":{full:"Columbia University",type:"Ivy League University",founded:1754,students:33000,url:"https://www.columbia.edu",apply:"https://apply.college.columbia.edu",contact:"ugrad-admissions@columbia.edu",lat:40.8075,lng:-73.9626,desc:"Ivy League in Manhattan. Top-ranked MFA Creative Writing programme."},
  "City, University of London":{full:"City, University of London",type:"University",founded:1894,students:20000,url:"https://www.city.ac.uk",apply:"https://www.city.ac.uk/study",contact:"ugadmissions@city.ac.uk",lat:51.5279,lng:-0.1025,desc:"Islington, central London. Department of Journalism ranked #1 in UK."},
  "University of Gothenburg":{full:"University of Gothenburg",type:"Research University",founded:1891,students:37000,url:"https://www.gu.se/en",apply:"https://www.gu.se/en/study-in-gothenburg",contact:"info@gu.se",lat:57.6965,lng:11.9865,desc:"Sweden's second-largest university. Free tuition for EU/EEA students."},
  "RISD":{full:"Rhode Island School of Design",type:"Art & Design School",founded:1877,students:2500,url:"https://www.risd.edu",apply:"https://www.risd.edu/admissions",contact:"admissions@risd.edu",lat:41.8260,lng:-71.4070,desc:"Providence, RI. One of world's top art and design schools."},
  "Central Saint Martins (UAL)":{full:"Central Saint Martins, UAL",type:"Arts University",founded:1854,students:5000,url:"https://www.arts.ac.uk/colleges/central-saint-martins/",apply:"https://www.arts.ac.uk/study-at-ual/apply/",contact:"info@arts.ac.uk",lat:51.5398,lng:-0.1254,desc:"King's Cross, London. World-leading art and design. Alumni: Alexander McQueen, Stella McCartney."},
  "Gerrit Rietveld Academie":{full:"Gerrit Rietveld Academie",type:"Art Academy",founded:1924,students:950,url:"https://rfrietveldacademie.nl/en/",apply:"https://rfrietveldacademie.nl/en/admissions/",contact:"info@rfrietveldacademie.nl",lat:52.3580,lng:4.8790,desc:"Independent art academy in Amsterdam. Named after De Stijl designer Gerrit Rietveld."},
  "Royal College of Art":{full:"Royal College of Art",type:"Postgraduate Art University",founded:1837,students:2600,url:"https://www.rca.ac.uk",apply:"https://www.rca.ac.uk/study/apply",contact:"admissions@rca.ac.uk",lat:51.5012,lng:-0.1796,desc:"World #1 for Art & Design (QS). Postgraduate only. South Kensington and Battersea campuses."},
  "Falmouth University":{full:"Falmouth University",type:"University",founded:1902,students:6500,url:"https://www.falmouth.ac.uk",apply:"https://www.falmouth.ac.uk/study",contact:"admissions@falmouth.ac.uk",lat:50.1480,lng:-5.0585,desc:"Cornwall's creative university. Beautiful coastal setting. Strong for illustration and games."},
  "London College of Fashion (UAL)":{full:"London College of Fashion, UAL",type:"Arts University",founded:1906,students:5500,url:"https://www.arts.ac.uk/colleges/london-college-of-fashion/",apply:"https://www.arts.ac.uk/study-at-ual/apply/",contact:"info@arts.ac.uk",lat:51.5146,lng:-0.0173,desc:"Stratford, East London. UK's only specialist fashion college."},
  "Eindhoven University of Technology":{full:"Eindhoven University of Technology",type:"Technical University",founded:1956,students:12000,url:"https://www.tue.nl/en/",apply:"https://www.tue.nl/en/education/become-a-tue-student/",contact:"studentsupport@tue.nl",lat:51.4480,lng:5.4866,desc:"Leading Dutch tech university. Strong design and engineering integration."},
  "Aalto University":{full:"Aalto University",type:"University",founded:2010,students:20000,url:"https://www.aalto.fi/en",apply:"https://www.aalto.fi/en/study-at-aalto",contact:"admissions@aalto.fi",lat:60.1868,lng:24.8264,desc:"Helsinki area. Merges art, business and technology. FREE tuition for EU/EEA."},
  "Loughborough University":{full:"Loughborough University",type:"University",founded:1966,students:18000,url:"https://www.lboro.ac.uk",apply:"https://www.lboro.ac.uk/study",contact:"admissions@lboro.ac.uk",lat:52.7650,lng:-1.2290,desc:"Campus university. #1 for sport. Excellent engineering and design."},
  "University of Edinburgh":{full:"University of Edinburgh",type:"Russell Group University",founded:1583,students:45000,url:"https://www.ed.ac.uk",apply:"https://www.ed.ac.uk/studying",contact:"sra.enquiries@ed.ac.uk",lat:55.9445,lng:-3.1892,desc:"Ancient university in Scotland's capital. World-class AI/CS and medicine. Russell Group."},
  "Technical University of Munich (TUM)":{full:"Technical University of Munich",type:"Technical University",founded:1868,students:50000,url:"https://www.tum.de/en/",apply:"https://www.tum.de/en/studies/application",contact:"studium@tum.de",lat:48.1497,lng:11.5681,desc:"Germany's top technical university. NO tuition fees for any nationality."},
  "ETH Zurich":{full:"ETH Zurich — Swiss Federal Institute of Technology",type:"Technical University",founded:1855,students:24000,url:"https://ethz.ch/en.html",apply:"https://ethz.ch/en/studies/registration-application.html",contact:"bachelor@ethz.ch",lat:47.3763,lng:8.5479,desc:"#7 QS globally. Einstein's alma mater. Same low fees (~CHF 730/semester) for ALL nationalities."},
  "EPFL Lausanne":{full:"École Polytechnique Fédérale de Lausanne",type:"Technical University",founded:1853,students:12000,url:"https://www.epfl.ch/en/",apply:"https://www.epfl.ch/education/admission/",contact:"admissions@epfl.ch",lat:46.5191,lng:6.5668,desc:"Lake Geneva campus. Top 14 globally. Same fees for all. Stunning setting near Lausanne."},
  "Imperial College London":{full:"Imperial College London",type:"University",founded:1907,students:22000,url:"https://www.imperial.ac.uk",apply:"https://www.imperial.ac.uk/study",contact:"pg.admissions@imperial.ac.uk",lat:51.4988,lng:-0.1749,desc:"South Kensington, London. World-leading STEM university. Top 10 globally."},
  "University of Toronto":{full:"University of Toronto",type:"University",founded:1827,students:97000,url:"https://www.utoronto.ca",apply:"https://future.utoronto.ca",contact:"admissions.help@utoronto.ca",lat:43.6629,lng:-79.3957,desc:"Canada's top university. Downtown Toronto campus. Three campuses."},
  "University of Cambridge":{full:"University of Cambridge",type:"University",founded:1209,students:24000,url:"https://www.cam.ac.uk",apply:"https://www.undergraduate.study.cam.ac.uk",contact:"admissions@cam.ac.uk",lat:52.2054,lng:0.1132,desc:"31 colleges. Tutorial system. Among the world's most prestigious universities."},
  "University of Manchester":{full:"University of Manchester",type:"Russell Group University",founded:1824,students:45000,url:"https://www.manchester.ac.uk",apply:"https://www.manchester.ac.uk/study",contact:"ug.admissions@manchester.ac.uk",lat:53.4668,lng:-2.2339,desc:"Largest single-site UK university. Oxford Road corridor. Excellent across all disciplines."},
  "LSE":{full:"London School of Economics and Political Science",type:"University",founded:1895,students:12000,url:"https://www.lse.ac.uk",apply:"https://www.lse.ac.uk/study",contact:"ug.admissions@lse.ac.uk",lat:51.5144,lng:-0.1165,desc:"World-leading social science university. Aldwych, central London."},
  "University of Mannheim":{full:"University of Mannheim",type:"University",founded:1967,students:12000,url:"https://www.uni-mannheim.de/en/",apply:"https://www.uni-mannheim.de/en/academics/coming-to-uni-mannheim/",contact:"service@uni-mannheim.de",lat:49.4836,lng:8.4630,desc:"Germany's top business school. Historic Baroque palace campus. No fees for EU."},
  "Copenhagen Business School":{full:"Copenhagen Business School",type:"Business School",founded:1917,students:23000,url:"https://www.cbs.dk/en",apply:"https://www.cbs.dk/en/study/admissions",contact:"cbs@cbs.dk",lat:55.6812,lng:12.5285,desc:"One of Europe's largest business schools. FREE tuition for EU/EEA students."},
  "HEC Montréal":{full:"HEC Montréal",type:"Business School",founded:1907,students:14000,url:"https://www.hec.ca/en/",apply:"https://www.hec.ca/en/programs/",contact:"info@hec.ca",lat:45.5017,lng:-73.6165,desc:"Canada's premier French-language business school. Trilingual programmes."},
  "INSEAD":{full:"INSEAD",type:"Business School",founded:1957,students:1300,url:"https://www.insead.edu",apply:"https://www.insead.edu/master-programmes/mba/application-process",contact:"mba.info@insead.edu",lat:48.4056,lng:2.7001,desc:"World's top MBA. Fontainebleau campus near Paris. One-year intensive programme."},
  "University of Melbourne":{full:"University of Melbourne",type:"University",founded:1853,students:65000,url:"https://www.unimelb.edu.au",apply:"https://study.unimelb.edu.au",contact:"13MELB@unimelb.edu.au",lat:-37.7963,lng:144.9614,desc:"Australia's top-ranked university. Parkville campus."},
  "King's College London":{full:"King's College London",type:"Russell Group University",founded:1829,students:33000,url:"https://www.kcl.ac.uk",apply:"https://www.kcl.ac.uk/study",contact:"ugadmissions@kcl.ac.uk",lat:51.5115,lng:-0.1160,desc:"Strand/Waterloo campuses. Russell Group. Strong health sciences and humanities."},
  "LMU Munich":{full:"Ludwig-Maximilians-Universität München",type:"University",founded:1472,students:52000,url:"https://www.lmu.de/en/",apply:"https://www.lmu.de/en/study/all-degrees-and-programmes/",contact:"international@lmu.de",lat:48.1508,lng:11.5808,desc:"Germany's premier research university. NO tuition fees for any nationality."},
  "University of Southampton":{full:"University of Southampton",type:"Russell Group University",founded:1862,students:25000,url:"https://www.southampton.ac.uk",apply:"https://www.southampton.ac.uk/study",contact:"admissions@soton.ac.uk",lat:50.9348,lng:-1.3961,desc:"Russell Group. Leading marine science and oceanography."},
  "Uppsala University":{full:"Uppsala University",type:"Research University",founded:1477,students:44000,url:"https://www.uu.se/en",apply:"https://www.uu.se/en/study",contact:"admissions@uu.se",lat:59.8586,lng:17.6389,desc:"Sweden's oldest university. UNESCO World Heritage city. FREE tuition for EU/EEA."},
  "LSHTM":{full:"London School of Hygiene & Tropical Medicine",type:"University",founded:1899,students:4000,url:"https://www.lshtm.ac.uk",apply:"https://www.lshtm.ac.uk/study/applications",contact:"registry@lshtm.ac.uk",lat:51.5209,lng:-0.1306,desc:"World #3 for public health. Bloomsbury, London."},
  "UCL":{full:"University College London",type:"Russell Group University",founded:1826,students:47000,url:"https://www.ucl.ac.uk",apply:"https://www.ucl.ac.uk/prospective-students",contact:"study@ucl.ac.uk",lat:51.5246,lng:-0.1340,desc:"London's global university. Bloomsbury. Top 10 globally. Bartlett School of Architecture."},
  "Maastricht University":{full:"Maastricht University",type:"University",founded:1976,students:18000,url:"https://www.maastrichtuniversity.nl",apply:"https://www.maastrichtuniversity.nl/education/why-um/your-application",contact:"info@maastrichtuniversity.nl",lat:50.8465,lng:5.6872,desc:"Problem-based learning. Most international university in Netherlands. EU/EEA statutory fee."},
  "University of Sheffield":{full:"University of Sheffield",type:"Russell Group University",founded:1905,students:30000,url:"https://www.sheffield.ac.uk",apply:"https://www.sheffield.ac.uk/study",contact:"ask@sheffield.ac.uk",lat:53.3810,lng:-1.4884,desc:"Russell Group. Sheffield Student Union voted UK's best."},
  "University of Glasgow":{full:"University of Glasgow",type:"Russell Group University",founded:1451,students:36000,url:"https://www.gla.ac.uk",apply:"https://www.gla.ac.uk/study",contact:"admissions@glasgow.ac.uk",lat:55.8721,lng:-4.2882,desc:"Ancient university in Glasgow's West End. Beautiful Gothic campus. Scottish-domiciled: FREE via SAAS."},
  "Sciences Po Paris":{full:"Sciences Po",type:"University",founded:1872,students:14000,url:"https://www.sciencespo.fr/en",apply:"https://www.sciencespo.fr/en/admissions",contact:"admissions@sciencespo.fr",lat:48.8549,lng:2.3283,desc:"France's leading university for political and social sciences. Saint-Germain-des-Prés."},
  "Humboldt University Berlin":{full:"Humboldt-Universität zu Berlin",type:"University",founded:1810,students:35000,url:"https://www.hu-berlin.de/en",apply:"https://www.hu-berlin.de/en/studies",contact:"studienberatung@hu-berlin.de",lat:52.5186,lng:13.3930,desc:"Historic Berlin university. No tuition fees for any nationality. Unter den Linden."},
  "University College Utrecht":{full:"University College Utrecht",type:"University College",founded:1998,students:750,url:"https://www.uu.nl/en/organisation/university-college-utrecht",apply:"https://www.uu.nl/en/organisation/university-college-utrecht/admissions",contact:"admissions.ucu@uu.nl",lat:52.0893,lng:5.1049,desc:"Selective liberal arts college. Small classes. International. EU/EEA: statutory fee."},
  "Durham University":{full:"Durham University",type:"Russell Group University",founded:1832,students:20000,url:"https://www.durham.ac.uk",apply:"https://www.durham.ac.uk/study",contact:"admissions@durham.ac.uk",lat:54.7680,lng:-1.5728,desc:"Collegiate Russell Group university. UNESCO World Heritage city. Beautiful setting."},
  "DTU Denmark":{full:"Technical University of Denmark",type:"Technical University",founded:1829,students:13000,url:"https://www.dtu.dk/en",apply:"https://www.dtu.dk/en/education/admission",contact:"info@dtu.dk",lat:55.7861,lng:12.5234,desc:"Denmark's leading engineering university. Lyngby campus near Copenhagen. FREE for EU/EEA."},
  "Politecnico di Milano":{full:"Politecnico di Milano",type:"Technical University",founded:1863,students:47000,url:"https://www.polimi.it/en/",apply:"https://www.polimi.it/en/admission-and-tuition-fees/",contact:"urp@polimi.it",lat:45.4786,lng:9.2270,desc:"Italy's largest technical university. QS top 10 for architecture and design."},
  "TU Delft":{full:"Delft University of Technology",type:"Technical University",founded:1842,students:26000,url:"https://www.tudelft.nl/en/",apply:"https://www.tudelft.nl/en/education/programmes/bachelors",contact:"admissions@tudelft.nl",lat:52.0021,lng:4.3708,desc:"Netherlands' oldest and largest technical university. Cycling city."},
  "University of St Andrews":{full:"University of St Andrews",type:"University",founded:1413,students:10000,url:"https://www.st-andrews.ac.uk",apply:"https://www.st-andrews.ac.uk/study",contact:"admissions@st-andrews.ac.uk",lat:56.3398,lng:-2.7967,desc:"Scotland's oldest university. Small coastal town. Scottish-domiciled: FREE via SAAS."},
  "University of Bath":{full:"University of Bath",type:"University",founded:1966,students:18000,url:"https://www.bath.ac.uk",apply:"https://www.bath.ac.uk/study",contact:"admissions@bath.ac.uk",lat:51.3804,lng:-2.3277,desc:"Hilltop campus overlooking Bath. Excellent for psychology, architecture, sport."},
  "University of Nottingham":{full:"University of Nottingham",type:"Russell Group University",founded:1881,students:35000,url:"https://www.nottingham.ac.uk",apply:"https://www.nottingham.ac.uk/studywithus",contact:"undergraduate-enquiries@nottingham.ac.uk",lat:52.9388,lng:-1.1963,desc:"University Park campus. Russell Group. Strong for education and TESOL."},
  "EHL Lausanne":{full:"EHL Hospitality Business School",type:"Business School",founded:1893,students:3500,url:"https://www.ehl.edu",apply:"https://www.ehl.edu/en/apply",contact:"info@ehl.edu",lat:46.5140,lng:6.5820,desc:"World's #1 hospitality school. Lausanne, Switzerland. Premium education."},
  "University of Reading":{full:"University of Reading",type:"University",founded:1926,students:17000,url:"https://www.reading.ac.uk",apply:"https://www.reading.ac.uk/study",contact:"student.recruitment@reading.ac.uk",lat:51.4414,lng:-0.9456,desc:"Campus university. Strong agriculture and food science."},
  "University of Plymouth":{full:"University of Plymouth",type:"University",founded:1862,students:18000,url:"https://www.plymouth.ac.uk",apply:"https://www.plymouth.ac.uk/study",contact:"admissions@plymouth.ac.uk",lat:50.3755,lng:-4.1427,desc:"Coastal university. Strong marine biology. Affordable."},
  "The Open University":{full:"The Open University",type:"Distance Learning University",founded:1969,students:170000,url:"https://www.open.ac.uk",apply:"https://www.open.ac.uk/courses",contact:"general-enquiries@open.ac.uk",lat:52.0249,lng:-0.7097,desc:"UK's largest university by student numbers. NO formal entry requirements. Study anywhere."},
};

// Course search URL builder
function getCourseUrl(course) {
  const inst = INST_DATA[course.institution];
  if (inst && inst.apply) return inst.apply;
  if (course.online) {
    if (course.institution.includes("Coursera")) return "https://www.coursera.org/search?query="+encodeURIComponent(course.title);
    if (course.institution.includes("edX")) return "https://www.edx.org/search?q="+encodeURIComponent(course.title);
    if (course.institution.includes("FutureLearn")) return "https://www.futurelearn.com/search?q="+encodeURIComponent(course.title);
    if (course.institution.includes("Khan")) return "https://www.khanacademy.org";
    if (course.institution.includes("Odin")) return "https://www.theodinproject.com";
    if (course.institution.includes("MasterClass")) return "https://www.masterclass.com";
    if (course.institution.includes("Berklee Online")) return "https://online.berklee.edu";
    if (course.institution.includes("MIT")) return "https://ocw.mit.edu";
  }
  return "https://www.google.com/search?q="+encodeURIComponent(course.title+" "+course.institution+" apply");
}

// 119 courses - compact format: t=title,inst=institution,co=country,ci=city,lev=level,mo=mode,dom=domain,sub=subjects,fH=feeHome,fI=feeIntl,liv=livingCost,dur=duration,rank=ranking,en=entry,car=careers,sal=salary,emp=employability,on=online,fr=free
const C=[
// PERFORMING ARTS (14)
{id:1,t:"BFA Acting",inst:"RADA",co:"UK",ci:"London",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"performing_arts",sub:["acting","drama","theatre","performing arts","voice","physical theatre"],fH:9250,fI:23333,liv:18000,dur:"3 years",rank:1,en:"Audition-based — no formal qualifications required. Talent-led. Mature students welcome. No upper age limit.",car:["Actor","Director","Drama Teacher","Voice Coach"],sal:"£20k-£60k+",emp:65,on:false,fr:false},
{id:2,t:"BA Acting",inst:"Royal Central School of Speech and Drama",co:"UK",ci:"London",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"performing_arts",sub:["acting","drama","theatre","performing arts","devised theatre","voice"],fH:9250,fI:21000,liv:18000,dur:"3 years",rank:2,en:"Audition + interview. No formal academic requirements. Access courses accepted. Mature students encouraged.",car:["Actor","Theatre Director","Drama Facilitator"],sal:"£20k-£50k+",emp:62,on:false,fr:false},
{id:3,t:"BFA Theatre Arts",inst:"Tisch School of the Arts, NYU",co:"USA",ci:"New York",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"performing_arts",sub:["acting","drama","theatre","performing arts","directing","playwriting"],fH:30000,fI:30000,liv:25000,dur:"4 years",rank:1,en:"Audition + SAT/ACT. Transfer & mature applicants accepted.",car:["Actor","Director","Playwright","Producer"],sal:"$30k-$80k+",emp:68,on:false,fr:false},
{id:4,t:"BA Theatre",inst:"Royal Conservatoire of Scotland",co:"Scotland",ci:"Glasgow",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"performing_arts",sub:["acting","drama","theatre","performing arts","musical theatre"],fH:1820,fI:20100,fS:9250,liv:10500,dur:"3 years",rank:3,en:"Audition. Scottish-domiciled: FREE via SAAS. No formal academic requirements. All ages.",car:["Actor","Director","Drama Teacher"],sal:"£20k-£45k",emp:63,on:false,fr:false},
{id:5,t:"BFA Musical Theatre",inst:"Carnegie Mellon University",co:"USA",ci:"Pittsburgh",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"performing_arts",sub:["musical theatre","acting","singing","dance","performing arts","theatre"],fH:32500,fI:32500,liv:15000,dur:"4 years",rank:1,en:"Audition + SAT/ACT.",car:["Musical Theatre Performer","Singer","Choreographer"],sal:"$28k-$70k+",emp:60,on:false,fr:false},
{id:6,t:"BFA Dance",inst:"Juilliard School",co:"USA",ci:"New York",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"performing_arts",sub:["dance","choreography","performance","performing arts","ballet","contemporary dance"],fH:35000,fI:35000,liv:25000,dur:"4 years",rank:1,en:"Audition. Need-blind admissions for US citizens.",car:["Dancer","Choreographer","Dance Teacher"],sal:"$25k-$60k",emp:55,on:false,fr:false},
{id:7,t:"BA Theatre & Performance",inst:"University of Leeds",co:"UK",ci:"Leeds",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"performing_arts",sub:["theatre","performance","drama","performing arts","devised theatre"],fH:9250,fI:24500,liv:10500,dur:"3 years",rank:20,en:"ABB A-Level. Mature: Access to HE Diploma accepted. BTEC DDM also considered.",car:["Theatre Maker","Arts Manager","Drama Teacher"],sal:"£22k-£38k",emp:70,on:false,fr:false},
{id:8,t:"MA Theatre Directing",inst:"Birkbeck, University of London",co:"UK",ci:"London",lev:"postgraduate",mo:["full-time","face-to-face"],dom:"performing_arts",sub:["directing","theatre","drama","performing arts","dramaturgy"],fH:11100,fI:18800,liv:18000,dur:"1 year",rank:0,en:"2:1 + directing experience. Equivalent professional experience considered for mature applicants without degree.",car:["Theatre Director","Artistic Director","Producer"],sal:"£25k-£55k",emp:60,on:false,fr:false},
{id:9,t:"BA Theatre & Digital Innovation",inst:"University of Exeter",co:"UK",ci:"Exeter",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"performing_arts",sub:["theatre","drama","digital","technology","performing arts","immersive"],fH:9250,fI:25000,liv:10000,dur:"3 years",rank:12,en:"ABB. Access to HE accepted. BTEC DDM.",car:["Digital Theatre Maker","Immersive Designer","Technical Director"],sal:"£24k-£45k",emp:72,on:false,fr:false},
{id:10,t:"BA Drama & Theatre",inst:"University of Bristol",co:"UK",ci:"Bristol",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"performing_arts",sub:["drama","theatre","performing arts","devised theatre","performance"],fH:9250,fI:24700,liv:11000,dur:"3 years",rank:5,en:"AAB. IB 34. Access accepted. Mature applicants welcome.",car:["Actor","Director","Theatre Maker","Drama Teacher"],sal:"£22k-£40k",emp:68,on:false,fr:false},
{id:11,t:"BA Performing Arts",inst:"Zürich University of the Arts (ZHdK)",co:"Switzerland",ci:"Zurich",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"performing_arts",sub:["performing arts","theatre","dance","acting","physical theatre"],fH:1440,fI:1440,liv:24000,dur:"3 years",rank:0,en:"Audition + entrance exam. Same low fees for ALL nationalities.",car:["Performer","Choreographer","Theatre Maker"],sal:"CHF 40k-80k",emp:55,on:false,fr:false},
{id:12,t:"BA Theatre",inst:"University of Amsterdam (DAS)",co:"Netherlands",ci:"Amsterdam",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"performing_arts",sub:["theatre","performance","performing arts","devised theatre","directing"],fH:2314,fI:11160,liv:14000,dur:"3 years",rank:50,en:"Portfolio + audition. EU/EEA: statutory fee.",car:["Theatre Maker","Director","Performance Artist"],sal:"€25k-€45k",emp:58,on:false,fr:false},
{id:13,t:"Introduction to Acting (Free Online)",inst:"MasterClass / Various",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"performing_arts",sub:["acting","drama","theatre","performing arts"],fH:0,fI:0,liv:0,dur:"Self-paced",rank:0,en:"None. Open to all ages.",car:["Foundation for further study"],sal:"N/A",emp:20,on:true,fr:true},
{id:14,t:"Theatre & Performance Studies",inst:"FutureLearn / Various",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"performing_arts",sub:["theatre","performance","drama","performing arts","critical analysis"],fH:0,fI:0,liv:0,dur:"8 weeks",rank:0,en:"None. Free to access.",car:["Foundation for degree study"],sal:"N/A",emp:25,on:true,fr:true},
// MUSIC (9)
{id:15,t:"BMus Music Performance",inst:"Berklee College of Music",co:"USA",ci:"Boston",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"music",sub:["music","performance","composition","songwriting","music production"],fH:48600,fI:48600,liv:20000,dur:"4 years",rank:1,en:"Audition + portfolio.",car:["Musician","Music Producer","Composer"],sal:"$30k-$80k",emp:60,on:false,fr:false},
{id:16,t:"BMus Music",inst:"Royal Academy of Music",co:"UK",ci:"London",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"music",sub:["music","performance","composition","classical music","conducting"],fH:9250,fI:27400,liv:18000,dur:"4 years",rank:1,en:"Audition + ABRSM Grade 8+. Mature applicants on merit.",car:["Performer","Conductor","Composer"],sal:"£22k-£55k",emp:58,on:false,fr:false},
{id:17,t:"BMus Music",inst:"Sibelius Academy (Helsinki)",co:"Finland",ci:"Helsinki",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"music",sub:["music","performance","composition","classical music","jazz","conducting"],fH:0,fI:0,liv:12000,dur:"3 years",rank:1,en:"Audition. FREE for ALL nationalities.",car:["Performer","Conductor","Composer"],sal:"€30k-€55k",emp:55,on:true,fr:true},
{id:18,t:"BMus Music",inst:"Hochschule für Musik Hanns Eisler Berlin",co:"Germany",ci:"Berlin",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"music",sub:["music","performance","composition","conducting","opera","classical music"],fH:0,fI:0,liv:11000,dur:"4 years",rank:1,en:"Audition. No tuition fees (~€300/semester admin). ALL nationalities.",car:["Performer","Conductor","Opera Singer"],sal:"€30k-€60k",emp:55,on:false,fr:true},
{id:19,t:"BA Music",inst:"University of York",co:"UK",ci:"York",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"music",sub:["music","composition","sound design","music technology","performance"],fH:9250,fI:23700,liv:10000,dur:"3 years",rank:8,en:"ABB + Grade 7. Access to HE accepted.",car:["Composer","Sound Designer","Music Technologist"],sal:"£22k-£40k",emp:65,on:false,fr:false},
{id:20,t:"Berklee Online Music Production",inst:"Berklee Online",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"music",sub:["music production","audio","recording","mixing","mastering"],fH:1500,fI:1500,liv:0,dur:"6 months",rank:1,en:"None.",car:["Music Producer","Audio Engineer"],sal:"$25k-$50k",emp:55,on:true,fr:false},
{id:21,t:"Introduction to Music Production",inst:"Coursera / Berklee",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"music",sub:["music production","audio","recording","music"],fH:0,fI:0,liv:0,dur:"4 weeks",rank:0,en:"None. Free to audit.",car:["Foundation for further study"],sal:"N/A",emp:20,on:true,fr:true},
{id:22,t:"BA Music & Sound Recording (Tonmeister)",inst:"University of Surrey",co:"UK",ci:"Guildford",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"music",sub:["music","sound design","recording","audio","acoustics"],fH:9250,fI:22000,liv:11000,dur:"4 years",rank:1,en:"AAB + Grade 8. Mature: professional experience considered.",car:["Recording Engineer","Sound Designer"],sal:"£28k-£55k",emp:85,on:false,fr:false},
{id:23,t:"BMus Popular Music",inst:"Goldsmiths",co:"UK",ci:"London",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"music",sub:["music","popular music","songwriting","performance","music production"],fH:9250,fI:20820,liv:18000,dur:"3 years",rank:0,en:"BBB + audition. Access accepted. Mature students welcome.",car:["Musician","Songwriter","Producer"],sal:"£20k-£45k",emp:58,on:false,fr:false},
// FILM & MEDIA (10)
{id:24,t:"BFA Film Production",inst:"USC Cinematic Arts",co:"USA",ci:"Los Angeles",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"film_media",sub:["film","filmmaking","film production","screenwriting","directing","cinematography"],fH:37500,fI:37500,liv:20000,dur:"4 years",rank:1,en:"Portfolio + application.",car:["Film Director","Screenwriter","Producer","Cinematographer"],sal:"$35k-$100k+",emp:70,on:false,fr:false},
{id:25,t:"BA Film Studies",inst:"University of Warwick",co:"UK",ci:"Coventry",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"film_media",sub:["film","cinema","media","film theory","screenwriting"],fH:9250,fI:22280,liv:10500,dur:"3 years",rank:8,en:"ABB. Access accepted. Mature welcome.",car:["Film Critic","Producer","Screenwriter"],sal:"£23k-£40k",emp:68,on:false,fr:false},
{id:26,t:"BA Film",inst:"DFFB (Berlin Film Academy)",co:"Germany",ci:"Berlin",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"film_media",sub:["film","filmmaking","directing","screenwriting","documentary","cinematography"],fH:0,fI:0,liv:11000,dur:"4 years",rank:1,en:"Portfolio + entrance exam. No tuition fees. ALL nationalities. Age 18-30.",car:["Film Director","Screenwriter","Cinematographer"],sal:"€30k-€60k",emp:65,on:false,fr:true},
{id:27,t:"BA Film Studies",inst:"University of Amsterdam",co:"Netherlands",ci:"Amsterdam",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"film_media",sub:["film","cinema","media studies","film theory"],fH:2314,fI:11160,liv:14000,dur:"3 years",rank:50,en:"Diploma or equivalent. EU/EEA: statutory fee.",car:["Film Critic","Media Researcher"],sal:"€25k-€40k",emp:65,on:false,fr:false},
{id:28,t:"MA Filmmaking",inst:"London Film School",co:"UK",ci:"London",lev:"postgraduate",mo:["full-time","face-to-face"],dom:"film_media",sub:["film","filmmaking","directing","screenwriting","cinematography","documentary"],fH:16800,fI:32000,liv:18000,dur:"2 years",rank:1,en:"Degree + portfolio. Professional experience accepted in lieu of degree for mature applicants.",car:["Film Director","Producer","Screenwriter"],sal:"£25k-£60k+",emp:65,on:false,fr:false},
{id:29,t:"BA Animation",inst:"Bournemouth University",co:"UK",ci:"Bournemouth",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"film_media",sub:["animation","film","visual effects","3D","motion graphics"],fH:9250,fI:18950,liv:10000,dur:"4 years",rank:1,en:"Portfolio + interview. Foundation year available. Mature welcome.",car:["Animator","VFX Artist","Motion Designer"],sal:"£25k-£50k",emp:80,on:false,fr:false},
{id:30,t:"BA Film & TV Production",inst:"University of York",co:"UK",ci:"York",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"film_media",sub:["film","television","directing","cinematography","editing"],fH:9250,fI:23700,liv:10000,dur:"3 years",rank:10,en:"ABB. BTEC DDM. Access accepted.",car:["Film Director","TV Producer","Editor"],sal:"£22k-£45k",emp:70,on:false,fr:false},
{id:31,t:"Filmmaking Specialization (Free)",inst:"Michigan State (Coursera)",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"film_media",sub:["film","filmmaking","screenwriting","directing","documentary"],fH:0,fI:0,liv:0,dur:"6 months",rank:0,en:"None. Free to audit. Financial aid available.",car:["Indie Filmmaker","Content Creator"],sal:"$25k-$50k",emp:50,on:true,fr:true},
{id:32,t:"Film Production Fundamentals",inst:"FutureLearn",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"film_media",sub:["film","filmmaking","production","directing","editing"],fH:0,fI:0,liv:0,dur:"6 weeks",rank:0,en:"None. Free.",car:["Foundation for further study"],sal:"N/A",emp:20,on:true,fr:true},
{id:33,t:"BA Media Studies",inst:"University of Sussex",co:"UK",ci:"Brighton",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"film_media",sub:["media studies","broadcasting","journalism","film","digital media"],fH:9250,fI:21500,liv:12000,dur:"3 years",rank:15,en:"ABB. Access accepted. BTEC DDM.",car:["Journalist","Media Planner","PR Executive"],sal:"£22k-£38k",emp:72,on:false,fr:false},
// CREATIVE WRITING (7)
{id:34,t:"MA Creative Writing",inst:"University of East Anglia",co:"UK",ci:"Norwich",lev:"postgraduate",mo:["full-time","face-to-face"],dom:"creative_writing",sub:["creative writing","fiction","poetry","screenwriting","publishing","playwriting"],fH:11100,fI:21700,liv:10000,dur:"1 year",rank:1,en:"2:1 + writing portfolio. Professional writers without degrees considered on portfolio.",car:["Author","Screenwriter","Editor","Publisher"],sal:"£22k-£45k",emp:72,on:false,fr:false},
{id:35,t:"BA English Literature",inst:"University of Oxford",co:"UK",ci:"Oxford",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"creative_writing",sub:["english literature","literature","creative writing","humanities"],fH:9250,fI:29700,liv:14000,dur:"3 years",rank:1,en:"AAA. Mature: Access to HE Diploma accepted.",car:["Teacher","Journalist","Editor","Publishing"],sal:"£25k-£40k",emp:78,on:false,fr:false},
{id:36,t:"BA English & Creative Writing",inst:"University of Warwick",co:"UK",ci:"Coventry",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"creative_writing",sub:["creative writing","english literature","fiction","poetry"],fH:9250,fI:22280,liv:10500,dur:"3 years",rank:5,en:"AAB. Access accepted.",car:["Author","Journalist","Editor","Teacher"],sal:"£23k-£38k",emp:75,on:false,fr:false},
{id:37,t:"MFA Creative Writing",inst:"Columbia University",co:"USA",ci:"New York",lev:"postgraduate",mo:["full-time","face-to-face"],dom:"creative_writing",sub:["creative writing","fiction","poetry","literary studies"],fH:35000,fI:35000,liv:25000,dur:"2 years",rank:1,en:"Bachelor's + writing sample.",car:["Author","Poet","Professor","Editor"],sal:"$30k-$60k",emp:60,on:false,fr:false},
{id:38,t:"BA Journalism",inst:"City, University of London",co:"UK",ci:"London",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"creative_writing",sub:["journalism","media","writing","broadcasting","editing"],fH:9250,fI:21000,liv:18000,dur:"3 years",rank:1,en:"ABB. Mature: Access or professional experience.",car:["Journalist","Reporter","Editor"],sal:"£22k-£45k",emp:75,on:false,fr:false},
{id:39,t:"BA Creative Writing",inst:"University of Gothenburg",co:"Sweden",ci:"Gothenburg",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"creative_writing",sub:["creative writing","fiction","poetry","literature"],fH:0,fI:13500,liv:10000,dur:"3 years",rank:0,en:"Upper secondary or equivalent. EU/EEA: FREE tuition.",car:["Author","Editor","Publisher"],sal:"SEK 280k-450k",emp:60,on:false,fr:false},
{id:40,t:"Creative Writing Specialization (Free)",inst:"Wesleyan (Coursera)",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"creative_writing",sub:["creative writing","fiction","poetry","memoir"],fH:0,fI:0,liv:0,dur:"6 months",rank:0,en:"None. Free to audit.",car:["Writer","Blogger"],sal:"N/A",emp:40,on:true,fr:true},
// VISUAL ARTS (6)
{id:41,t:"BFA Visual Arts",inst:"RISD",co:"USA",ci:"Providence",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"visual_arts",sub:["fine art","painting","sculpture","visual arts","photography"],fH:32500,fI:32500,liv:15000,dur:"4 years",rank:1,en:"Portfolio.",car:["Artist","Gallery Curator","Illustrator"],sal:"$28k-$55k",emp:62,on:false,fr:false},
{id:42,t:"BA Fine Art",inst:"Central Saint Martins (UAL)",co:"UK",ci:"London",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"visual_arts",sub:["fine art","painting","sculpture","contemporary art","art"],fH:9250,fI:24500,liv:18000,dur:"3 years",rank:1,en:"Foundation + portfolio. Mature: portfolio-led, no upper age limit.",car:["Artist","Curator","Art Teacher"],sal:"£20k-£45k",emp:55,on:false,fr:false},
{id:43,t:"BA Fine Art",inst:"Gerrit Rietveld Academie",co:"Netherlands",ci:"Amsterdam",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"visual_arts",sub:["fine art","contemporary art","visual arts","painting","sculpture"],fH:2314,fI:11160,liv:14000,dur:"4 years",rank:1,en:"Portfolio + assignment. EU/EEA: statutory fee. All ages.",car:["Artist","Curator","Gallery Director"],sal:"€22k-€40k",emp:50,on:false,fr:false},
{id:44,t:"MA Fine Art",inst:"Royal College of Art",co:"UK",ci:"London",lev:"postgraduate",mo:["full-time","face-to-face"],dom:"visual_arts",sub:["fine art","contemporary art","sculpture","painting","art"],fH:15800,fI:37000,liv:18000,dur:"2 years",rank:1,en:"Portfolio + interview. No min degree classification — artistic merit.",car:["Artist","Lecturer","Curator"],sal:"£22k-£50k",emp:50,on:false,fr:false},
{id:45,t:"BA Illustration",inst:"Falmouth University",co:"UK",ci:"Falmouth",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"visual_arts",sub:["illustration","art","visual arts","drawing","storytelling"],fH:9250,fI:18000,liv:9000,dur:"3 years",rank:1,en:"Portfolio. Foundation year available. Access accepted.",car:["Illustrator","Graphic Novelist","Concept Artist"],sal:"£22k-£40k",emp:70,on:false,fr:false},
{id:46,t:"Modern Art & Ideas (Free)",inst:"MoMA (Coursera)",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"visual_arts",sub:["art","contemporary art","visual arts","art history"],fH:0,fI:0,liv:0,dur:"4 weeks",rank:0,en:"None. Free to audit.",car:["Foundation / appreciation"],sal:"N/A",emp:15,on:true,fr:true},
// DESIGN (7)
{id:47,t:"BA Graphic Design",inst:"Central Saint Martins (UAL)",co:"UK",ci:"London",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"design",sub:["graphic design","design","typography","branding"],fH:9250,fI:24500,liv:18000,dur:"3 years",rank:1,en:"Foundation + portfolio. Mature: portfolio-led.",car:["Graphic Designer","Art Director"],sal:"£24k-£50k",emp:80,on:false,fr:false},
{id:48,t:"BA Industrial Design",inst:"Eindhoven University of Technology",co:"Netherlands",ci:"Eindhoven",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"design",sub:["industrial design","product design","design","technology"],fH:2314,fI:14100,liv:11000,dur:"3 years",rank:1,en:"Maths + Physics. EU/EEA: statutory fee.",car:["Product Designer","UX Designer","Design Engineer"],sal:"€30k-€55k",emp:88,on:false,fr:false},
{id:49,t:"BDes Communication Design",inst:"Aalto University",co:"Finland",ci:"Helsinki",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"design",sub:["graphic design","design","visual communication","branding"],fH:0,fI:15000,liv:12000,dur:"3 years",rank:6,en:"Portfolio + exam. EU/EEA: FREE tuition.",car:["Graphic Designer","Brand Strategist"],sal:"€30k-€50k",emp:80,on:false,fr:false},
{id:50,t:"BSc Product Design",inst:"Loughborough University",co:"UK",ci:"Loughborough",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"design",sub:["product design","industrial design","design","engineering"],fH:9250,fI:27250,liv:9500,dur:"3 years",rank:1,en:"AAB. BTEC DDM. Foundation year for non-standard qualifications. Mature considered.",car:["Product Designer","Industrial Designer"],sal:"£26k-£50k",emp:85,on:false,fr:false},
{id:51,t:"Google UX Design Certificate",inst:"Coursera / Google",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"design",sub:["UX design","user research","prototyping","design thinking","UI"],fH:300,fI:300,liv:0,dur:"6 months",rank:0,en:"None. No experience required. Financial aid available.",car:["UX Designer","UI Designer","Product Designer"],sal:"£30k-£55k",emp:85,on:true,fr:false},
{id:52,t:"BA Fashion Design",inst:"London College of Fashion (UAL)",co:"UK",ci:"London",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"design",sub:["fashion design","design","textiles","fashion","art"],fH:9250,fI:24500,liv:18000,dur:"3 years",rank:1,en:"Foundation + portfolio.",car:["Fashion Designer","Stylist","Buyer"],sal:"£22k-£50k",emp:65,on:false,fr:false},
{id:53,t:"MDes Interaction Design",inst:"Royal College of Art",co:"UK",ci:"London",lev:"postgraduate",mo:["full-time","face-to-face"],dom:"design",sub:["interaction design","UX design","design","service design"],fH:15800,fI:37000,liv:18000,dur:"2 years",rank:1,en:"Portfolio + interview.",car:["Interaction Designer","UX Lead","Design Director"],sal:"£35k-£70k",emp:88,on:false,fr:false},
// COMPUTER SCIENCE (10)
{id:54,t:"BSc Computer Science",inst:"University of Edinburgh",co:"UK",ci:"Edinburgh",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"computer_science",sub:["computer science","programming","software engineering","AI","machine learning"],fH:9250,fI:34800,liv:12000,dur:"4 years",rank:15,en:"ABB-AAA. Access accepted. Mature with professional experience considered.",car:["Software Engineer","Data Scientist"],sal:"£35k-£55k",emp:92,on:false,fr:false},
{id:55,t:"BSc Computer Science",inst:"TU Munich (TUM)",co:"Germany",ci:"Munich",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"computer_science",sub:["computer science","programming","algorithms","AI","systems"],fH:0,fI:0,liv:12000,dur:"3 years",rank:37,en:"HZB or equivalent. No tuition fees for ANY nationality (~€144/semester).",car:["Software Engineer","Data Scientist","Research Scientist"],sal:"€45k-€70k",emp:93,on:false,fr:true},
{id:56,t:"BSc Computer Science",inst:"ETH Zurich",co:"Switzerland",ci:"Zurich",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"computer_science",sub:["computer science","algorithms","systems","programming","mathematics"],fH:1460,fI:1460,liv:24000,dur:"3 years",rank:7,en:"Swiss Matura or entrance exam. Same fees ALL nationalities.",car:["Software Engineer","Research Scientist"],sal:"CHF 90k-130k",emp:95,on:false,fr:false},
{id:57,t:"BSc Informatik",inst:"EPFL Lausanne",co:"Switzerland",ci:"Lausanne",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"computer_science",sub:["computer science","algorithms","programming","mathematics","AI"],fH:1266,fI:1266,liv:20000,dur:"3 years",rank:14,en:"Swiss Matura or equivalent. Same fees for all.",car:["Software Engineer","Startup Founder"],sal:"CHF 85k-125k",emp:95,on:false,fr:false},
{id:58,t:"MSc AI",inst:"University of Edinburgh",co:"UK",ci:"Edinburgh",lev:"postgraduate",mo:["full-time","face-to-face"],dom:"computer_science",sub:["AI","machine learning","NLP","computer science","robotics"],fH:16200,fI:37500,liv:12000,dur:"1 year",rank:15,en:"2:1 in CS/Maths. Professional experience may be considered.",car:["AI Engineer","ML Researcher"],sal:"£50k-£90k",emp:96,on:false,fr:false},
{id:59,t:"MSc Data Science",inst:"Imperial College London",co:"UK",ci:"London",lev:"postgraduate",mo:["full-time","face-to-face"],dom:"computer_science",sub:["data science","statistics","machine learning","programming"],fH:18500,fI:38200,liv:18000,dur:"1 year",rank:6,en:"2:1 in quantitative subject.",car:["Data Scientist","ML Engineer"],sal:"£45k-£75k",emp:95,on:false,fr:false},
{id:60,t:"BSc Computer Science",inst:"University of Toronto",co:"Canada",ci:"Toronto",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"computer_science",sub:["computer science","AI","software engineering","programming"],fH:6100,fI:57020,liv:16000,dur:"4 years",rank:21,en:"87%+ average.",car:["Software Engineer","AI Researcher","CTO"],sal:"CAD 65k-110k",emp:93,on:false,fr:false},
{id:61,t:"CS50 (Free)",inst:"Harvard (edX)",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"computer_science",sub:["computer science","programming","algorithms","web development"],fH:0,fI:0,liv:0,dur:"12 weeks",rank:1,en:"None. Completely free. Paid certificate optional ($149).",car:["Software Developer","Web Developer"],sal:"£25k-£45k",emp:70,on:true,fr:true},
{id:62,t:"Google Data Analytics Certificate",inst:"Coursera / Google",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"computer_science",sub:["data analytics","SQL","data visualisation","statistics"],fH:300,fI:300,liv:0,dur:"6 months",rank:0,en:"None. Financial aid available.",car:["Data Analyst","Business Analyst"],sal:"£28k-£45k",emp:80,on:true,fr:false},
{id:63,t:"Full Stack Web Dev (Free)",inst:"The Odin Project",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"computer_science",sub:["web development","programming","software engineering"],fH:0,fI:0,liv:0,dur:"6-12 months",rank:0,en:"None. Completely free, open source.",car:["Web Developer","Full Stack Engineer"],sal:"£30k-£55k",emp:75,on:true,fr:true},
// ENGINEERING (6)
{id:64,t:"BEng Mechanical Engineering",inst:"ETH Zurich",co:"Switzerland",ci:"Zurich",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"engineering",sub:["engineering","mechanical","physics","mathematics"],fH:1460,fI:1460,liv:24000,dur:"3 years",rank:7,en:"Swiss Matura or entrance exam. Same fees all.",car:["Mechanical Engineer","Product Designer"],sal:"CHF 80k-120k",emp:94,on:false,fr:false},
{id:65,t:"BEng Civil Engineering",inst:"Politecnico di Milano",co:"Italy",ci:"Milan",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"engineering",sub:["engineering","civil","structural","construction"],fH:3900,fI:3900,liv:12000,dur:"3 years",rank:10,en:"Diploma + entrance test. Same fees EU and non-EU.",car:["Civil Engineer","Structural Engineer"],sal:"€30k-€55k",emp:90,on:false,fr:false},
{id:66,t:"BSc Mechanical Engineering",inst:"TU Delft",co:"Netherlands",ci:"Delft",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"engineering",sub:["engineering","mechanical","physics","robotics"],fH:2314,fI:15600,liv:12000,dur:"3 years",rank:10,en:"Maths + Physics. EU/EEA: statutory fee.",car:["Mechanical Engineer","Robotics Engineer"],sal:"€35k-€60k",emp:92,on:false,fr:false},
{id:67,t:"MSc Sustainable Energy",inst:"DTU Denmark",co:"Denmark",ci:"Copenhagen",lev:"postgraduate",mo:["full-time","face-to-face"],dom:"engineering",sub:["energy","sustainability","engineering","renewable energy"],fH:0,fI:15000,liv:14000,dur:"2 years",rank:35,en:"BSc Engineering/Science. EU/EEA: FREE.",car:["Energy Consultant","Renewable Energy Engineer"],sal:"DKK 450k-650k",emp:91,on:false,fr:false},
{id:68,t:"MEng Electrical Engineering",inst:"Imperial College London",co:"UK",ci:"London",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"engineering",sub:["engineering","electrical","electronics","physics"],fH:9250,fI:38200,liv:18000,dur:"4 years",rank:6,en:"A*AA. Mature: Access to Engineering.",car:["Electrical Engineer","Electronics Designer"],sal:"£32k-£55k",emp:92,on:false,fr:false},
{id:69,t:"Engineering MicroMasters (Online)",inst:"edX / Various",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"engineering",sub:["engineering","physics","mathematics","systems"],fH:800,fI:800,liv:0,dur:"6-12 months",rank:0,en:"None. Can count towards Master's at some universities.",car:["Foundation for degree"],sal:"Varies",emp:50,on:true,fr:false},
// BUSINESS (7)
{id:70,t:"BSc Business",inst:"University of St Andrews",co:"Scotland",ci:"St Andrews",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"business",sub:["business","management","economics","finance","marketing"],fH:1820,fI:28350,fS:9250,liv:11000,dur:"4 years",rank:3,en:"AAB. Scottish: FREE via SAAS.",car:["Consultant","Marketing Manager"],sal:"£30k-£55k",emp:88,on:false,fr:false},
{id:71,t:"MBA",inst:"INSEAD",co:"France",ci:"Fontainebleau",lev:"postgraduate",mo:["full-time","face-to-face"],dom:"business",sub:["business","management","leadership","strategy","finance"],fH:95000,fI:95000,liv:20000,dur:"1 year",rank:2,en:"Bachelor's + GMAT + work experience.",car:["CEO","Strategy Consultant"],sal:"£80k-£150k+",emp:97,on:false,fr:false},
{id:72,t:"BSc Economics",inst:"LSE",co:"UK",ci:"London",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"business",sub:["economics","finance","mathematics","statistics"],fH:9250,fI:25200,liv:18000,dur:"3 years",rank:1,en:"A*AA. Mature: Access accepted.",car:["Economist","Financial Analyst"],sal:"£35k-£70k",emp:92,on:false,fr:false},
{id:73,t:"BSc Economics",inst:"University of Mannheim",co:"Germany",ci:"Mannheim",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"business",sub:["economics","business","finance","mathematics"],fH:0,fI:1500,liv:10000,dur:"3 years",rank:1,en:"Abitur or equivalent. No fees EU/EEA. Non-EU: €1,500/sem.",car:["Economist","Business Analyst"],sal:"€40k-€65k",emp:88,on:false,fr:false},
{id:74,t:"BSc International Business",inst:"Copenhagen Business School",co:"Denmark",ci:"Copenhagen",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"business",sub:["business","international business","economics","management"],fH:0,fI:15000,liv:14000,dur:"3 years",rank:1,en:"Danish secondary or equivalent. EU/EEA: FREE.",car:["International Business Manager"],sal:"DKK 400k-600k",emp:85,on:false,fr:false},
{id:75,t:"Digital Marketing (Online)",inst:"Uni of Illinois (Coursera)",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"business",sub:["marketing","digital marketing","SEO","social media"],fH:400,fI:400,liv:0,dur:"8 months",rank:0,en:"None. Financial aid available.",car:["Digital Marketing Manager"],sal:"£28k-£50k",emp:82,on:true,fr:false},
{id:76,t:"BBA International Business",inst:"HEC Montréal",co:"Canada",ci:"Montreal",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"business",sub:["business","international business","management","finance"],fH:4500,fI:22000,liv:14000,dur:"3 years",rank:1,en:"DEC or equivalent.",car:["Business Manager","Consultant"],sal:"CAD 55k-85k",emp:85,on:false,fr:false},
// SCIENCES (8)
{id:77,t:"BSc Environmental Science",inst:"University of Melbourne",co:"Australia",ci:"Melbourne",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"sciences",sub:["environmental science","ecology","sustainability","biology"],fH:9500,fI:42000,liv:21000,dur:"3 years",rank:14,en:"ATAR 80+.",car:["Environmental Consultant","Conservation Officer"],sal:"AUD 60k-90k",emp:85,on:false,fr:false},
{id:78,t:"BSc Mathematics",inst:"University of Warwick",co:"UK",ci:"Coventry",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"sciences",sub:["mathematics","statistics","pure maths","applied maths"],fH:9250,fI:29000,liv:10500,dur:"3 years",rank:5,en:"A*A*A inc Maths + FM.",car:["Actuary","Quant Analyst"],sal:"£35k-£70k",emp:91,on:false,fr:false},
{id:79,t:"BSc Physics",inst:"LMU Munich",co:"Germany",ci:"Munich",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"sciences",sub:["physics","mathematics","quantum mechanics","astrophysics"],fH:0,fI:0,liv:12000,dur:"3 years",rank:32,en:"HZB or equivalent. No tuition fees (any nationality).",car:["Physicist","Research Scientist"],sal:"€40k-€65k",emp:88,on:false,fr:true},
{id:80,t:"BSc Chemistry",inst:"University of Oxford",co:"UK",ci:"Oxford",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"sciences",sub:["chemistry","organic chemistry","biochemistry"],fH:9250,fI:39740,liv:14000,dur:"4 years",rank:1,en:"A*A*A.",car:["Chemist","Pharmaceutical Scientist"],sal:"£28k-£50k",emp:85,on:false,fr:false},
{id:81,t:"BSc Marine Biology",inst:"University of Southampton",co:"UK",ci:"Southampton",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"sciences",sub:["marine biology","biology","ecology","oceanography"],fH:9250,fI:24500,liv:11000,dur:"3 years",rank:1,en:"AAB inc Biology. Access accepted. Mature welcome.",car:["Marine Biologist","Ecologist"],sal:"£24k-£40k",emp:75,on:false,fr:false},
{id:82,t:"BSc Biology",inst:"Uppsala University",co:"Sweden",ci:"Uppsala",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"sciences",sub:["biology","genetics","ecology","evolution"],fH:0,fI:14000,liv:10000,dur:"3 years",rank:77,en:"Upper secondary. EU/EEA: FREE.",car:["Biologist","Researcher"],sal:"SEK 300k-450k",emp:78,on:false,fr:false},
{id:83,t:"BSc Biomedical Sciences",inst:"King's College London",co:"UK",ci:"London",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"sciences",sub:["biomedical science","biology","chemistry","anatomy"],fH:9250,fI:29100,liv:18000,dur:"3 years",rank:23,en:"AAB inc Bio + Chem. Access accepted.",car:["Biomedical Scientist","Lab Manager"],sal:"£28k-£55k",emp:87,on:false,fr:false},
{id:84,t:"Science Fundamentals (Free)",inst:"edX / Khan Academy",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"sciences",sub:["biology","chemistry","physics","mathematics"],fH:0,fI:0,liv:0,dur:"Self-paced",rank:0,en:"None. Free.",car:["Foundation for further study"],sal:"N/A",emp:30,on:true,fr:true},
// MEDICINE & HEALTH (5)
{id:85,t:"BSc Nursing",inst:"University of Manchester",co:"UK",ci:"Manchester",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"medicine_health",sub:["nursing","healthcare","biology","patient care"],fH:9250,fI:28000,liv:11000,dur:"3 years",rank:27,en:"BBB inc a science. Access accepted. Mature strongly encouraged — NHS values life experience.",car:["Registered Nurse","Midwife"],sal:"£25k-£45k",emp:98,on:false,fr:false},
{id:86,t:"MBChB Medicine",inst:"University of Edinburgh",co:"UK",ci:"Edinburgh",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"medicine_health",sub:["medicine","clinical","anatomy","surgery"],fH:9250,fI:34800,liv:12000,dur:"6 years",rank:15,en:"AAA + UCAT. Graduate entry (4yr) available for mature students with any degree.",car:["Doctor","Surgeon","GP"],sal:"£30k-£100k+",emp:99,on:false,fr:false},
{id:87,t:"BSc Psychology",inst:"University of Amsterdam",co:"Netherlands",ci:"Amsterdam",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"social_sciences",sub:["psychology","neuroscience","research methods","behavioural science"],fH:2314,fI:12114,liv:14000,dur:"3 years",rank:18,en:"IB 34+ or equivalent. EU/EEA: statutory fee.",car:["Psychologist","Counsellor","Researcher"],sal:"€30k-€55k",emp:82,on:false,fr:false},
{id:88,t:"MSc Public Health",inst:"LSHTM",co:"UK",ci:"London",lev:"postgraduate",mo:["full-time","face-to-face"],dom:"medicine_health",sub:["public health","epidemiology","global health"],fH:12200,fI:26750,liv:18000,dur:"1 year",rank:3,en:"2:1 + experience. Professional experience may substitute for degree.",car:["Public Health Consultant","Epidemiologist"],sal:"£35k-£60k",emp:90,on:false,fr:false},
{id:89,t:"Introduction to Psychology (Free)",inst:"Yale (Coursera)",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"social_sciences",sub:["psychology","neuroscience","behavioural science"],fH:0,fI:0,liv:0,dur:"6 weeks",rank:1,en:"None. Free to audit.",car:["Foundation for degree"],sal:"N/A",emp:20,on:true,fr:true},
// LAW (5)
{id:90,t:"LLB Law",inst:"UCL",co:"UK",ci:"London",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"law",sub:["law","criminal law","constitutional law","human rights"],fH:9250,fI:28500,liv:18000,dur:"3 years",rank:8,en:"A*AA. Access accepted. Mature: CILEX route also available.",car:["Solicitor","Barrister"],sal:"£30k-£100k+",emp:90,on:false,fr:false},
{id:91,t:"LLB Law (English-taught)",inst:"Maastricht University",co:"Netherlands",ci:"Maastricht",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"law",sub:["law","EU law","international law","human rights"],fH:2314,fI:11160,liv:11000,dur:"3 years",rank:0,en:"Diploma or equivalent. Problem-based learning. EU/EEA: statutory fee.",car:["EU Lawyer","International Legal Advisor"],sal:"€35k-€65k",emp:80,on:false,fr:false},
{id:92,t:"Criminology & Law",inst:"University of Sheffield",co:"UK",ci:"Sheffield",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"law",sub:["law","criminology","criminal justice","sociology"],fH:9250,fI:21450,liv:10000,dur:"3 years",rank:12,en:"AAB. BTEC DDM. Access accepted. Mature welcome.",car:["Solicitor","Probation Officer"],sal:"£25k-£50k",emp:82,on:false,fr:false},
{id:93,t:"LLB Law",inst:"University of Amsterdam",co:"Netherlands",ci:"Amsterdam",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"law",sub:["law","international law","EU law","human rights"],fH:2314,fI:11160,liv:14000,dur:"3 years",rank:50,en:"Diploma or equivalent. EU/EEA: statutory fee.",car:["International Lawyer","Legal Advisor"],sal:"€35k-€65k",emp:82,on:false,fr:false},
{id:94,t:"Understanding Law (Free Online)",inst:"FutureLearn",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"law",sub:["law","legal studies","human rights","criminal law"],fH:0,fI:0,liv:0,dur:"8 weeks",rank:0,en:"None. Free.",car:["Foundation for LLB"],sal:"N/A",emp:15,on:true,fr:true},
// HUMANITIES & SOCIAL SCIENCES (8)
{id:95,t:"BA History",inst:"University of Glasgow",co:"Scotland",ci:"Glasgow",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"humanities",sub:["history","politics","social science","research"],fH:1820,fI:22000,fS:9250,liv:10500,dur:"4 years",rank:76,en:"ABB. Access accepted. Scottish: FREE via SAAS.",car:["Historian","Museum Curator","Teacher"],sal:"£24k-£40k",emp:75,on:false,fr:false},
{id:96,t:"BA International Relations",inst:"Sciences Po Paris",co:"France",ci:"Paris",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"social_sciences",sub:["international relations","politics","economics","diplomacy"],fH:0,fI:13190,liv:16000,dur:"3 years",rank:3,en:"Baccalauréat + exam. Means-tested fees for French/EU.",car:["Diplomat","Policy Analyst"],sal:"€35k-€70k",emp:84,on:false,fr:false},
{id:97,t:"BA PPE",inst:"University of Oxford",co:"UK",ci:"Oxford",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"social_sciences",sub:["philosophy","politics","economics"],fH:9250,fI:29700,liv:14000,dur:"3 years",rank:1,en:"AAA.",car:["Political Adviser","Civil Servant","Consultant"],sal:"£30k-£65k",emp:88,on:false,fr:false},
{id:98,t:"BA Philosophy",inst:"Humboldt University Berlin",co:"Germany",ci:"Berlin",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"humanities",sub:["philosophy","ethics","logic","political philosophy"],fH:0,fI:0,liv:11000,dur:"3 years",rank:50,en:"HZB or equivalent. No tuition fees (any nationality).",car:["Philosopher","Policy Analyst","Teacher"],sal:"€30k-€50k",emp:68,on:false,fr:true},
{id:99,t:"BA Liberal Arts & Sciences",inst:"University College Utrecht",co:"Netherlands",ci:"Utrecht",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"humanities",sub:["humanities","social science","science","philosophy","politics"],fH:2314,fI:11160,liv:12000,dur:"3 years",rank:0,en:"IB 32+ or equivalent. EU/EEA: statutory fee.",car:["Consultant","Civil Servant","Various"],sal:"€30k-€50k",emp:78,on:false,fr:false},
{id:100,t:"BA Archaeology",inst:"Durham University",co:"UK",ci:"Durham",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"humanities",sub:["archaeology","history","anthropology","excavation"],fH:9250,fI:24500,liv:10000,dur:"3 years",rank:3,en:"AAB. Access accepted. Mature welcome — fieldwork experience valued.",car:["Archaeologist","Museum Curator","Heritage Officer"],sal:"£22k-£38k",emp:70,on:false,fr:false},
{id:101,t:"BA Sociology",inst:"University of Cambridge",co:"UK",ci:"Cambridge",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"social_sciences",sub:["sociology","social science","research methods"],fH:9250,fI:25000,liv:13000,dur:"3 years",rank:2,en:"A*AA. Access accepted.",car:["Social Researcher","Policy Analyst","HR"],sal:"£24k-£42k",emp:78,on:false,fr:false},
{id:102,t:"Humanities courses (Free)",inst:"Khan Academy / MIT OCW",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"humanities",sub:["history","philosophy","economics","humanities"],fH:0,fI:0,liv:0,dur:"Self-paced",rank:0,en:"None. Completely free.",car:["Self-improvement"],sal:"N/A",emp:15,on:true,fr:true},
// EDUCATION (4)
{id:103,t:"BEd Education",inst:"University of Cambridge",co:"UK",ci:"Cambridge",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"education",sub:["education","teaching","pedagogy","child development"],fH:9250,fI:25000,liv:13000,dur:"3 years",rank:2,en:"A*AA. Access accepted.",car:["Teacher","Education Consultant"],sal:"£25k-£50k",emp:92,on:false,fr:false},
{id:104,t:"PGCE Secondary",inst:"University of Manchester",co:"UK",ci:"Manchester",lev:"postgraduate",mo:["full-time","face-to-face"],dom:"education",sub:["teaching","education","PGCE","pedagogy"],fH:9250,fI:20000,liv:11000,dur:"1 year",rank:0,en:"2:2+ in relevant subject. No upper age limit. Career changers welcome. Salaried School Direct routes also available.",car:["Secondary Teacher"],sal:"£25k-£50k",emp:95,on:false,fr:false},
{id:105,t:"MA TESOL",inst:"University of Nottingham",co:"UK",ci:"Nottingham",lev:"postgraduate",mo:["full-time","face-to-face"],dom:"education",sub:["TESOL","education","linguistics"],fH:10800,fI:22600,liv:10000,dur:"1 year",rank:0,en:"2:1. Professional teaching experience may substitute.",car:["EFL Teacher","TESOL Trainer"],sal:"£24k-£45k",emp:85,on:false,fr:false},
{id:106,t:"TESOL (Free Online)",inst:"Arizona State (Coursera)",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"education",sub:["TESOL","teaching","english"],fH:0,fI:0,liv:0,dur:"6 months",rank:0,en:"None. Free to audit.",car:["EFL Teacher"],sal:"£18k-£35k",emp:70,on:true,fr:true},
// ARCHITECTURE (3)
{id:107,t:"BSc Architecture",inst:"Politecnico di Milano",co:"Italy",ci:"Milan",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"architecture",sub:["architecture","design","urban planning","sustainability"],fH:3900,fI:3900,liv:12000,dur:"3 years",rank:10,en:"Diploma + entrance test. Same fees EU & non-EU.",car:["Architect","Urban Planner"],sal:"€30k-€60k",emp:86,on:false,fr:false},
{id:108,t:"BA Architecture",inst:"University of Bath",co:"UK",ci:"Bath",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"architecture",sub:["architecture","design","structural engineering"],fH:9250,fI:22000,liv:11500,dur:"4 years",rank:1,en:"A*AA. Foundation year available.",car:["Architect","Urban Designer"],sal:"£25k-£50k",emp:88,on:false,fr:false},
{id:109,t:"MArch",inst:"Bartlett (UCL)",co:"UK",ci:"London",lev:"postgraduate",mo:["full-time","face-to-face"],dom:"architecture",sub:["architecture","design","digital fabrication"],fH:13200,fI:34100,liv:18000,dur:"2 years",rank:3,en:"2:1 + portfolio + RIBA Part 1.",car:["Architect","Design Lead"],sal:"£32k-£60k",emp:90,on:false,fr:false},
// SPORT/HOSP/AGRI (5)
{id:110,t:"BSc Sport & Exercise Science",inst:"Loughborough",co:"UK",ci:"Loughborough",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"sports",sub:["sport science","exercise science","physiology"],fH:9250,fI:27250,liv:9500,dur:"3 years",rank:1,en:"AAA.",car:["Sports Scientist","PE Teacher"],sal:"£24k-£40k",emp:80,on:false,fr:false},
{id:111,t:"BSc Hospitality Management",inst:"University of Surrey",co:"UK",ci:"Guildford",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"hospitality_tourism",sub:["hospitality","hotel management","tourism","event management"],fH:9250,fI:22000,liv:11000,dur:"4 years",rank:1,en:"ABB. BTEC accepted. Mature: industry experience valued.",car:["Hotel Manager","Event Manager"],sal:"£24k-£45k",emp:82,on:false,fr:false},
{id:112,t:"BBA Hotel Management",inst:"EHL Lausanne",co:"Switzerland",ci:"Lausanne",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"hospitality_tourism",sub:["hospitality","hotel management","business","luxury"],fH:42000,fI:42000,liv:18000,dur:"4 years",rank:1,en:"IB or equivalent + interview.",car:["Hotel GM","Luxury Brand Manager"],sal:"CHF 70k-120k",emp:92,on:false,fr:false},
{id:113,t:"BSc Agriculture",inst:"University of Reading",co:"UK",ci:"Reading",lev:"undergraduate",mo:["full-time","face-to-face"],dom:"agriculture_environment",sub:["agriculture","farming","food science","sustainability"],fH:9250,fI:23700,liv:11000,dur:"3 years",rank:1,en:"ABB. BTEC DDM. Mature: relevant work experience considered.",car:["Agricultural Manager","Agronomist"],sal:"£24k-£42k",emp:88,on:false,fr:false},
{id:114,t:"MSc Conservation Science",inst:"Imperial College London",co:"UK",ci:"London",lev:"postgraduate",mo:["full-time","face-to-face"],dom:"agriculture_environment",sub:["conservation","ecology","biodiversity","sustainability"],fH:15200,fI:34000,liv:18000,dur:"1 year",rank:6,en:"2:1 in biological/environmental science.",car:["Conservation Scientist","Biodiversity Officer"],sal:"£28k-£48k",emp:80,on:false,fr:false},
// GENERAL ONLINE (5)
{id:115,t:"MIT OpenCourseWare (Free)",inst:"MIT",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"computer_science",sub:["engineering","computer science","physics","mathematics"],fH:0,fI:0,liv:0,dur:"Self-paced",rank:1,en:"None. Completely free.",car:["Various"],sal:"Varies",emp:60,on:true,fr:true},
{id:116,t:"Open University Degrees",inst:"The Open University",co:"UK",ci:"Online",lev:"undergraduate",mo:["part-time","online"],dom:"education",sub:["arts","science","technology","business","health","education","law"],fH:6952,fI:6952,liv:0,dur:"3-6 years",rank:0,en:"NO formal qualifications required. Designed for mature students, career changers, and those without A-Levels.",car:["Various"],sal:"Varies",emp:75,on:true,fr:false},
{id:117,t:"FutureLearn Microcredentials",inst:"FutureLearn / Various",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"education",sub:["business","healthcare","technology","education","creative arts"],fH:600,fI:600,liv:0,dur:"10-16 weeks",rank:0,en:"Varies. Many free.",car:["Various"],sal:"Varies",emp:65,on:true,fr:false},
{id:118,t:"edX MicroMasters",inst:"edX / Various",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"computer_science",sub:["AI","data science","business","management"],fH:800,fI:800,liv:0,dur:"6-12 months",rank:0,en:"Varies. Can count towards Master's.",car:["Various"],sal:"Varies",emp:65,on:true,fr:false},
{id:119,t:"Khan Academy (Free)",inst:"Khan Academy",co:"Online",ci:"Online",lev:"certificate",mo:["part-time","online"],dom:"education",sub:["mathematics","science","computing","economics","humanities"],fH:0,fI:0,liv:0,dur:"Self-paced",rank:0,en:"None. Free. All ages.",car:["Self-improvement"],sal:"N/A",emp:30,on:true,fr:true},
];

const SAMPLE_COURSES=C.map(c=>({id:c.id,title:c.t,institution:c.inst,country:c.co,city:c.ci,level:c.lev,mode:c.mo,domain:c.dom,subjects:c.sub,feeHome:c.fH,feeIntl:c.fI,fS:c.fS||null,livingCost:c.liv,duration:c.dur,ranking:c.rank,entryReqs:c.en,careerPaths:c.car,avgSalary:c.sal,employability:c.emp,online:c.on,free:c.fr}));
// ─── MATCHING ALGORITHM ──────────────────────────────────────────────────────
function tokenise(text) {
  if (!text) return [];
  const lower = text.toLowerCase().replace(/[^\w\s,;.'-]/g, " ");
  const knownPhrases = [];
  const allPhrases = Object.values(DOMAIN_FAMILIES).flat();
  let remaining = lower;
  for (const phrase of allPhrases.sort((a,b) => b.length - a.length)) {
    if (remaining.includes(phrase)) { knownPhrases.push(phrase); remaining = remaining.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'), " "); }
  }
  const stop = new Set(["i","a","an","the","and","or","of","in","to","for","is","my","me","it","at","on","with","but","as","be","by","so","if","am","are","was","do","not","no","like","want","would","could","also","very","really","quite","some","any","that","this","about","into","from","have","has","had","been","will","can","may","course","study","degree","programme","program","university","college"]);
  const words = remaining.split(/[\s,;.]+/).filter(w => w.length > 2 && !stop.has(w));
  return [...new Set([...knownPhrases, ...words])];
}

function identifyPrimaryDomain(tokens) {
  const scores = {};
  for (const [dom, kws] of Object.entries(DOMAIN_FAMILIES)) {
    let s = 0;
    for (const t of tokens) for (const k of kws) {
      if (t === k) s += 3;
      else if ((k.includes(t) || t.includes(k)) && Math.min(t.length,k.length) > 3) s += 1.5;
    }
    if (s > 0) scores[dom] = s;
  }
  const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]);
  if (!sorted.length) return { primary:null, secondary:[], scores:{} };
  return { primary:sorted[0][0], secondary:sorted.slice(1).filter(([_,s]) => s >= sorted[0][1]*0.4).map(([d]) => d), scores };
}

function calculateMatch(course, profile) {
  const subTok = tokenise(profile.subjects), intTok = tokenise(profile.interests), sklTok = tokenise(profile.skills);
  const dom = identifyPrimaryDomain(subTok);
  let domScore = 0;
  if (dom.primary) {
    if (course.domain === dom.primary) domScore = 55;
    else if (dom.secondary.includes(course.domain)) domScore = 28;
    else { const x = course.subjects.filter(s => subTok.some(t => s.includes(t) || t.includes(s))).length; domScore = Math.min(10, x*2.5); }
  } else {
    const h = course.subjects.filter(s => subTok.some(t => s.includes(t) || t.includes(s))).length;
    domScore = Math.min(55, (h/Math.max(course.subjects.length,1))*55);
  }
  let kwScore = 0;
  if (subTok.length) { const cs = course.subjects.join(" ")+" "+course.title.toLowerCase(); const h = subTok.filter(t => cs.includes(t)).length; kwScore = Math.min(15,(h/subTok.length)*15); }
  let enScore = 0;
  const sec = [...intTok,...sklTok];
  if (sec.length) { const cs = (course.subjects.join(" ")+" "+course.careerPaths.join(" ")).toLowerCase(); const h = sec.filter(t => cs.includes(t)).length; enScore = Math.min(8,(h/sec.length)*8); }
  let lvScore = (!profile.level||profile.level==="any")?5:(course.level===profile.level?7:0);
  let moScore = (!profile.modes||!profile.modes.length)?3:(profile.modes.some(m => course.mode.includes(m))?5:0);
  let loScore = 3;
  if (profile.locations) { const lt = tokenise(profile.locations); const cl = (course.country+" "+course.city).toLowerCase(); if (lt.length && lt.some(t => cl.includes(t))) loScore = 5; else if (lt.length) loScore = 0; }
  let prScore = 0;
  if (profile.searchFree && course.free) prScore += 3; else if (!profile.searchFree) prScore += 1.5;
  if (profile.searchOnline && course.online) prScore += 2; else if (!profile.searchOnline && !course.online) prScore += 2; else prScore += 0.5;
  return Math.min(99, Math.round(domScore+kwScore+enScore+lvScore+moScore+loScore+prScore));
}

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const P = { midnight:"#0B1426",navy:"#132042",deep:"#1A2A55",accent:"#3B82F6",accentLight:"#60A5FA",accentGlow:"#93C5FD",gold:"#F59E0B",goldLight:"#FCD34D",surface:"#1E293B",surfaceLight:"#334155",text:"#F1F5F9",textMuted:"#94A3B8",textDim:"#64748B",success:"#10B981",danger:"#EF4444",white:"#FFFFFF" };
const iS = { width:"100%", padding:"12px 16px", fontSize:14, fontFamily:"'Georgia',serif", background:P.surface, border:`1px solid ${P.surfaceLight}`, borderRadius:10, color:P.text, outline:"none" };
const cS = { padding:"10px 14px", fontSize:13, fontFamily:"'Trebuchet MS',sans-serif", fontWeight:600, cursor:"pointer", borderRadius:10, border:`1px solid ${P.surfaceLight}`, background:P.surface, color:P.textMuted, transition:"all 0.2s" };
const cA = { background:`${P.accent}20`, border:`1px solid ${P.accent}`, color:P.accentLight };

// ─── COURSE EXPLORER SUBPAGE ─────────────────────────────────────────────────
function CourseExplorer({course, profile, onBack, onSelectAlt, allCourses}) {
  const [tab, setTab] = useState("costs");
  const inst = INST_DATA[course.institution] || {};
  const col = COL[course.city] || null;
  const fs = course.feeStatus;
  const fee = getFee(course, fs);
  const freeAlts = allCourses.filter(c => c.free && c.online && c.domain === course.domain && c.id !== course.id);
  const tabStyle = (active) => ({padding:"10px 18px",fontSize:13,fontFamily:"'Trebuchet MS',sans-serif",fontWeight:600,cursor:"pointer",borderRadius:"8px 8px 0 0",border:"none",background:active?P.surface:"transparent",color:active?P.accentLight:P.textDim,transition:"all 0.2s"});

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${P.midnight},${P.navy})`,fontFamily:"'Georgia',serif",color:P.text}}>
      <div style={{maxWidth:900,margin:"0 auto",padding:"32px 20px"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:P.textDim,fontSize:14,cursor:"pointer",fontFamily:"'Trebuchet MS',sans-serif",marginBottom:16}}>← Back to results</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16,marginBottom:24}}>
          <div>
            <h1 style={{fontSize:24,fontWeight:600,margin:0,fontFamily:"'Trebuchet MS',sans-serif"}}>{course.title}</h1>
            <p style={{color:P.textMuted,fontSize:15,margin:"4px 0 0"}}>{inst.full||course.institution}</p>
            <p style={{color:P.textDim,fontSize:12,margin:"4px 0 0"}}>{course.city}, {course.country} • {course.duration} • {course.level}</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <a href={getCourseUrl(course)} target="_blank" rel="noopener noreferrer" style={{padding:"10px 20px",borderRadius:8,background:`linear-gradient(135deg,${P.accent},#2563EB)`,color:P.white,fontSize:13,fontWeight:600,textDecoration:"none",fontFamily:"'Trebuchet MS',sans-serif"}}>Apply / Course Page →</a>
            {inst.url&&<a href={inst.url} target="_blank" rel="noopener noreferrer" style={{padding:"10px 20px",borderRadius:8,background:P.surface,border:`1px solid ${P.surfaceLight}`,color:P.accentLight,fontSize:13,textDecoration:"none",fontFamily:"'Trebuchet MS',sans-serif"}}>University Website</a>}
          </div>
        </div>

        {/* TAB BAR */}
        <div style={{display:"flex",gap:4,borderBottom:`2px solid ${P.surfaceLight}`,marginBottom:0}}>
          {[{k:"costs",l:"💰 Costs & Living"},{k:"inst",l:"🏛️ Institution"},{k:"prep",l:"📚 Preparation"},{k:"map",l:"📍 Location & Map"},{k:"support",l:"🤝 Support"}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} style={tabStyle(tab===t.k)}>{t.l}</button>
          ))}
        </div>
        <div style={{background:P.surface,borderRadius:"0 0 12px 12px",padding:24,minHeight:400}}>

          {/* COSTS TAB */}
          {tab==="costs"&&(<div>
            <h3 style={{fontSize:18,fontWeight:600,margin:"0 0 16px",fontFamily:"'Trebuchet MS',sans-serif"}}>Cost Breakdown for {profile.nationality} Students</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
              <div style={{padding:16,borderRadius:10,background:`${P.navy}`,border:`1px solid ${P.surfaceLight}`}}>
                <div style={{fontSize:11,color:P.textDim,textTransform:"uppercase",letterSpacing:1}}>Tuition Fee/yr ({fs==="ruk"?"rest-of-UK":fs})</div>
                <div style={{fontSize:24,fontWeight:700,color:P.goldLight,fontFamily:"'Trebuchet MS',sans-serif"}}>{fee===0?"FREE":"£"+fee.toLocaleString()}</div>
              </div>
              <div style={{padding:16,borderRadius:10,background:`${P.navy}`,border:`1px solid ${P.surfaceLight}`}}>
                <div style={{fontSize:11,color:P.textDim,textTransform:"uppercase",letterSpacing:1}}>Est. Total Cost ({course.duration})</div>
                <div style={{fontSize:24,fontWeight:700,color:P.goldLight,fontFamily:"'Trebuchet MS',sans-serif"}}>{(()=>{const y=parseInt(course.duration)||1;const t=(fee+(course.livingCost||0))*y;return t===0?"FREE":"£"+t.toLocaleString();})()}</div>
              </div>
            </div>
            {col?(<div>
              <h4 style={{fontSize:15,fontWeight:600,margin:"0 0 12px",fontFamily:"'Trebuchet MS',sans-serif"}}>Monthly Living Costs in {course.city}</h4>
              <div style={{fontSize:12,color:P.textDim,marginBottom:12}}>{col.note}</div>
              <div style={{display:"grid",gap:8}}>
                {[{l:"🏠 Rent (1-bed/studio)",v:col.rent},{l:"🛒 Food & Groceries",v:col.food},{l:"🚌 Transport",v:col.transport},{l:"💡 Utilities (elec/gas/water/internet)",v:col.utils},{l:"🎭 Misc (social/clothes/books)",v:col.misc}].map((r,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",borderRadius:8,background:`${P.navy}80`}}>
                    <span style={{fontSize:14}}>{r.l}</span>
                    <span style={{fontSize:14,fontWeight:700,color:P.accentLight,fontFamily:"'Trebuchet MS',sans-serif"}}>{col.currency}{r.v.toLocaleString()}/mo</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",padding:"12px 14px",borderRadius:8,background:`${P.accent}15`,border:`1px solid ${P.accent}30`}}>
                  <span style={{fontSize:14,fontWeight:700}}>Monthly Total</span>
                  <span style={{fontSize:16,fontWeight:700,color:P.gold,fontFamily:"'Trebuchet MS',sans-serif"}}>{col.currency}{(col.rent+col.food+col.transport+col.utils+col.misc).toLocaleString()}/mo</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"12px 14px",borderRadius:8,background:`${P.gold}10`,border:`1px solid ${P.gold}25`}}>
                  <span style={{fontSize:14,fontWeight:700}}>Annual Living Cost</span>
                  <span style={{fontSize:16,fontWeight:700,color:P.goldLight,fontFamily:"'Trebuchet MS',sans-serif"}}>{col.currency}{((col.rent+col.food+col.transport+col.utils+col.misc)*12).toLocaleString()}/yr</span>
                </div>
              </div>
              <div style={{marginTop:16,fontSize:12,color:P.textDim,lineHeight:1.5}}>Sources: <a href="https://www.numbeo.com/cost-of-living/" target="_blank" rel="noopener noreferrer" style={{color:P.accentLight}}>Numbeo</a> • <a href="https://www.expatistan.com/cost-of-living/" target="_blank" rel="noopener noreferrer" style={{color:P.accentLight}}>Expatistan</a> • <a href="https://livingcost.org/cost" target="_blank" rel="noopener noreferrer" style={{color:P.accentLight}}>LivingCost.org</a> • Student union surveys. Figures are estimates — verify locally.</div>
            </div>):(<div style={{padding:20,borderRadius:10,background:`${P.gold}10`,fontSize:13,color:P.goldLight}}>Cost of living data not yet available for {course.city}. Check <a href={`https://www.numbeo.com/cost-of-living/in/${encodeURIComponent(course.city)}`} target="_blank" rel="noopener noreferrer" style={{color:P.accentLight}}>Numbeo</a> for estimates.</div>)}
            {/* FUNDING */}
            <h4 style={{fontSize:15,fontWeight:600,margin:"24px 0 12px",fontFamily:"'Trebuchet MS',sans-serif"}}>Funding Sources</h4>
            <div style={{display:"grid",gap:6}}>{getFund(course.country,fs,profile.nationality).map((f,i)=>(<a key={i} href={f.u} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"8px 12px",borderRadius:6,background:`${P.navy}80`,display:"block",lineHeight:1.4}}>🔗 {f.t}</a>))}</div>
            {/* FREE ALTS */}
            {freeAlts.length>0&&(<div style={{marginTop:20}}><h4 style={{fontSize:15,fontWeight:600,margin:"0 0 8px",fontFamily:"'Trebuchet MS',sans-serif",color:P.success}}>💡 Free Online Alternatives</h4><div style={{display:"grid",gap:8}}>{freeAlts.map(a=>(<div key={a.id} onClick={()=>onSelectAlt(a)} style={{padding:"10px 14px",borderRadius:8,background:`${P.navy}80`,cursor:"pointer"}}><div style={{fontSize:14,fontWeight:600,fontFamily:"'Trebuchet MS',sans-serif"}}>{a.title} <span style={{color:P.success,fontSize:11}}>FREE</span></div><div style={{fontSize:12,color:P.textMuted}}>{a.institution} • {a.duration}</div></div>))}</div></div>)}
          </div>)}

          {/* INSTITUTION TAB */}
          {tab==="inst"&&(<div>
            <h3 style={{fontSize:18,fontWeight:600,margin:"0 0 16px",fontFamily:"'Trebuchet MS',sans-serif"}}>About {inst.full||course.institution}</h3>
            {inst.desc&&<p style={{fontSize:14,lineHeight:1.7,marginBottom:16}}>{inst.desc}</p>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              {[inst.type&&{l:"Type",v:inst.type},inst.founded&&{l:"Founded",v:inst.founded},{l:"Location",v:`${course.city}, ${course.country}`},inst.students&&{l:"Students",v:inst.students.toLocaleString()}].filter(Boolean).map((x,i)=>(
                <div key={i} style={{padding:12,borderRadius:8,background:`${P.navy}80`}}><div style={{fontSize:11,color:P.textDim,textTransform:"uppercase"}}>{x.l}</div><div style={{fontSize:14,fontWeight:600,marginTop:2}}>{x.v}</div></div>
              ))}
            </div>
            <div style={{display:"grid",gap:8}}>
              {inst.url&&<a href={inst.url} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🌐 University Website: {inst.url}</a>}
              {inst.apply&&<a href={inst.apply} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>📝 Apply / Course Finder</a>}
              {inst.contact&&<div style={{fontSize:13,color:P.text,padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>📧 Contact: <a href={`mailto:${inst.contact}`} style={{color:P.accentLight}}>{inst.contact}</a></div>}
              {(course.country==="UK"||course.country==="Scotland")&&<a href="https://discoveruni.gov.uk/" target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>📊 DiscoverUni — official UK course data & student satisfaction</a>}
              <a href={`https://www.topuniversities.com/universities/${encodeURIComponent((inst.full||course.institution).toLowerCase().replace(/\s+/g,'-'))}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🏆 QS World University Rankings Profile</a>
              <a href={`https://www.timeshighereducation.com/world-university-rankings`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>📈 THE World University Rankings</a>
            </div>
          </div>)}

          {/* PREPARATION TAB */}
          {tab==="prep"&&(<div>
            <h3 style={{fontSize:18,fontWeight:600,margin:"0 0 16px",fontFamily:"'Trebuchet MS',sans-serif"}}>Preparing for {course.title}</h3>
            <div style={{padding:16,borderRadius:10,background:`${P.navy}80`,marginBottom:16}}>
              <h4 style={{fontSize:14,fontWeight:600,margin:"0 0 8px",fontFamily:"'Trebuchet MS',sans-serif"}}>Entry Requirements</h4>
              <p style={{fontSize:14,lineHeight:1.7,margin:0}}>{course.entryReqs}</p>
            </div>
            <h4 style={{fontSize:14,fontWeight:600,margin:"0 0 8px",fontFamily:"'Trebuchet MS',sans-serif"}}>📖 Recommended Preparation</h4>
            <div style={{display:"grid",gap:8,marginBottom:20}}>
              <a href={`https://www.coursera.org/search?query=${encodeURIComponent(course.subjects.slice(0,3).join(" "))}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🎓 Coursera — search "{course.subjects.slice(0,3).join(", ")}" introductory courses</a>
              <a href={`https://www.edx.org/search?q=${encodeURIComponent(course.subjects.slice(0,2).join(" "))}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🎓 edX — search "{course.subjects.slice(0,2).join(", ")}" free courses</a>
              <a href={`https://www.futurelearn.com/search?q=${encodeURIComponent(course.subjects[0])}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🎓 FutureLearn — "{course.subjects[0]}" short courses</a>
              <a href={`https://www.khanacademy.org/search?search_again=1&page_search_query=${encodeURIComponent(course.subjects[0])}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>📚 Khan Academy — free foundational learning</a>
              <a href={`https://www.google.com/search?q=best+books+for+studying+${encodeURIComponent(course.subjects.slice(0,2).join("+"))}+at+university`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>📚 Recommended reading lists for {DL[course.domain]||"this subject"}</a>
              {(course.country==="UK"||course.country==="Scotland")&&<a href="https://nationalcareers.service.gov.uk/find-a-course" target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🇬🇧 National Careers Service — find preparatory courses in England</a>}
              {course.level==="undergraduate"&&<a href="https://www.accesstohe.ac.uk/" target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🎓 Access to Higher Education Diplomas — alternative entry route</a>}
            </div>
            <h4 style={{fontSize:14,fontWeight:600,margin:"0 0 8px",fontFamily:"'Trebuchet MS',sans-serif"}}>🎯 Career Pathways</h4>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{course.careerPaths.map((c,i)=>(<span key={i} style={{padding:"6px 14px",borderRadius:20,background:`${P.accent}20`,border:`1px solid ${P.accent}30`,fontSize:12,color:P.accentLight}}>{c}</span>))}</div>
            <div style={{fontSize:14,fontWeight:600,color:P.success}}>{course.avgSalary} expected salary • {course.employability}% employability</div>
          </div>)}

          {/* MAP TAB */}
          {tab==="map"&&(<div>
            <h3 style={{fontSize:18,fontWeight:600,margin:"0 0 16px",fontFamily:"'Trebuchet MS',sans-serif"}}>Location: {course.city}, {course.country}</h3>
            {inst.lat&&inst.lng?(
              <div style={{marginBottom:16}}>
                <iframe title="map" width="100%" height="350" frameBorder="0" style={{borderRadius:12,border:`1px solid ${P.surfaceLight}`}} src={`https://www.openstreetmap.org/export/embed.html?bbox=${inst.lng-0.02},${inst.lat-0.015},${inst.lng+0.02},${inst.lat+0.015}&layer=mapnik&marker=${inst.lat},${inst.lng}`} />
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <a href={`https://www.google.com/maps/search/${encodeURIComponent(inst.full||course.institution)}`} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:P.accentLight,padding:"6px 12px",borderRadius:6,background:`${P.navy}80`,textDecoration:"none"}}>Open in Google Maps</a>
                  <a href={`https://www.openstreetmap.org/?mlat=${inst.lat}&mlon=${inst.lng}#map=15/${inst.lat}/${inst.lng}`} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:P.accentLight,padding:"6px 12px",borderRadius:6,background:`${P.navy}80`,textDecoration:"none"}}>Open in OpenStreetMap</a>
                </div>
              </div>
            ):(<div style={{padding:20,borderRadius:10,background:`${P.navy}80`,marginBottom:16,textAlign:"center"}}><a href={`https://www.google.com/maps/search/${encodeURIComponent((inst.full||course.institution)+" "+course.city)}`} target="_blank" rel="noopener noreferrer" style={{color:P.accentLight,fontSize:14}}>📍 View {inst.full||course.institution} on Google Maps</a></div>)}
            <h4 style={{fontSize:14,fontWeight:600,margin:"0 0 8px",fontFamily:"'Trebuchet MS',sans-serif"}}>🏙️ Area Guides</h4>
            <div style={{display:"grid",gap:8}}>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(course.city+" student area guide")}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🔍 {course.city} student area guide</a>
              <a href={`https://www.numbeo.com/cost-of-living/in/${encodeURIComponent(course.city)}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>💰 Numbeo — {course.city} cost of living index</a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(course.city+" student accommodation")}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🏠 Student accommodation in {course.city}</a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(course.city+" public transport student")}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🚌 Public transport in {course.city}</a>
              {(course.country==="UK"||course.country==="Scotland")&&<a href={`https://www.studentcrowd.com/best-cities-s1008?q=${encodeURIComponent(course.city)}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>⭐ StudentCrowd — {course.city} student reviews</a>}
            </div>
          </div>)}

          {/* SUPPORT TAB */}
          {tab==="support"&&(<div>
            <h3 style={{fontSize:18,fontWeight:600,margin:"0 0 16px",fontFamily:"'Trebuchet MS',sans-serif"}}>Student Support Resources</h3>
            <div style={{display:"grid",gap:10}}>
              {inst.contact&&<div style={{padding:14,borderRadius:8,background:`${P.navy}80`}}><div style={{fontSize:11,color:P.textDim,textTransform:"uppercase"}}>Admissions Contact</div><a href={`mailto:${inst.contact}`} style={{fontSize:14,color:P.accentLight,textDecoration:"none"}}>{inst.contact}</a></div>}
              {inst.url&&<a href={inst.url+"/student-life"} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🎒 Student life at {course.institution}</a>}
              <a href={`https://www.google.com/search?q=${encodeURIComponent(course.institution+" student support services")}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🤝 Student support services</a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(course.institution+" students union")}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🗳️ Students' Union</a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(course.institution+" international students office")}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🌍 International Students Office</a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(course.institution+" disability support")}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>♿ Disability & Accessibility Support</a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(course.institution+" mental health counselling")}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>💚 Mental Health & Counselling</a>
              {course.country==="UK"&&<a href="https://www.studentminds.org.uk/" target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>💚 Student Minds — UK student mental health charity</a>}
              <a href={`https://www.google.com/search?q=${encodeURIComponent(course.city+" GP doctor register student")}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🏥 Register with a doctor/GP in {course.city}</a>
              {course.country!=="UK"&&course.country!=="Scotland"&&course.country!=="Online"&&<a href={`https://www.google.com/search?q=${encodeURIComponent(course.country+" student visa requirements")}`} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:P.accentLight,textDecoration:"none",padding:"10px 14px",borderRadius:6,background:`${P.navy}80`}}>🛂 Visa requirements for {course.country}</a>}
            </div>
          </div>)}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ name:"",nationality:"",residence:"",ukNation:"",subjects:"",level:"",modes:[],interests:"",skills:"",learningStyle:"",locations:"",extraCurricular:"",searchGlobal:false,searchOnline:false,searchFree:false });
  const [results, setResults] = useState([]);
  const [sel, setSel] = useState(null);
  const [explorer, setExplorer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("match");
  const [showFreeAlts, setShowFreeAlts] = useState(false);
  const totalSteps = 7;
  const up = (k,v) => setProfile(p => ({...p,[k]:v}));
  const togMode = m => setProfile(p => ({...p,modes:p.modes.includes(m)?p.modes.filter(x=>x!==m):[...p.modes,m]}));
  const dName = profile.name.trim() ? profile.name.trim().split(/\s+/)[0] : "Student";
  const fmtFee = a => a===0?"FREE":`£${a.toLocaleString()}`;

  const gen = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const scored = SAMPLE_COURSES.map(c => ({...c, matchPercent:calculateMatch(c,profile), feeStatus:detFeeStatus(profile.nationality,profile.residence,c.country,profile.ukNation)}));
      scored.sort((a,b) => b.matchPercent - a.matchPercent);
      setResults(scored.slice(0,30)); setLoading(false); setStep(8);
    }, 2400);
  }, [profile]);

  const sorted = [...results].sort((a,b) => {
    if (sortBy==="match") return b.matchPercent-a.matchPercent;
    if (sortBy==="fee-low") return getFee(a,a.feeStatus)-getFee(b,b.feeStatus);
    if (sortBy==="fee-high") return getFee(b,b.feeStatus)-getFee(a,a.feeStatus);
    if (sortBy==="ranking") return (a.ranking||999)-(b.ranking||999);
    if (sortBy==="employability") return b.employability-a.employability;
    return 0;
  });

  // ── COURSE EXPLORER ──
  if (explorer) return (
    <CourseExplorer course={explorer} profile={profile} allCourses={results} onBack={()=>setExplorer(null)} onSelectAlt={(alt)=>setExplorer({...alt,matchPercent:alt.matchPercent||calculateMatch(alt,profile),feeStatus:detFeeStatus(profile.nationality,profile.residence,alt.country,profile.ukNation)})} />
  );

  // ── LANDING ──
  if (step===0) return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${P.midnight},${P.navy} 40%,${P.deep})`,fontFamily:"'Georgia',serif",color:P.text}}>
      <div style={{position:"relative",zIndex:1,maxWidth:860,margin:"0 auto",padding:"60px 24px",textAlign:"center"}}>
        <div style={{position:"absolute",top:-80,right:-120,width:300,height:300,borderRadius:"50%",background:`radial-gradient(circle,${P.accent}15,transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{display:"inline-block",padding:"6px 18px",borderRadius:20,background:`${P.accent}20`,border:`1px solid ${P.accent}40`,fontSize:13,letterSpacing:2,textTransform:"uppercase",color:P.accentLight,marginBottom:28,fontFamily:"'Trebuchet MS',sans-serif"}}>Future Horizons Education</div>
        <h1 style={{fontSize:"clamp(2.2rem,5vw,3.4rem)",fontWeight:400,lineHeight:1.15,margin:"0 0 20px",letterSpacing:"-0.02em"}}>My<span style={{color:P.accent,fontWeight:700}}>Course</span>Matchmaker</h1>
        <p style={{fontSize:"clamp(1rem,2.5vw,1.25rem)",color:P.textMuted,maxWidth:600,margin:"0 auto 12px",lineHeight:1.65}}>Find your perfect course — with detailed cost-of-living data, institution profiles, maps, and preparation guides.</p>
        <p style={{fontSize:14,color:P.textDim,maxWidth:540,margin:"0 auto 40px",lineHeight:1.5}}>{SAMPLE_COURSES.length} courses • {Object.keys(INST_DATA).length} institutions profiled • {Object.keys(COL).length} cities with cost data • Fees by nationality • Clickable funding links</p>
        <button onClick={()=>setStep(1)} style={{display:"inline-flex",alignItems:"center",gap:10,padding:"16px 40px",fontSize:17,fontFamily:"'Trebuchet MS',sans-serif",fontWeight:600,color:P.white,background:`linear-gradient(135deg,${P.accent},#2563EB)`,border:"none",borderRadius:12,cursor:"pointer",boxShadow:`0 4px 24px ${P.accent}40`,transition:"transform 0.2s"}} onMouseOver={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseOut={e=>e.currentTarget.style.transform="translateY(0)"}>Start Matching →</button>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginTop:48}}>
          {[{i:"🎯",l:"Smart Match",d:"Domain-priority algorithm"},{i:"💰",l:"Cost of Living",d:"Rent, food, transport by city"},{i:"🏛️",l:"Institution Profiles",d:"History, contact, rankings"},{i:"📍",l:"Maps & Guides",d:"OpenStreetMap locator"},{i:"📚",l:"Course Prep",d:"Reading lists & online prep"},{i:"🔗",l:"Clickable Links",d:"Apply, funding, support"}].map((f,i)=>(
            <div key={i} style={{padding:14,borderRadius:12,background:`${P.surface}90`,border:`1px solid ${P.surfaceLight}60`,textAlign:"center"}}>
              <div style={{fontSize:22,marginBottom:4}}>{f.i}</div>
              <div style={{fontSize:12,fontWeight:600,fontFamily:"'Trebuchet MS',sans-serif",marginBottom:2}}>{f.l}</div>
              <div style={{fontSize:10,color:P.textDim}}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── LOADING ──
  if (loading) return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${P.midnight},${P.navy})`,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",fontFamily:"'Georgia',serif",color:P.text}}>
      <div style={{width:64,height:64,border:`3px solid ${P.surfaceLight}`,borderTopColor:P.accent,borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:28}}/>
      <h2 style={{fontSize:22,fontWeight:400,margin:"0 0 12px"}}>Analysing your profile, {dName}...</h2>
      <p style={{color:P.textMuted,fontSize:14,textAlign:"center",maxWidth:400}}>Matching courses, calculating fees, gathering cost-of-living data...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── RESULTS ──
  if (step===8) return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${P.midnight},${P.navy})`,fontFamily:"'Georgia',serif",color:P.text}}>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"32px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16,marginBottom:28}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:400,margin:0}}>{dName}'s <span style={{color:P.accent,fontWeight:700}}>Course Matches</span></h1>
            <p style={{color:P.textMuted,fontSize:13,marginTop:4}}>{results.length} courses • {profile.nationality}{profile.ukNation?` (${profile.ukNation})`:""} • Click any course for full explorer with costs, maps & more
              {(()=>{const t=tokenise(profile.subjects),i=identifyPrimaryDomain(t);return i.primary?<span style={{color:P.success}}> • {DL[i.primary]}</span>:null;})()}
            </p>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:"8px 12px",borderRadius:8,background:P.surface,border:`1px solid ${P.surfaceLight}`,color:P.text,fontSize:12,fontFamily:"'Trebuchet MS',sans-serif"}}><option value="match">Best Match</option><option value="fee-low">Lowest Fee</option><option value="fee-high">Highest Fee</option><option value="ranking">Ranking</option><option value="employability">Employability</option></select>
            <button onClick={()=>setShowFreeAlts(!showFreeAlts)} style={{padding:"8px 14px",borderRadius:8,background:showFreeAlts?`${P.success}20`:P.surface,border:`1px solid ${showFreeAlts?P.success+"40":P.surfaceLight}`,color:showFreeAlts?P.success:P.textMuted,fontSize:12,cursor:"pointer",fontFamily:"'Trebuchet MS',sans-serif"}}>{showFreeAlts?"✓ Free Only":"💡 Free"}</button>
            <button onClick={()=>{setStep(1);setResults([]);setSel(null);setShowFreeAlts(false);}} style={{padding:"8px 14px",borderRadius:8,background:`${P.accent}20`,border:`1px solid ${P.accent}40`,color:P.accentLight,fontSize:12,cursor:"pointer",fontFamily:"'Trebuchet MS',sans-serif"}}>← New</button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:24}}>
          {[{l:"Top",v:`${sorted[0]?.matchPercent||0}%`,c:P.success},{l:"Avg",v:`${Math.round(results.reduce((s,r)=>s+r.matchPercent,0)/results.length)}%`,c:P.accent},{l:"Free",v:results.filter(r=>r.free).length,c:P.goldLight},{l:"Online",v:results.filter(r=>r.online).length,c:P.accentGlow},{l:"Countries",v:[...new Set(results.map(r=>r.country))].length,c:P.text}].map((s,i)=>(
            <div key={i} style={{padding:12,borderRadius:10,background:P.surface,border:`1px solid ${P.surfaceLight}`,textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:s.c,fontFamily:"'Trebuchet MS',sans-serif"}}>{s.v}</div><div style={{fontSize:10,color:P.textDim}}>{s.l}</div></div>
          ))}
        </div>
        {showFreeAlts&&<div style={{padding:"10px 16px",borderRadius:10,background:`${P.success}10`,border:`1px solid ${P.success}30`,marginBottom:16,fontSize:12,color:P.success}}>Showing free online courses only</div>}
        <div style={{display:"grid",gap:10}}>
          {(showFreeAlts?sorted.filter(c=>c.free&&c.online):sorted).map(c=>{const f=getFee(c,c.feeStatus);return (
            <div key={c.id} onClick={()=>setExplorer(c)} style={{display:"grid",gridTemplateColumns:"50px 1fr auto",gap:14,alignItems:"center",padding:"14px 18px",borderRadius:12,background:P.surface,border:`1px solid ${P.surfaceLight}`,cursor:"pointer",transition:"border-color 0.2s,transform 0.15s"}} onMouseOver={e=>{e.currentTarget.style.borderColor=P.accent;e.currentTarget.style.transform="translateY(-1px)"}} onMouseOut={e=>{e.currentTarget.style.borderColor=P.surfaceLight;e.currentTarget.style.transform="translateY(0)"}}>
              <MB p={c.matchPercent}/>
              <div style={{minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,fontFamily:"'Trebuchet MS',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {c.title}
                  {c.free&&<span style={{marginLeft:8,padding:"2px 7px",borderRadius:10,background:`${P.success}25`,color:P.success,fontSize:10,fontWeight:700}}>FREE</span>}
                  {c.online&&<span style={{marginLeft:4,padding:"2px 7px",borderRadius:10,background:`${P.accent}20`,color:P.accentLight,fontSize:10,fontWeight:700}}>ONLINE</span>}
                </div>
                <div style={{fontSize:12,color:P.textMuted,marginTop:2}}>{c.institution}</div>
                <div style={{display:"flex",gap:12,marginTop:3,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,color:P.textDim}}>📍 {c.city}</span>
                  <span style={{fontSize:11,color:P.textDim}}>⏱ {c.duration}</span>
                  <span style={{fontSize:11,color:c.feeStatus==="international"?P.goldLight:P.success}}>💰 {f===0?"Free":"£"+f.toLocaleString()}/yr</span>
                  <span style={{fontSize:11,color:P.textDim}}>📈 {c.employability}%</span>
                </div>
              </div>
              <div style={{fontSize:11,color:P.accentLight,fontFamily:"'Trebuchet MS',sans-serif",textAlign:"right",whiteSpace:"nowrap"}}>Explore<br/>details →</div>
            </div>
          );})}
        </div>
        <div style={{marginTop:28,padding:16,borderRadius:12,background:`${P.surface}60`,fontSize:11,color:P.textDim,lineHeight:1.5,textAlign:"center"}}>Fee status by nationality. Cost data from Numbeo/Expatistan/university sources. Verify with institutions. © {new Date().getFullYear()} Future Horizons Education v4.0</div>
      </div>
    </div>
  );

  // ── QUESTIONNAIRE ──
  const steps = [null,
    {tt:"Let's get to know you",st:"We personalise your report and calculate fees based on your nationality.",ct:(
      <div style={{display:"grid",gap:20}}>
        <FG l="Your name or nickname" h="For personalising your report."><input type="text" value={profile.name} onChange={e=>up("name",e.target.value)} placeholder="e.g. Richard, Sam..." style={iS}/></FG>
        <FG l="Your nationality" h="Primary factor for fee status.">
          <input list="nl" value={profile.nationality} onChange={e=>{up("nationality",e.target.value);const r=resolveNat(e.target.value);if(r!=="UK")up("ukNation","");}} placeholder="e.g. British, German, Indian..." style={iS}/>
          <datalist id="nl">{NATIONALITIES.map(n=><option key={n} value={n}/>)}</datalist>
          {profile.nationality&&resolveNat(profile.nationality)&&<div style={{marginTop:6,padding:"6px 12px",borderRadius:6,background:`${P.success}12`,border:`1px solid ${P.success}30`,fontSize:12,color:P.success}}>✓ {resolveNat(profile.nationality)}</div>}
        </FG>
        {resolveNat(profile.nationality)==="UK"&&(
          <FG l="Which part of the UK?" h="Scottish-domiciled: FREE tuition at Scottish universities via SAAS. England/Wales/NI pay £9,250.">
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>{["England","Scotland","Wales","Northern Ireland"].map(n=>(<button key={n} onClick={()=>up("ukNation",n)} style={{...cS,...(profile.ukNation===n?cA:{})}}>{n}</button>))}</div>
            {profile.ukNation==="Scotland"&&<div style={{marginTop:8,padding:"6px 12px",borderRadius:6,background:`${P.gold}12`,fontSize:12,color:P.goldLight}}>🏴 Scottish: FREE tuition at Scottish universities via SAAS</div>}
          </FG>
        )}
        <FG l="Country you live in (optional)" h="For residency-based exemptions (e.g. US green card).">
          <input list="rl" value={profile.residence} onChange={e=>up("residence",e.target.value)} placeholder="e.g. Switzerland, UK..." style={iS}/>
          <datalist id="rl">{NATIONALITIES.map(n=><option key={n} value={n}/>)}</datalist>
        </FG>
      </div>
    )},
    {tt:"What do you want to study?",st:"Primary matching factor (55% weight).",ct:(
      <div style={{display:"grid",gap:20}}>
        <FG l="Primary subject" h="e.g. 'Theatre and acting', 'Marine biology'">
          <textarea value={profile.subjects} onChange={e=>up("subjects",e.target.value)} placeholder="e.g. Theatre, acting and performing arts" rows={3} style={iS}/>
          {profile.subjects.trim().length>0&&(()=>{const t=tokenise(profile.subjects),i=identifyPrimaryDomain(t);return i.primary?<div style={{marginTop:8,padding:"8px 14px",borderRadius:8,background:`${P.success}12`,border:`1px solid ${P.success}30`,fontSize:12,color:P.success}}>🎯 {DL[i.primary]}{i.secondary.length>0&&<span style={{color:P.textMuted}}> + {i.secondary.map(d=>DL[d]).join(", ")}</span>}</div>:null;})()}
        </FG>
        <FG l="Level"><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>{[{v:"undergraduate",l:"UG"},{v:"postgraduate",l:"PG"},{v:"certificate",l:"Cert"},{v:"any",l:"Any"}].map(o=>(<button key={o.v} onClick={()=>up("level",o.v)} style={{...cS,...(profile.level===o.v?cA:{})}}>{o.l}</button>))}</div></FG>
        <FG l="Mode"><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:8}}>{["full-time","part-time","face-to-face","online"].map(m=>(<button key={m} onClick={()=>togMode(m)} style={{...cS,...(profile.modes.includes(m)?cA:{})}}>{m}</button>))}</div></FG>
      </div>
    )},
    {tt:"Interests & skills",st:"Refines within your primary field.",ct:(<div style={{display:"grid",gap:20}}><FG l="Broader interests"><textarea value={profile.interests} onChange={e=>up("interests",e.target.value)} placeholder="e.g. digital performance, community work..." rows={3} style={iS}/></FG><FG l="Skills"><textarea value={profile.skills} onChange={e=>up("skills",e.target.value)} placeholder="e.g. creative thinking, collaboration..." rows={3} style={iS}/></FG></div>)},
    {tt:"Learning style",st:"Helps match teaching approaches.",ct:(<FG l="How do you learn best?"><textarea value={profile.learningStyle} onChange={e=>up("learningStyle",e.target.value)} placeholder="e.g. Hands-on, visual, collaborative..." rows={4} style={iS}/></FG>)},
    {tt:"Location",st:"Where would you like to study?",ct:(<div style={{display:"grid",gap:20}}><FG l="Preferred locations"><textarea value={profile.locations} onChange={e=>up("locations",e.target.value)} placeholder="e.g. UK, Germany, Netherlands..." rows={2} style={iS}/></FG><FG l="Options"><div style={{display:"grid",gap:10}}><CB c={profile.searchGlobal} o={v=>up("searchGlobal",v)} l="Worldwide" d="All countries"/><CB c={profile.searchOnline} o={v=>up("searchOnline",v)} l="Include online" d="MOOCs, Coursera, edX"/><CB c={profile.searchFree} o={v=>up("searchFree",v)} l="Free / low-cost" d="Tuition-free unis, free MOOCs"/></div></FG></div>)},
    {tt:"Extra-curricular",st:"Anything else?",ct:(<FG l="Extra-curricular"><textarea value={profile.extraCurricular} onChange={e=>up("extraCurricular",e.target.value)} placeholder="e.g. Theatre, volunteering..." rows={3} style={iS}/></FG>)},
    {tt:`Review, ${dName}`,st:"Check then generate.",ct:(<div style={{display:"grid",gap:8}}>{[{l:"Name",v:profile.name},{l:"Nationality",v:profile.nationality+(profile.ukNation?` (${profile.ukNation})`:"")} ,{l:"Subject",v:profile.subjects},{l:"Level",v:profile.level||"Any"},{l:"Location",v:profile.locations||"Worldwide"}].map((x,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"100px 1fr",gap:12,padding:"6px 0",borderBottom:`1px solid ${P.surfaceLight}40`}}><div style={{fontSize:11,color:P.textDim,textTransform:"uppercase",fontFamily:"'Trebuchet MS',sans-serif"}}>{x.l}</div><div style={{fontSize:13}}>{x.v||"—"}</div></div>))}{(()=>{const t=tokenise(profile.subjects),i=identifyPrimaryDomain(t);return i.primary?<div style={{marginTop:10,padding:12,borderRadius:10,background:`${P.success}10`,fontSize:13,color:P.success}}><strong>Domain:</strong> {DL[i.primary]} • <strong>Fees:</strong> {profile.nationality}{profile.ukNation?` (${profile.ukNation})`:""}</div>:null;})()}</div>)},
  ];
  const cur = steps[step];
  const ok = step===7||(step===1&&profile.name.trim().length>0&&profile.nationality.trim().length>0&&(resolveNat(profile.nationality)!=="UK"||profile.ukNation.length>0))||(step===2&&profile.subjects.trim().length>0)||(step>2&&step<7);
  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${P.midnight},${P.navy})`,fontFamily:"'Georgia',serif",color:P.text}}>
      <div style={{maxWidth:680,margin:"0 auto",padding:"40px 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:36}}>
          <button onClick={()=>step>1?setStep(step-1):setStep(0)} style={{background:"none",border:"none",color:P.textDim,fontSize:14,cursor:"pointer",fontFamily:"'Trebuchet MS',sans-serif"}}>← {step===1?"Home":"Back"}</button>
          <div style={{flex:1,height:4,borderRadius:2,background:P.surfaceLight}}><div style={{height:"100%",borderRadius:2,background:`linear-gradient(90deg,${P.accent},${P.accentLight})`,width:`${(step/totalSteps)*100}%`,transition:"width 0.4s"}}/></div>
          <span style={{fontSize:12,color:P.textDim,fontFamily:"'Trebuchet MS',sans-serif"}}>{step}/{totalSteps}</span>
        </div>
        <h2 style={{fontSize:22,fontWeight:400,margin:"0 0 6px"}}>{cur.tt}</h2>
        <p style={{fontSize:13,color:P.textMuted,margin:"0 0 24px"}}>{cur.st}</p>
        {cur.ct}
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:28}}>
          {step<totalSteps?(<button onClick={()=>setStep(step+1)} disabled={!ok} style={{padding:"12px 28px",fontSize:14,fontFamily:"'Trebuchet MS',sans-serif",fontWeight:600,color:P.white,background:ok?`linear-gradient(135deg,${P.accent},#2563EB)`:P.surfaceLight,border:"none",borderRadius:10,cursor:ok?"pointer":"not-allowed",opacity:ok?1:0.5}}>Continue →</button>
          ):(<button onClick={gen} style={{padding:"12px 32px",fontSize:14,fontFamily:"'Trebuchet MS',sans-serif",fontWeight:600,color:P.midnight,background:`linear-gradient(135deg,${P.gold},${P.goldLight})`,border:"none",borderRadius:10,cursor:"pointer",boxShadow:`0 4px 20px ${P.gold}40`}}>🎯 Generate {dName}'s Matches</button>)}
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTS ──
function MB({p,s="sm"}) {const sz=s==="lg"?56:48,fs=s==="lg"?16:14,c=p>=80?P.success:p>=60?P.accent:p>=40?P.gold:P.danger;return (<div style={{width:sz,height:sz,borderRadius:"50%",border:`3px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:fs,fontWeight:700,color:c,fontFamily:"'Trebuchet MS',sans-serif"}}>{p}%</span></div>);}
function FG({l,h,children}) {return (<div><label style={{display:"block",fontSize:14,fontWeight:600,marginBottom:h?2:8,fontFamily:"'Trebuchet MS',sans-serif",color:P.text}}>{l}</label>{h&&<div style={{fontSize:12,color:P.textDim,marginBottom:8}}>{h}</div>}{children}</div>);}
function CB({c,o,l,d}) {return (<div onClick={()=>o(!c)} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 16px",borderRadius:10,background:c?`${P.accent}12`:`${P.surface}80`,border:`1px solid ${c?P.accent+"40":P.surfaceLight}`,cursor:"pointer"}}><div style={{width:20,height:20,borderRadius:4,border:`2px solid ${c?P.accent:P.surfaceLight}`,background:c?P.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{c&&<span style={{color:P.white,fontSize:12,fontWeight:700}}>✓</span>}</div><div><div style={{fontSize:14,fontWeight:600,fontFamily:"'Trebuchet MS',sans-serif"}}>{l}</div>{d&&<div style={{fontSize:12,color:P.textDim,marginTop:2}}>{d}</div>}</div></div>);}
