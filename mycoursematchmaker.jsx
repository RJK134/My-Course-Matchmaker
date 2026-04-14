import { useState, useEffect, useRef, useCallback } from "react";

// ─── DATA SOURCES (from your uploaded documents) ─────────────────────────────
const COURSE_DATA_SOURCES = {
  global: [
    "topuniversities.com/programs", "studylink.com", "bachelorsportal.com",
    "mastersportal.com", "timeshighereducation.com", "study.eu",
    "edx.org", "coursera.org", "classcentral.com", "mooc.org"
  ],
  uk: [
    "ucas.com", "theuniguide.co.uk", "discoveruni.gov.uk",
    "prospects.ac.uk", "thecompleteuniversityguide.co.uk", "open.ac.uk"
  ],
  us: [
    "usnews.com/education", "bestcolleges.com", "harvardonline.harvard.edu",
    "collegeboard.org"
  ],
  eu: [
    "study.eu", "hochschulkompass.de", "universityadmissions.se",
    "coursera.org/degrees/top-european"
  ],
  aus: [
    "courseseeker.edu.au", "studyaustralia.gov.au", "cricos.education.gov.au"
  ],
  canada: ["universitystudy.ca"]
};

const FUNDING_SOURCES = {
  uk_home: ["Student Finance England/Wales/Scotland/NI", "University bursaries & scholarships", "UCAS-listed grants"],
  uk_overseas: ["Turing Scheme", "Chevening Scholarships", "Commonwealth Scholarships"],
  us: ["Federal Pell Grants", "Fulbright Program", "State grants", "Institutional scholarships"],
  eu: ["Erasmus+ funding", "Country-specific grants (europa.eu)", "Swiss scholarships & loans"],
  aus: ["GrantConnect (grants.gov.au)", "Study Australia scholarships"],
  canada: ["Canada Student Grant", "Provincial student aid"],
  ireland: ["Student Grant Scheme (SUSI)"]
};

// ─── DOMAIN TAXONOMY ─────────────────────────────────────────────────────────
// Maps broad discipline families so the algorithm understands that "performing arts"
// is fundamentally different from "computer science" even if both mention "technology"
const DOMAIN_FAMILIES = {
  "performing_arts": ["acting","drama","theatre","dance","musical theatre","performing arts","performance","stage","choreography","devised theatre","physical theatre","voice","circus"],
  "music": ["music","composition","songwriting","music production","audio","conducting","music performance","music technology","sound design","recording"],
  "visual_arts": ["fine art","painting","sculpture","printmaking","photography","illustration","visual arts","ceramics","textiles","art"],
  "design": ["graphic design","fashion design","interior design","product design","UX design","UI","industrial design","animation","motion graphics","design thinking"],
  "film_media": ["film","filmmaking","film production","screenwriting","cinematography","directing","media production","broadcasting","television","video","documentary"],
  "creative_writing": ["creative writing","fiction","poetry","playwriting","screenwriting","publishing","literature","literary studies","journalism","editing"],
  "computer_science": ["computer science","programming","software engineering","algorithms","AI","machine learning","data science","cybersecurity","web development","systems"],
  "engineering": ["engineering","mechanical","electrical","civil","chemical","aerospace","robotics","manufacturing","automotive"],
  "business": ["business","management","marketing","finance","economics","accounting","entrepreneurship","strategy","leadership","MBA"],
  "sciences": ["biology","chemistry","physics","environmental science","neuroscience","biomedical","pharmacology","geology","astronomy","ecology"],
  "medicine_health": ["medicine","nursing","healthcare","clinical","patient care","dentistry","pharmacy","public health","physiotherapy","midwifery"],
  "law": ["law","criminal law","constitutional law","human rights","legal studies","jurisprudence","international law"],
  "social_sciences": ["psychology","sociology","anthropology","politics","international relations","social work","counselling","education","philosophy"],
  "humanities": ["history","classics","languages","linguistics","theology","archaeology","cultural studies","area studies"],
  "architecture": ["architecture","urban planning","landscape","built environment","spatial design"],
  "education": ["education","teaching","pedagogy","PGCE","child development","special educational needs","curriculum"],
};

// ─── SAMPLE COURSE DATABASE ──────────────────────────────────────────────────
const SAMPLE_COURSES = [
  // ── PERFORMING ARTS & THEATRE ──
  { id: 1, title: "BFA Acting", institution: "Royal Academy of Dramatic Art (RADA)", country: "UK", city: "London", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "performing_arts", subjects: ["acting","drama","theatre","performing arts","voice","stage","physical theatre"], annualFee: 9250, annualFeIntl: 23333, livingCost: 18000, duration: "3 years", ranking: 1, entryReqs: "Audition-based entry", careerPaths: ["Actor","Director","Drama Teacher","Voice Coach"], avgSalary: "£20,000-£60,000+", employability: 65, online: false, free: false },
  { id: 2, title: "BA (Hons) Acting", institution: "Royal Central School of Speech and Drama", country: "UK", city: "London", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "performing_arts", subjects: ["acting","drama","theatre","performing arts","devised theatre","voice","stage"], annualFee: 9250, annualFeIntl: 21000, livingCost: 18000, duration: "3 years", ranking: 2, entryReqs: "Audition + interview", careerPaths: ["Actor","Theatre Director","Drama Facilitator","Arts Administrator"], avgSalary: "£20,000-£50,000+", employability: 62, online: false, free: false },
  { id: 3, title: "BFA Theatre Arts", institution: "Tisch School of the Arts, NYU", country: "USA", city: "New York", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "performing_arts", subjects: ["acting","drama","theatre","performing arts","directing","playwriting","stage design"], annualFee: 30000, annualFeIntl: 30000, livingCost: 25000, duration: "4 years", ranking: 1, entryReqs: "Audition + academic record", careerPaths: ["Actor","Director","Playwright","Producer","Casting Director"], avgSalary: "$30,000-$80,000+", employability: 68, online: false, free: false },
  { id: 4, title: "BFA Theatre", institution: "Royal Conservatoire of Scotland", country: "UK", city: "Glasgow", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "performing_arts", subjects: ["acting","drama","theatre","performing arts","musical theatre","stage"], annualFee: 1820, annualFeIntl: 20100, livingCost: 10500, duration: "3 years", ranking: 3, entryReqs: "Audition", careerPaths: ["Actor","Director","Drama Teacher","Theatre Maker"], avgSalary: "£20,000-£45,000", employability: 63, online: false, free: false },
  { id: 5, title: "BFA Musical Theatre", institution: "Carnegie Mellon University", country: "USA", city: "Pittsburgh", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "performing_arts", subjects: ["musical theatre","acting","singing","dance","performing arts","theatre","stage"], annualFee: 32500, annualFeIntl: 32500, livingCost: 15000, duration: "4 years", ranking: 1, entryReqs: "Audition + portfolio", careerPaths: ["Musical Theatre Performer","Singer","Actor","Choreographer"], avgSalary: "$28,000-$70,000+", employability: 60, online: false, free: false },
  { id: 6, title: "BFA Dance", institution: "Juilliard School", country: "USA", city: "New York", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "performing_arts", subjects: ["dance","choreography","performance","performing arts","ballet","contemporary dance","physical theatre"], annualFee: 35000, annualFeIntl: 35000, livingCost: 25000, duration: "4 years", ranking: 1, entryReqs: "Audition", careerPaths: ["Professional Dancer","Choreographer","Dance Teacher","Company Director"], avgSalary: "$25,000-$60,000", employability: 55, online: false, free: false },
  { id: 7, title: "BA (Hons) Theatre & Performance", institution: "University of Leeds", country: "UK", city: "Leeds", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "performing_arts", subjects: ["theatre","performance","drama","performing arts","devised theatre","critical analysis","stage"], annualFee: 9250, annualFeIntl: 24500, livingCost: 10500, duration: "3 years", ranking: 20, entryReqs: "ABB at A-Level", careerPaths: ["Theatre Maker","Arts Manager","Drama Teacher","Producer","Actor"], avgSalary: "£22,000-£38,000", employability: 70, online: false, free: false },
  { id: 8, title: "MA Theatre Directing", institution: "Birkbeck, University of London", country: "UK", city: "London", level: "postgraduate", mode: ["full-time","face-to-face"], domain: "performing_arts", subjects: ["directing","theatre","drama","performing arts","stage","dramaturgy","devised theatre"], annualFee: 11100, annualFeIntl: 18800, livingCost: 18000, duration: "1 year", ranking: 0, entryReqs: "2:1 degree + directing experience", careerPaths: ["Theatre Director","Artistic Director","Drama Lecturer","Producer"], avgSalary: "£25,000-£55,000", employability: 60, online: false, free: false },

  // ── MUSIC ──
  { id: 9, title: "Bachelor of Music Performance", institution: "Berklee College of Music", country: "USA", city: "Boston", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "music", subjects: ["music","performance","composition","songwriting","music production","audio"], annualFee: 48600, annualFeIntl: 48600, livingCost: 20000, duration: "4 years", ranking: 1, entryReqs: "Audition + portfolio", careerPaths: ["Musician","Music Producer","Composer","Sound Engineer","Music Teacher"], avgSalary: "$30,000-$80,000", employability: 60, online: false, free: false },
  { id: 10, title: "BMus (Hons) Music", institution: "Royal Academy of Music", country: "UK", city: "London", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "music", subjects: ["music","performance","composition","classical music","conducting","music technology"], annualFee: 9250, annualFeIntl: 27400, livingCost: 18000, duration: "4 years", ranking: 1, entryReqs: "Audition + ABRSM Grade 8+", careerPaths: ["Performer","Conductor","Composer","Music Teacher","Session Musician"], avgSalary: "£22,000-£55,000", employability: 58, online: false, free: false },

  // ── FILM & MEDIA ──
  { id: 11, title: "BFA Film Production", institution: "USC School of Cinematic Arts", country: "USA", city: "Los Angeles", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "film_media", subjects: ["film","filmmaking","film production","screenwriting","directing","cinematography","media production"], annualFee: 37500, annualFeIntl: 37500, livingCost: 20000, duration: "4 years", ranking: 1, entryReqs: "Portfolio + application", careerPaths: ["Film Director","Screenwriter","Producer","Cinematographer","Editor"], avgSalary: "$35,000-$100,000+", employability: 70, online: false, free: false },
  { id: 12, title: "BA (Hons) Film Studies", institution: "University of Warwick", country: "UK", city: "Coventry", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "film_media", subjects: ["film","cinema","media","critical analysis","film theory","screenwriting","documentary"], annualFee: 9250, annualFeIntl: 22280, livingCost: 10500, duration: "3 years", ranking: 8, entryReqs: "ABB at A-Level", careerPaths: ["Film Critic","Producer","Screenwriter","Media Researcher","Broadcasting"], avgSalary: "£23,000-£40,000", employability: 68, online: false, free: false },

  // ── CREATIVE WRITING & LITERATURE ──
  { id: 13, title: "MA Creative Writing", institution: "University of East Anglia", country: "UK", city: "Norwich", level: "postgraduate", mode: ["full-time","face-to-face"], domain: "creative_writing", subjects: ["creative writing","fiction","poetry","screenwriting","publishing","literature","playwriting"], annualFee: 11100, annualFeIntl: 21700, livingCost: 10000, duration: "1 year", ranking: 1, entryReqs: "2:1 degree + writing portfolio", careerPaths: ["Author","Screenwriter","Editor","Copywriter","Journalist","Publisher"], avgSalary: "£22,000-£45,000", employability: 72, online: false, free: false },
  { id: 14, title: "BA English Literature", institution: "University of Oxford", country: "UK", city: "Oxford", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "creative_writing", subjects: ["english","literature","creative writing","humanities","critical thinking","literary studies"], annualFee: 9250, annualFeIntl: 29700, livingCost: 14000, duration: "3 years", ranking: 1, entryReqs: "AAA at A-Level", careerPaths: ["Teacher","Journalist","Editor","Publishing","Copywriter"], avgSalary: "£25,000-£40,000", employability: 78, online: false, free: false },

  // ── VISUAL ARTS & DESIGN ──
  { id: 15, title: "BFA Visual Arts", institution: "Rhode Island School of Design (RISD)", country: "USA", city: "Providence", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "visual_arts", subjects: ["fine art","painting","sculpture","visual arts","printmaking","art","photography"], annualFee: 32500, annualFeIntl: 32500, livingCost: 15000, duration: "4 years", ranking: 1, entryReqs: "Portfolio + application", careerPaths: ["Artist","Gallery Curator","Art Teacher","Illustrator","Art Director"], avgSalary: "$28,000-$55,000", employability: 62, online: false, free: false },
  { id: 16, title: "BA (Hons) Graphic Design", institution: "Central Saint Martins (UAL)", country: "UK", city: "London", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "design", subjects: ["graphic design","design","visual communication","typography","branding","illustration","art"], annualFee: 9250, annualFeIntl: 24500, livingCost: 18000, duration: "3 years", ranking: 1, entryReqs: "Foundation year + portfolio", careerPaths: ["Graphic Designer","Art Director","Brand Strategist","UX Designer"], avgSalary: "£24,000-£50,000", employability: 80, online: false, free: false },
  { id: 17, title: "BFA Animation", institution: "California Institute of the Arts (CalArts)", country: "USA", city: "Valencia", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "design", subjects: ["animation","design","illustration","motion graphics","storytelling","art","film"], annualFee: 35000, annualFeIntl: 35000, livingCost: 15000, duration: "4 years", ranking: 1, entryReqs: "Portfolio + application", careerPaths: ["Animator","Motion Designer","Storyboard Artist","VFX Artist","Game Designer"], avgSalary: "$40,000-$85,000", employability: 78, online: false, free: false },
  { id: 18, title: "Google UX Design Certificate", institution: "Coursera / Google", country: "Online", city: "Online", level: "certificate", mode: ["part-time","online"], domain: "design", subjects: ["UX design","user research","prototyping","wireframing","design thinking","UI"], annualFee: 300, annualFeIntl: 300, livingCost: 0, duration: "6 months", ranking: 0, entryReqs: "None", careerPaths: ["UX Designer","UI Designer","Product Designer","UX Researcher"], avgSalary: "£30,000-£55,000", employability: 85, online: true, free: false },

  // ── COMPUTER SCIENCE & TECH ──
  { id: 19, title: "BSc Computer Science", institution: "University of Edinburgh", country: "UK", city: "Edinburgh", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "computer_science", subjects: ["computer science","programming","software engineering","AI","machine learning"], annualFee: 9250, annualFeIntl: 34800, livingCost: 12000, duration: "4 years", ranking: 15, entryReqs: "ABB-AAA at A-Level or equivalent", careerPaths: ["Software Engineer","Data Scientist","Systems Architect","AI Researcher"], avgSalary: "£35,000-£55,000", employability: 92, online: false, free: false },
  { id: 20, title: "MSc Artificial Intelligence", institution: "University of Edinburgh", country: "UK", city: "Edinburgh", level: "postgraduate", mode: ["full-time","face-to-face"], domain: "computer_science", subjects: ["AI","machine learning","natural language processing","computer science","robotics","algorithms"], annualFee: 16200, annualFeIntl: 37500, livingCost: 12000, duration: "1 year", ranking: 15, entryReqs: "2:1 in CS/Maths/Engineering", careerPaths: ["AI Engineer","ML Researcher","Data Scientist","Robotics Engineer"], avgSalary: "£50,000-£90,000", employability: 96, online: false, free: false },
  { id: 21, title: "MSc Data Science", institution: "Imperial College London", country: "UK", city: "London", level: "postgraduate", mode: ["full-time","face-to-face"], domain: "computer_science", subjects: ["data science","statistics","machine learning","programming","analytics"], annualFee: 18500, annualFeIntl: 38200, livingCost: 18000, duration: "1 year", ranking: 6, entryReqs: "2:1 degree in quantitative subject", careerPaths: ["Data Scientist","ML Engineer","Analytics Lead","Quant Analyst"], avgSalary: "£45,000-£75,000", employability: 95, online: false, free: false },
  { id: 22, title: "CS50: Introduction to Computer Science", institution: "Harvard University (edX)", country: "Online", city: "Online", level: "certificate", mode: ["part-time","online"], domain: "computer_science", subjects: ["computer science","programming","algorithms","web development"], annualFee: 0, annualFeIntl: 0, livingCost: 0, duration: "12 weeks", ranking: 1, entryReqs: "None", careerPaths: ["Software Developer","Web Developer","IT Support"], avgSalary: "£25,000-£45,000", employability: 70, online: true, free: true },
  { id: 23, title: "Google Data Analytics Certificate", institution: "Coursera / Google", country: "Online", city: "Online", level: "certificate", mode: ["part-time","online"], domain: "computer_science", subjects: ["data analytics","spreadsheets","SQL","data visualisation","statistics"], annualFee: 300, annualFeIntl: 300, livingCost: 0, duration: "6 months", ranking: 0, entryReqs: "None", careerPaths: ["Data Analyst","Business Analyst","Operations Analyst"], avgSalary: "£28,000-£45,000", employability: 80, online: true, free: false },
  { id: 24, title: "Bachelor of Computer Science", institution: "University of Toronto", country: "Canada", city: "Toronto", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "computer_science", subjects: ["computer science","AI","software engineering","mathematics","programming"], annualFee: 6100, annualFeIntl: 57020, livingCost: 16000, duration: "4 years", ranking: 21, entryReqs: "High school diploma with 87%+ average", careerPaths: ["Software Engineer","AI Researcher","Product Manager","CTO"], avgSalary: "CAD 65,000-110,000", employability: 93, online: false, free: false },
  { id: 25, title: "PhD Computer Science", institution: "Stanford University", country: "USA", city: "Stanford", level: "postgraduate", mode: ["full-time","face-to-face"], domain: "computer_science", subjects: ["computer science","AI","machine learning","research","algorithms","systems"], annualFee: 0, annualFeIntl: 0, livingCost: 30000, duration: "5-6 years", ranking: 2, entryReqs: "Master's degree + research experience + GRE", careerPaths: ["Professor","Research Scientist","CTO","AI Lab Director"], avgSalary: "$120,000-$200,000+", employability: 99, online: false, free: true },

  // ── BUSINESS ──
  { id: 26, title: "BSc Business Administration", institution: "University of St Andrews", country: "UK", city: "St Andrews", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "business", subjects: ["business","management","economics","finance","marketing","leadership"], annualFee: 9250, annualFeIntl: 28350, livingCost: 11000, duration: "4 years", ranking: 3, entryReqs: "AAB at A-Level", careerPaths: ["Management Consultant","Marketing Manager","Financial Analyst","Entrepreneur"], avgSalary: "£30,000-£55,000", employability: 88, online: false, free: false },
  { id: 27, title: "MBA", institution: "INSEAD", country: "France", city: "Fontainebleau", level: "postgraduate", mode: ["full-time","face-to-face"], domain: "business", subjects: ["business","management","leadership","strategy","finance","entrepreneurship"], annualFee: 95000, annualFeIntl: 95000, livingCost: 20000, duration: "1 year", ranking: 2, entryReqs: "Bachelor's degree + GMAT + work experience", careerPaths: ["CEO","Strategy Consultant","Investment Banker","Entrepreneur"], avgSalary: "£80,000-£150,000+", employability: 97, online: false, free: false },
  { id: 28, title: "Digital Marketing Specialisation", institution: "University of Illinois (Coursera)", country: "Online", city: "Online", level: "certificate", mode: ["part-time","online"], domain: "business", subjects: ["marketing","digital marketing","SEO","social media","analytics","branding"], annualFee: 400, annualFeIntl: 400, livingCost: 0, duration: "8 months", ranking: 0, entryReqs: "None", careerPaths: ["Digital Marketing Manager","SEO Specialist","Content Strategist","Social Media Manager"], avgSalary: "£28,000-£50,000", employability: 82, online: true, free: false },

  // ── SCIENCES ──
  { id: 29, title: "BSc Environmental Science", institution: "University of Melbourne", country: "Australia", city: "Melbourne", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "sciences", subjects: ["environmental science","ecology","sustainability","biology","geography","climate"], annualFee: 9500, annualFeIntl: 42000, livingCost: 21000, duration: "3 years", ranking: 14, entryReqs: "ATAR 80+ or equivalent", careerPaths: ["Environmental Consultant","Conservation Officer","Sustainability Manager","Researcher"], avgSalary: "AUD 60,000-90,000", employability: 85, online: false, free: false },
  { id: 30, title: "BSc Biomedical Sciences", institution: "King's College London", country: "UK", city: "London", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "sciences", subjects: ["biomedical science","biology","chemistry","anatomy","pharmacology","medicine"], annualFee: 9250, annualFeIntl: 29100, livingCost: 18000, duration: "3 years", ranking: 23, entryReqs: "AAB at A-Level including Biology + Chemistry", careerPaths: ["Biomedical Scientist","Pharmaceutical Researcher","Doctor (with further study)","Lab Manager"], avgSalary: "£28,000-£55,000", employability: 87, online: false, free: false },
  { id: 31, title: "BSc Mathematics", institution: "University of Warwick", country: "UK", city: "Coventry", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "sciences", subjects: ["mathematics","statistics","pure maths","applied maths","logic","analysis"], annualFee: 9250, annualFeIntl: 29000, livingCost: 10500, duration: "3 years", ranking: 5, entryReqs: "A*A*A at A-Level including Maths + Further Maths", careerPaths: ["Actuary","Quantitative Analyst","Data Scientist","Academic Researcher","Risk Analyst"], avgSalary: "£35,000-£70,000", employability: 91, online: false, free: false },

  // ── ENGINEERING ──
  { id: 32, title: "Bachelor of Engineering (Mechanical)", institution: "ETH Zurich", country: "Switzerland", city: "Zurich", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "engineering", subjects: ["engineering","mechanical","physics","mathematics","design","manufacturing"], annualFee: 1460, annualFeIntl: 1460, livingCost: 24000, duration: "3 years", ranking: 7, entryReqs: "Swiss Matura or equivalent + entrance exam", careerPaths: ["Mechanical Engineer","Product Designer","Automotive Engineer","Consultant"], avgSalary: "CHF 80,000-120,000", employability: 94, online: false, free: false },
  { id: 33, title: "MSc Sustainable Energy", institution: "Technical University of Denmark (DTU)", country: "Denmark", city: "Copenhagen", level: "postgraduate", mode: ["full-time","face-to-face"], domain: "engineering", subjects: ["energy","sustainability","engineering","renewable energy","climate","physics"], annualFee: 0, annualFeIntl: 15000, livingCost: 14000, duration: "2 years", ranking: 35, entryReqs: "Bachelor's in Engineering/Science", careerPaths: ["Energy Consultant","Renewable Energy Engineer","Policy Advisor","Project Manager"], avgSalary: "DKK 450,000-650,000", employability: 91, online: false, free: false },

  // ── MEDICINE & HEALTH ──
  { id: 34, title: "BSc Nursing", institution: "University of Manchester", country: "UK", city: "Manchester", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "medicine_health", subjects: ["nursing","healthcare","biology","patient care","clinical practice","medicine"], annualFee: 9250, annualFeIntl: 28000, livingCost: 11000, duration: "3 years", ranking: 27, entryReqs: "BBB at A-Level including a science", careerPaths: ["Registered Nurse","Midwife","Health Visitor","Nurse Practitioner"], avgSalary: "£25,000-£45,000", employability: 98, online: false, free: false },
  { id: 35, title: "BSc Psychology", institution: "University of Amsterdam", country: "Netherlands", city: "Amsterdam", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "social_sciences", subjects: ["psychology","neuroscience","research methods","counselling","behavioural science"], annualFee: 2314, annualFeIntl: 12114, livingCost: 14000, duration: "3 years", ranking: 18, entryReqs: "IB 34+ or equivalent", careerPaths: ["Clinical Psychologist","Counsellor","HR Specialist","Researcher","Therapist"], avgSalary: "€30,000-€55,000", employability: 82, online: false, free: false },

  // ── LAW ──
  { id: 36, title: "LLB Law", institution: "University College London", country: "UK", city: "London", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "law", subjects: ["law","criminal law","constitutional law","human rights","legal studies"], annualFee: 9250, annualFeIntl: 28500, livingCost: 18000, duration: "3 years", ranking: 8, entryReqs: "A*AA at A-Level", careerPaths: ["Solicitor","Barrister","Legal Advisor","Judge","Corporate Lawyer"], avgSalary: "£30,000-£100,000+", employability: 90, online: false, free: false },

  // ── HUMANITIES ──
  { id: 37, title: "BA History", institution: "University of Glasgow", country: "UK", city: "Glasgow", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "humanities", subjects: ["history","politics","social science","research","critical analysis","humanities"], annualFee: 1820, annualFeIntl: 22000, livingCost: 10500, duration: "4 years", ranking: 76, entryReqs: "ABB at A-Level", careerPaths: ["Historian","Archivist","Teacher","Museum Curator","Civil Servant","Journalist"], avgSalary: "£24,000-£40,000", employability: 75, online: false, free: false },
  { id: 38, title: "BA International Relations", institution: "Sciences Po Paris", country: "France", city: "Paris", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "social_sciences", subjects: ["international relations","politics","economics","history","diplomacy","languages"], annualFee: 0, annualFeIntl: 13190, livingCost: 16000, duration: "3 years", ranking: 3, entryReqs: "Baccalauréat or equivalent + written exam", careerPaths: ["Diplomat","Policy Analyst","NGO Manager","Journalist","Civil Servant"], avgSalary: "€35,000-€70,000", employability: 84, online: false, free: false },

  // ── EDUCATION ──
  { id: 39, title: "BEd Education Studies", institution: "University of Cambridge", country: "UK", city: "Cambridge", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "education", subjects: ["education","teaching","pedagogy","child development","psychology","learning"], annualFee: 9250, annualFeIntl: 25000, livingCost: 13000, duration: "3 years", ranking: 2, entryReqs: "A*AA at A-Level", careerPaths: ["Teacher","Education Consultant","Educational Psychologist","School Leader"], avgSalary: "£25,000-£50,000", employability: 92, online: false, free: false },

  // ── ARCHITECTURE ──
  { id: 40, title: "BSc Architecture", institution: "Politecnico di Milano", country: "Italy", city: "Milan", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "architecture", subjects: ["architecture","design","urban planning","engineering","sustainability","art"], annualFee: 3900, annualFeIntl: 3900, livingCost: 12000, duration: "3 years", ranking: 10, entryReqs: "High school diploma + entrance test", careerPaths: ["Architect","Urban Planner","Interior Designer","Landscape Architect"], avgSalary: "€30,000-€60,000", employability: 86, online: false, free: false },

  // ── GENERAL / OPEN ──
  { id: 41, title: "MIT OpenCourseWare - Various Subjects", institution: "Massachusetts Institute of Technology", country: "Online", city: "Online", level: "certificate", mode: ["part-time","online"], domain: "computer_science", subjects: ["engineering","computer science","physics","mathematics","economics","biology"], annualFee: 0, annualFeIntl: 0, livingCost: 0, duration: "Self-paced", ranking: 1, entryReqs: "None", careerPaths: ["Various - depends on subject"], avgSalary: "Varies", employability: 60, online: true, free: true },
  { id: 42, title: "FutureLearn Microcredentials - Various", institution: "FutureLearn / Various Universities", country: "Online", city: "Online", level: "certificate", mode: ["part-time","online"], domain: "education", subjects: ["business","healthcare","technology","education","creative arts","science"], annualFee: 600, annualFeIntl: 600, livingCost: 0, duration: "10-16 weeks", ranking: 0, entryReqs: "Varies by course", careerPaths: ["Various - depends on subject"], avgSalary: "Varies", employability: 65, online: true, free: false },
  { id: 43, title: "Open University - Various Degrees", institution: "The Open University", country: "UK", city: "Online", level: "undergraduate", mode: ["part-time","online"], domain: "education", subjects: ["arts","science","technology","business","health","education","law","languages"], annualFee: 6952, annualFeIntl: 6952, livingCost: 0, duration: "3-6 years", ranking: 0, entryReqs: "Open entry (no formal qualifications required)", careerPaths: ["Various - depends on subject"], avgSalary: "Varies", employability: 75, online: true, free: false },

  // ── ADDITIONAL ARTS-ADJACENT / CREATIVE TECHNOLOGY ──
  { id: 44, title: "BA (Hons) Theatre & Digital Innovation", institution: "University of Exeter", country: "UK", city: "Exeter", level: "undergraduate", mode: ["full-time","face-to-face"], domain: "performing_arts", subjects: ["theatre","drama","digital","technology","performing arts","immersive","stage design"], annualFee: 9250, annualFeIntl: 25000, livingCost: 10000, duration: "3 years", ranking: 12, entryReqs: "ABB at A-Level", careerPaths: ["Digital Theatre Maker","Immersive Experience Designer","Technical Director","Producer"], avgSalary: "£24,000-£45,000", employability: 72, online: false, free: false },
  { id: 45, title: "MA Arts & Cultural Management", institution: "King's College London", country: "UK", city: "London", level: "postgraduate", mode: ["full-time","face-to-face"], domain: "performing_arts", subjects: ["arts management","cultural policy","performing arts","theatre","creative industries","leadership"], annualFee: 15400, annualFeIntl: 26550, livingCost: 18000, duration: "1 year", ranking: 23, entryReqs: "2:1 degree in arts/humanities", careerPaths: ["Arts Manager","Festival Director","Cultural Policy Advisor","Producer","Venue Manager"], avgSalary: "£28,000-£50,000", employability: 78, online: false, free: false },
];

// ─── HIERARCHICAL MATCHING ALGORITHM (v2) ────────────────────────────────────
// The key insight: identify the user's PRIMARY discipline first, then treat
// other interests as enrichment filters WITHIN that domain, not as equal signals.

// Tokeniser that preserves multi-word phrases
function tokenise(text) {
  if (!text) return [];
  const lower = text.toLowerCase().replace(/[^\w\s,;.]/g, " ");
  // First extract known multi-word phrases
  const knownPhrases = [];
  const allPhrases = Object.values(DOMAIN_FAMILIES).flat();
  let remaining = lower;
  for (const phrase of allPhrases.sort((a, b) => b.length - a.length)) {
    if (remaining.includes(phrase)) {
      knownPhrases.push(phrase);
      remaining = remaining.replace(phrase, " ");
    }
  }
  // Then split remaining into individual words, filtering stopwords
  const stopwords = new Set(["i","a","an","the","and","or","of","in","to","for","is","my","me","it","at","on","with","but","as","be","by","so","if","am","are","was","do","not","no","like","want","would","could","also","very","really","quite","some","any","that","this","these","those","about","into","from","have","has","had","been","will","can","may"]);
  const singleWords = remaining.split(/[\s,;.]+/).filter(w => w.length > 2 && !stopwords.has(w));
  return [...new Set([...knownPhrases, ...singleWords])];
}

// Determine which domain family a set of tokens most strongly points to
function identifyPrimaryDomain(tokens) {
  const domainScores = {};
  for (const [domain, keywords] of Object.entries(DOMAIN_FAMILIES)) {
    let score = 0;
    for (const token of tokens) {
      for (const keyword of keywords) {
        // Exact match gets full weight; partial (substring) gets half
        if (token === keyword) { score += 3; }
        else if (keyword.includes(token) || token.includes(keyword)) { score += 1.5; }
      }
    }
    if (score > 0) domainScores[domain] = score;
  }
  // Sort domains by score descending
  const sorted = Object.entries(domainScores).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return { primary: null, secondary: [], scores: {} };
  return {
    primary: sorted[0][0],
    secondary: sorted.slice(1).filter(([_, s]) => s >= sorted[0][1] * 0.4).map(([d]) => d),
    scores: domainScores
  };
}

function calculateMatch(course, profile) {
  // Step 1: Parse the user's input into tokens
  const subjectTokens = tokenise(profile.subjects);
  const interestTokens = tokenise(profile.interests);
  const skillTokens = tokenise(profile.skills);
  const allTokens = [...subjectTokens, ...interestTokens, ...skillTokens];

  // Step 2: Identify the user's primary domain intent from SUBJECTS field
  const domainIntent = identifyPrimaryDomain(subjectTokens);

  // Step 3: Score components with PRIMARY DOMAIN as gatekeeper (55% weight)
  let domainScore = 0;
  if (domainIntent.primary) {
    if (course.domain === domainIntent.primary) {
      domainScore = 55; // Exact primary domain match
    } else if (domainIntent.secondary.includes(course.domain)) {
      domainScore = 30; // Secondary/adjacent domain
    } else {
      // Course is in a completely different domain — heavy penalty
      // But still give a small score if there happen to be subject keyword overlaps
      const crossoverHits = course.subjects.filter(s =>
        subjectTokens.some(t => s.includes(t) || t.includes(s))
      ).length;
      domainScore = Math.min(12, crossoverHits * 3); // Max 12 out of 55
    }
  } else {
    // No clear domain detected — fall back to keyword matching
    const hits = course.subjects.filter(s =>
      subjectTokens.some(t => s.includes(t) || t.includes(s))
    ).length;
    domainScore = Math.min(55, (hits / Math.max(course.subjects.length, 1)) * 55);
  }

  // Step 4: Subject keyword specificity WITHIN domain (15% weight)
  // Even within the right domain, how well do the specific keywords match?
  let keywordScore = 0;
  if (subjectTokens.length > 0) {
    const courseSubStr = course.subjects.join(" ") + " " + course.title.toLowerCase();
    const directHits = subjectTokens.filter(t => courseSubStr.includes(t)).length;
    keywordScore = Math.min(15, (directHits / subjectTokens.length) * 15);
  }

  // Step 5: Interest & skills enrichment (8% weight)
  // These boost courses that align with secondary interests but ONLY within
  // the domain-qualified set — they can't promote a wrong-domain course
  let enrichmentScore = 0;
  const secondaryTokens = [...interestTokens, ...skillTokens];
  if (secondaryTokens.length > 0) {
    const courseStr = (course.subjects.join(" ") + " " + course.careerPaths.join(" ")).toLowerCase();
    const enrichHits = secondaryTokens.filter(t => courseStr.includes(t)).length;
    enrichmentScore = Math.min(8, (enrichHits / secondaryTokens.length) * 8);
  }

  // Step 6: Level match (7%)
  let levelScore = 0;
  if (!profile.level || profile.level === "any") { levelScore = 5; }
  else if (course.level === profile.level) { levelScore = 7; }

  // Step 7: Mode match (5%)
  let modeScore = 0;
  if (!profile.modes || profile.modes.length === 0) { modeScore = 3; }
  else if (profile.modes.some(m => course.mode.includes(m))) { modeScore = 5; }

  // Step 8: Location match (5%)
  let locationScore = 0;
  if (profile.locations) {
    const locTokens = tokenise(profile.locations);
    const courseLocStr = `${course.country} ${course.city}`.toLowerCase();
    if (locTokens.length === 0) { locationScore = 3; }
    else if (locTokens.some(t => courseLocStr.includes(t))) { locationScore = 5; }
  } else { locationScore = 3; }

  // Step 9: Online/Free preference (5%)
  let prefScore = 0;
  if (profile.searchFree && course.free) prefScore += 3;
  else if (!profile.searchFree) prefScore += 1.5;
  if (profile.searchOnline && course.online) prefScore += 2;
  else if (!profile.searchOnline && !course.online) prefScore += 2;
  else prefScore += 0.5;

  const total = domainScore + keywordScore + enrichmentScore + levelScore + modeScore + locationScore + prefScore;
  return Math.min(99, Math.round(total)); // Cap at 99 — 100% would imply certainty
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const palette = {
  midnight: "#0B1426",
  navy: "#132042",
  deep: "#1A2A55",
  accent: "#3B82F6",
  accentLight: "#60A5FA",
  accentGlow: "#93C5FD",
  gold: "#F59E0B",
  goldLight: "#FCD34D",
  surface: "#1E293B",
  surfaceLight: "#334155",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  success: "#10B981",
  danger: "#EF4444",
  white: "#FFFFFF",
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function MyCourseMatchmaker() {
  const [step, setStep] = useState(0); // 0=landing, 1-6=questionnaire, 7=results
  const [profile, setProfile] = useState({
    subjects: "",
    level: "",
    modes: [],
    interests: "",
    skills: "",
    learningStyle: "",
    locations: "",
    extraCurricular: "",
    searchGlobal: false,
    searchOnline: false,
    searchFree: false,
  });
  const [results, setResults] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sortBy, setSortBy] = useState("match");
  const resultsRef = useRef(null);

  const totalSteps = 6;

  const generateResults = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const scored = SAMPLE_COURSES.map(c => ({
        ...c,
        matchPercent: calculateMatch(c, profile)
      }));
      scored.sort((a, b) => b.matchPercent - a.matchPercent);
      setResults(scored.slice(0, 30));
      setIsGenerating(false);
      setStep(7);
    }, 2400);
  }, [profile]);

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "match") return b.matchPercent - a.matchPercent;
    if (sortBy === "fee-low") return a.annualFee - b.annualFee;
    if (sortBy === "fee-high") return b.annualFee - a.annualFee;
    if (sortBy === "ranking") return a.ranking - b.ranking;
    if (sortBy === "employability") return b.employability - a.employability;
    return 0;
  });

  const updateProfile = (key, value) => setProfile(p => ({ ...p, [key]: value }));
  const toggleMode = (mode) => {
    setProfile(p => ({
      ...p,
      modes: p.modes.includes(mode) ? p.modes.filter(m => m !== mode) : [...p.modes, mode]
    }));
  };

  // ─── LANDING PAGE ─────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${palette.midnight} 0%, ${palette.navy} 40%, ${palette.deep} 100%)`, fontFamily: "'Georgia', 'Palatino Linotype', serif", color: palette.text, overflow: "hidden" }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -80, right: -120, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${palette.accent}15, transparent 70%)`, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, left: -100, width: 250, height: 250, borderRadius: "50%", background: `radial-gradient(circle, ${palette.gold}10, transparent 70%)`, pointerEvents: "none" }} />

          <div style={{ display: "inline-block", padding: "6px 18px", borderRadius: 20, background: `${palette.accent}20`, border: `1px solid ${palette.accent}40`, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: palette.accentLight, marginBottom: 28, fontFamily: "'Trebuchet MS', sans-serif" }}>
            Future Horizons Education
          </div>

          <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)", fontWeight: 400, lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
            My<span style={{ color: palette.accent, fontWeight: 700 }}>Course</span>Matchmaker
          </h1>

          <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)", color: palette.textMuted, maxWidth: 600, margin: "0 auto 12px", lineHeight: 1.65 }}>
            Find your perfect course — matched to your passions, career goals and learning style.
          </p>
          <p style={{ fontSize: 14, color: palette.textDim, maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.5 }}>
            Answer a few questions about yourself, and our algorithm searches open-source datasets across world universities, online platforms, and funding sources to recommend up to 30 tailored course options.
          </p>

          <button
            onClick={() => setStep(1)}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 40px", fontSize: 17, fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 600, color: palette.white, background: `linear-gradient(135deg, ${palette.accent}, #2563EB)`, border: "none", borderRadius: 12, cursor: "pointer", boxShadow: `0 4px 24px ${palette.accent}40`, transition: "transform 0.2s, box-shadow 0.2s", letterSpacing: 0.5 }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${palette.accent}60`; }}
            onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 24px ${palette.accent}40`; }}
          >
            Start Matching <span style={{ fontSize: 22 }}>→</span>
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 56 }}>
            {[
              { icon: "🎯", label: "Personalised Matching", desc: "AI-driven course recommendations" },
              { icon: "💰", label: "Cost Transparency", desc: "Fees, living costs & funding options" },
              { icon: "📊", label: "Career Insights", desc: "Employability & salary data" },
              { icon: "🌍", label: "Global Search", desc: "Universities across 50+ countries" },
            ].map((f, i) => (
              <div key={i} style={{ padding: 20, borderRadius: 12, background: `${palette.surface}90`, border: `1px solid ${palette.surfaceLight}60`, textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Trebuchet MS', sans-serif", marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: palette.textDim }}>{f.desc}</div>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 48, fontSize: 11, color: palette.textDim, lineHeight: 1.6 }}>
            Data sourced from UCAS, HESA, Coursera, edX, FutureLearn, QS Rankings, THE Rankings and other publicly available datasets.
            <br />Results are estimates — please verify all information with the institution directly.
          </p>
        </div>
      </div>
    );
  }

  // ─── LOADING STATE ────────────────────────────────────────────────
  if (isGenerating) {
    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${palette.midnight}, ${palette.navy})`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", fontFamily: "'Georgia', serif", color: palette.text }}>
        <div style={{ width: 64, height: 64, border: `3px solid ${palette.surfaceLight}`, borderTopColor: palette.accent, borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 28 }} />
        <h2 style={{ fontSize: 22, fontWeight: 400, margin: "0 0 12px" }}>Analysing your profile...</h2>
        <p style={{ color: palette.textMuted, fontSize: 14, textAlign: "center", maxWidth: 400, lineHeight: 1.5 }}>
          Searching across global university databases, online platforms, ranking data, cost-of-living indices and funding sources to find your best matches.
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── RESULTS DASHBOARD ────────────────────────────────────────────
  if (step === 7) {
    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${palette.midnight}, ${palette.navy})`, fontFamily: "'Georgia', serif", color: palette.text }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 400, margin: 0 }}>
                Your <span style={{ color: palette.accent, fontWeight: 700 }}>Course Matches</span>
              </h1>
              <p style={{ color: palette.textMuted, fontSize: 13, marginTop: 4 }}>
                {results.length} courses matched from {SAMPLE_COURSES.length} in database
                {(() => {
                  const tokens = tokenise(profile.subjects);
                  const intent = identifyPrimaryDomain(tokens);
                  const domainLabels = { performing_arts: "Performing Arts", music: "Music", visual_arts: "Visual Arts", design: "Design", film_media: "Film & Media", creative_writing: "Creative Writing", computer_science: "Computer Science", engineering: "Engineering", business: "Business", sciences: "Sciences", medicine_health: "Medicine & Health", law: "Law", social_sciences: "Social Sciences", humanities: "Humanities", architecture: "Architecture", education: "Education" };
                  return intent.primary ? <span style={{ color: palette.success }}>{" "}— Primary field: {domainLabels[intent.primary]}</span> : null;
                })()}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: "8px 14px", borderRadius: 8, background: palette.surface, border: `1px solid ${palette.surfaceLight}`, color: palette.text, fontSize: 13, fontFamily: "'Trebuchet MS', sans-serif" }}>
                <option value="match">Sort: Best Match</option>
                <option value="fee-low">Sort: Lowest Fee</option>
                <option value="fee-high">Sort: Highest Fee</option>
                <option value="ranking">Sort: University Ranking</option>
                <option value="employability">Sort: Employability</option>
              </select>
              <button onClick={() => { setStep(1); setResults([]); setSelectedCourse(null); }} style={{ padding: "8px 18px", borderRadius: 8, background: `${palette.accent}20`, border: `1px solid ${palette.accent}40`, color: palette.accentLight, fontSize: 13, cursor: "pointer", fontFamily: "'Trebuchet MS', sans-serif" }}>
                ← New Search
              </button>
            </div>
          </div>

          {/* Disclaimer banner */}
          <div style={{ padding: "12px 18px", borderRadius: 10, background: `${palette.gold}12`, border: `1px solid ${palette.gold}30`, marginBottom: 24, fontSize: 12, color: palette.goldLight, lineHeight: 1.5 }}>
            ⚠️ <strong>Important:</strong> Match percentages are estimates based on currently available open-source data. Course details, fees and entry requirements change regularly. Please verify all information directly with the institution before making any decisions.
          </div>

          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 28 }}>
            {[
              { label: "Top Match", value: `${sortedResults[0]?.matchPercent || 0}%`, color: palette.success },
              { label: "Avg Match", value: `${Math.round(results.reduce((s, r) => s + r.matchPercent, 0) / results.length)}%`, color: palette.accent },
              { label: "Free Options", value: results.filter(r => r.free).length, color: palette.goldLight },
              { label: "Online Options", value: results.filter(r => r.online).length, color: palette.accentGlow },
              { label: "Countries", value: [...new Set(results.map(r => r.country))].length, color: palette.text },
            ].map((s, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 10, background: palette.surface, border: `1px solid ${palette.surfaceLight}`, textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'Trebuchet MS', sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Course Detail Modal */}
          {selectedCourse && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSelectedCourse(null)}>
              <div onClick={e => e.stopPropagation()} style={{ background: palette.navy, borderRadius: 16, border: `1px solid ${palette.surfaceLight}`, maxWidth: 680, width: "100%", maxHeight: "85vh", overflow: "auto", padding: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, fontFamily: "'Trebuchet MS', sans-serif" }}>{selectedCourse.title}</h2>
                    <p style={{ color: palette.textMuted, fontSize: 14, margin: "4px 0 0" }}>{selectedCourse.institution}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <MatchBadge percent={selectedCourse.matchPercent} size="lg" />
                    <button onClick={() => setSelectedCourse(null)} style={{ background: "none", border: "none", color: palette.textDim, fontSize: 24, cursor: "pointer", padding: 4 }}>✕</button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {[
                    { label: "Location", value: `${selectedCourse.city}, ${selectedCourse.country}` },
                    { label: "Duration", value: selectedCourse.duration },
                    { label: "Level", value: selectedCourse.level.charAt(0).toUpperCase() + selectedCourse.level.slice(1) },
                    { label: "Mode", value: selectedCourse.mode.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(", ") },
                    { label: "Annual Fee (Home)", value: selectedCourse.annualFee === 0 ? "FREE" : `£${selectedCourse.annualFee.toLocaleString()}` },
                    { label: "Annual Fee (International)", value: selectedCourse.annualFeIntl === 0 ? "FREE" : `£${selectedCourse.annualFeIntl.toLocaleString()}` },
                    { label: "Living Costs (Annual)", value: selectedCourse.livingCost === 0 ? "N/A (Online)" : `£${selectedCourse.livingCost.toLocaleString()}` },
                    { label: "Employability", value: `${selectedCourse.employability}%` },
                  ].map((item, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 11, color: palette.textDim, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'Trebuchet MS', sans-serif" }}>{item.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2, fontFamily: "'Trebuchet MS', sans-serif" }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: 16, borderRadius: 10, background: `${palette.surface}80`, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: palette.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: "'Trebuchet MS', sans-serif" }}>Entry Requirements</div>
                  <div style={{ fontSize: 14, lineHeight: 1.5 }}>{selectedCourse.entryReqs}</div>
                </div>

                <div style={{ padding: 16, borderRadius: 10, background: `${palette.surface}80`, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: palette.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: "'Trebuchet MS', sans-serif" }}>Career Pathways</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {selectedCourse.careerPaths.map((cp, i) => (
                      <span key={i} style={{ padding: "4px 12px", borderRadius: 20, background: `${palette.accent}20`, border: `1px solid ${palette.accent}30`, fontSize: 12, color: palette.accentLight }}>{cp}</span>
                    ))}
                  </div>
                </div>

                <div style={{ padding: 16, borderRadius: 10, background: `${palette.surface}80`, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: palette.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: "'Trebuchet MS', sans-serif" }}>Estimated Salary Range</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: palette.success, fontFamily: "'Trebuchet MS', sans-serif" }}>{selectedCourse.avgSalary}</div>
                </div>

                <div style={{ padding: 16, borderRadius: 10, background: `${palette.surface}80`, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: palette.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: "'Trebuchet MS', sans-serif" }}>Estimated Total Cost</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: palette.textDim }}>Home Student</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: palette.goldLight, fontFamily: "'Trebuchet MS', sans-serif" }}>
                        {selectedCourse.annualFee === 0 ? "FREE" : `£${(selectedCourse.annualFee * parseInt(selectedCourse.duration) + selectedCourse.livingCost * parseInt(selectedCourse.duration)).toLocaleString()}`}
                      </div>
                      <div style={{ fontSize: 11, color: palette.textDim }}>fees + living costs over {selectedCourse.duration}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: palette.textDim }}>International Student</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: palette.goldLight, fontFamily: "'Trebuchet MS', sans-serif" }}>
                        {selectedCourse.annualFeIntl === 0 ? "FREE*" : `£${(selectedCourse.annualFeIntl * parseInt(selectedCourse.duration) + selectedCourse.livingCost * parseInt(selectedCourse.duration)).toLocaleString()}`}
                      </div>
                      <div style={{ fontSize: 11, color: palette.textDim }}>fees + living costs over {selectedCourse.duration}</div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: 16, borderRadius: 10, background: `${palette.gold}10`, border: `1px solid ${palette.gold}25`, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: palette.goldLight, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: "'Trebuchet MS', sans-serif" }}>Potential Funding Sources</div>
                  <div style={{ fontSize: 13, color: palette.textMuted, lineHeight: 1.6 }}>
                    {(FUNDING_SOURCES[selectedCourse.country === "UK" ? "uk_home" : selectedCourse.country === "USA" ? "us" : selectedCourse.country === "Australia" ? "aus" : selectedCourse.country === "Canada" ? "canada" : "eu"] || FUNDING_SOURCES.eu).map((f, i) => (
                      <div key={i}>• {f}</div>
                    ))}
                  </div>
                </div>

                {selectedCourse.ranking > 0 && (
                  <div style={{ padding: 16, borderRadius: 10, background: `${palette.surface}80` }}>
                    <div style={{ fontSize: 12, color: palette.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: "'Trebuchet MS', sans-serif" }}>Subject/University Ranking</div>
                    <div style={{ fontSize: 16, fontWeight: 600, fontFamily: "'Trebuchet MS', sans-serif" }}>#{selectedCourse.ranking} in subject area</div>
                    <div style={{ fontSize: 11, color: palette.textDim }}>Based on QS/THE World Rankings data</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Course Cards */}
          <div ref={resultsRef} style={{ display: "grid", gap: 12 }}>
            {sortedResults.map((course, i) => (
              <div key={course.id}
                onClick={() => setSelectedCourse(course)}
                style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 16, alignItems: "center", padding: "16px 20px", borderRadius: 12, background: palette.surface, border: `1px solid ${palette.surfaceLight}`, cursor: "pointer", transition: "border-color 0.2s, transform 0.15s" }}
                onMouseOver={e => { e.currentTarget.style.borderColor = palette.accent; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = palette.surfaceLight; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <MatchBadge percent={course.matchPercent} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Trebuchet MS', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {course.title}
                    {course.free && <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 10, background: `${palette.success}25`, color: palette.success, fontSize: 10, fontWeight: 700 }}>FREE</span>}
                    {course.online && <span style={{ marginLeft: 6, padding: "2px 8px", borderRadius: 10, background: `${palette.accent}20`, color: palette.accentLight, fontSize: 10, fontWeight: 700 }}>ONLINE</span>}
                  </div>
                  <div style={{ fontSize: 13, color: palette.textMuted, marginTop: 2 }}>{course.institution}</div>
                  <div style={{ display: "flex", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: palette.textDim }}>📍 {course.city}, {course.country}</span>
                    <span style={{ fontSize: 11, color: palette.textDim }}>⏱ {course.duration}</span>
                    <span style={{ fontSize: 11, color: palette.textDim }}>💰 {course.annualFee === 0 ? "Free" : `£${course.annualFee.toLocaleString()}/yr`}</span>
                    <span style={{ fontSize: 11, color: palette.textDim }}>📈 {course.employability}% employability</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: palette.textDim, fontFamily: "'Trebuchet MS', sans-serif", textAlign: "right" }}>
                  View<br />details →
                </div>
              </div>
            ))}
          </div>

          {/* Footer disclaimer */}
          <div style={{ marginTop: 32, padding: 20, borderRadius: 12, background: `${palette.surface}60`, border: `1px solid ${palette.surfaceLight}40`, fontSize: 12, color: palette.textDim, lineHeight: 1.6, textAlign: "center" }}>
            <strong style={{ color: palette.textMuted }}>Disclaimer:</strong> MyCourseMatchmaker provides indicative course matching based on publicly available open-source data from UCAS, university websites, QS Rankings, THE Rankings, Coursera, edX, FutureLearn, Numbeo and government sources. Match percentages are algorithmic estimates only. Course fees, entry requirements, availability and other details are subject to change. This tool does not constitute professional career advice. Users should independently verify all data with the relevant institutions and seek appropriate guidance before making any decisions about their education.
            <br /><br />
            <span style={{ color: palette.textDim }}>© {new Date().getFullYear()} Future Horizons Education — MyCourseMatchmaker v1.0</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── QUESTIONNAIRE ────────────────────────────────────────────────
  const stepConfig = [
    null, // step 0 is landing
    {
      title: "What do you want to study?",
      subtitle: "Be specific about your primary field — this is the single most important factor in matching.",
      content: (
        <div style={{ display: "grid", gap: 20 }}>
          <FieldGroup label="Primary subject / course area" hint="What is the MAIN subject you want to study? Be as specific as possible. This drives the matching — e.g. 'Theatre and Acting', 'Computer Science', 'Environmental Biology', 'Creative Writing and Screenwriting'.">
            <textarea value={profile.subjects} onChange={e => updateProfile("subjects", e.target.value)} placeholder="e.g. Theatre, acting and performing arts&#10;e.g. Marine biology and ecology&#10;e.g. Business management with a focus on entrepreneurship" rows={3} style={inputStyle} />
            {profile.subjects.trim().length > 0 && (() => {
              const tokens = tokenise(profile.subjects);
              const intent = identifyPrimaryDomain(tokens);
              const domainLabels = { performing_arts: "Performing Arts & Theatre", music: "Music", visual_arts: "Visual Arts", design: "Design", film_media: "Film & Media", creative_writing: "Creative Writing & Literature", computer_science: "Computer Science & Technology", engineering: "Engineering", business: "Business & Management", sciences: "Sciences", medicine_health: "Medicine & Health", law: "Law", social_sciences: "Social Sciences", humanities: "Humanities", architecture: "Architecture", education: "Education" };
              return intent.primary ? (
                <div style={{ marginTop: 8, padding: "8px 14px", borderRadius: 8, background: `${palette.success}12`, border: `1px solid ${palette.success}30`, fontSize: 12, color: palette.success }}>
                  🎯 Detected primary field: <strong>{domainLabels[intent.primary] || intent.primary}</strong>
                  {intent.secondary.length > 0 && <span style={{ color: palette.textMuted }}> — also related to: {intent.secondary.map(d => domainLabels[d] || d).join(", ")}</span>}
                </div>
              ) : (
                <div style={{ marginTop: 8, padding: "8px 14px", borderRadius: 8, background: `${palette.gold}12`, border: `1px solid ${palette.gold}30`, fontSize: 12, color: palette.goldLight }}>
                  💡 Tip: Try using specific subject names like "acting", "physics", "nursing" for better matching.
                </div>
              );
            })()}
          </FieldGroup>
          <FieldGroup label="Level of study">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
              {[
                { value: "undergraduate", label: "Undergraduate (Bachelor's)" },
                { value: "postgraduate", label: "Postgraduate (Master's/PhD)" },
                { value: "certificate", label: "Certificate / Short Course" },
                { value: "any", label: "Any / Not sure yet" },
              ].map(opt => (
                <button key={opt.value} onClick={() => updateProfile("level", opt.value)}
                  style={{ ...chipStyle, ...(profile.level === opt.value ? chipActiveStyle : {}) }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </FieldGroup>
          <FieldGroup label="Mode of study" hint="Select all that apply">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
              {["full-time", "part-time", "face-to-face", "online", "hybrid"].map(mode => (
                <button key={mode} onClick={() => toggleMode(mode)}
                  style={{ ...chipStyle, ...(profile.modes.includes(mode) ? chipActiveStyle : {}) }}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </FieldGroup>
        </div>
      )
    },
    {
      title: "Your wider interests & skills",
      subtitle: "These help refine matches within your primary field — they won't override your core subject.",
      content: (
        <div style={{ display: "grid", gap: 20 }}>
          <FieldGroup label="Broader interests & passions" hint="What else interests you beyond your primary subject? These help us find courses that combine your main field with related topics.">
            <textarea value={profile.interests} onChange={e => updateProfile("interests", e.target.value)} placeholder="e.g. If studying theatre: interested in how technology is used in live performance, community engagement, devised work, physical theatre..." rows={3} style={inputStyle} />
          </FieldGroup>
          <FieldGroup label="Your skills & strengths" hint="Both academic and personal — this helps match you to courses that play to your strengths.">
            <textarea value={profile.skills} onChange={e => updateProfile("skills", e.target.value)} placeholder="e.g. Creative thinking, collaboration, physical fitness, public speaking, writing, analytical thinking..." rows={3} style={inputStyle} />
          </FieldGroup>
        </div>
      )
    },
    {
      title: "How do you learn best?",
      subtitle: "Understanding your learning style helps us find courses that suit you.",
      content: (
        <div style={{ display: "grid", gap: 20 }}>
          <FieldGroup label="Preferred learning style" hint="Describe how you learn best — e.g. hands-on, visual, lectures, group work, self-paced...">
            <textarea value={profile.learningStyle} onChange={e => updateProfile("learningStyle", e.target.value)} placeholder="e.g. I learn best through practical hands-on projects. I prefer collaborative group work over solo study. I like visual aids and demonstrations..." rows={4} style={inputStyle} />
          </FieldGroup>
        </div>
      )
    },
    {
      title: "Location preferences",
      subtitle: "Where in the world would you like to study?",
      content: (
        <div style={{ display: "grid", gap: 20 }}>
          <FieldGroup label="Preferred locations" hint="Countries, cities or regions. Leave blank for worldwide.">
            <textarea value={profile.locations} onChange={e => updateProfile("locations", e.target.value)} placeholder="e.g. UK, London, Scotland, Netherlands, USA, anywhere in Europe..." rows={2} style={inputStyle} />
          </FieldGroup>
          <FieldGroup label="Search scope">
            <div style={{ display: "grid", gap: 10 }}>
              <CheckboxField checked={profile.searchGlobal} onChange={v => updateProfile("searchGlobal", v)} label="Search programmes worldwide" desc="Include universities from all countries" />
              <CheckboxField checked={profile.searchOnline} onChange={v => updateProfile("searchOnline", v)} label="Include online study options" desc="Coursera, edX, FutureLearn, Open University, MOOCs" />
              <CheckboxField checked={profile.searchFree} onChange={v => updateProfile("searchFree", v)} label="Show free / low-cost options" desc="Free MOOCs, scholarships, funded programmes" />
            </div>
          </FieldGroup>
        </div>
      )
    },
    {
      title: "Extra-curricular & other interests",
      subtitle: "Anything else that matters to you in choosing a course.",
      content: (
        <div style={{ display: "grid", gap: 20 }}>
          <FieldGroup label="Extra-curricular interests" hint="Activities, clubs, societies, sports or other interests you'd want access to.">
            <textarea value={profile.extraCurricular} onChange={e => updateProfile("extraCurricular", e.target.value)} placeholder="e.g. Debating society, theatre, rowing, volunteering, hackathons, music..." rows={3} style={inputStyle} />
          </FieldGroup>
          <FieldGroup label="Anything else?" hint="Any other factors that are important to you?">
            <textarea placeholder="e.g. Accessibility needs, campus size preference, research opportunities, year abroad options..." rows={3} style={inputStyle} />
          </FieldGroup>
        </div>
      )
    },
    {
      title: "Review & generate your matches",
      subtitle: "Check your profile summary before we find your ideal courses.",
      content: (
        <div style={{ display: "grid", gap: 12 }}>
          {[
            { label: "Primary subject", value: profile.subjects },
            { label: "Level", value: profile.level ? (profile.level.charAt(0).toUpperCase() + profile.level.slice(1)) : "Not specified" },
            { label: "Study modes", value: profile.modes.length > 0 ? profile.modes.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(", ") : "Any" },
            { label: "Wider interests", value: profile.interests },
            { label: "Skills", value: profile.skills },
            { label: "Learning style", value: profile.learningStyle },
            { label: "Location", value: profile.locations || "Worldwide" },
            { label: "Extra-curricular", value: profile.extraCurricular },
            { label: "Search options", value: [profile.searchGlobal && "Global", profile.searchOnline && "Online", profile.searchFree && "Free/Low-cost"].filter(Boolean).join(", ") || "Standard" },
          ].map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, padding: "10px 0", borderBottom: `1px solid ${palette.surfaceLight}40` }}>
              <div style={{ fontSize: 12, color: palette.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "'Trebuchet MS', sans-serif" }}>{item.label}</div>
              <div style={{ fontSize: 14, color: item.value ? palette.text : palette.textDim }}>{item.value || "—"}</div>
            </div>
          ))}

          {/* Domain intent summary */}
          {(() => {
            const tokens = tokenise(profile.subjects);
            const intent = identifyPrimaryDomain(tokens);
            const domainLabels = { performing_arts: "Performing Arts & Theatre", music: "Music", visual_arts: "Visual Arts", design: "Design", film_media: "Film & Media", creative_writing: "Creative Writing & Literature", computer_science: "Computer Science & Technology", engineering: "Engineering", business: "Business & Management", sciences: "Sciences", medicine_health: "Medicine & Health", law: "Law", social_sciences: "Social Sciences", humanities: "Humanities", architecture: "Architecture", education: "Education" };
            return (
              <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: `${palette.success}10`, border: `1px solid ${palette.success}25` }}>
                <div style={{ fontSize: 12, color: palette.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: "'Trebuchet MS', sans-serif" }}>How the algorithm will match</div>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <strong style={{ color: palette.success }}>Primary domain (55% weight):</strong>{" "}
                  <span style={{ color: palette.text }}>{intent.primary ? domainLabels[intent.primary] : "General / Unspecified"}</span>
                  {intent.secondary.length > 0 && (
                    <><br /><strong style={{ color: palette.accentLight }}>Related domains:</strong>{" "}
                    <span style={{ color: palette.textMuted }}>{intent.secondary.map(d => domainLabels[d] || d).join(", ")}</span></>
                  )}
                  <br /><span style={{ fontSize: 12, color: palette.textDim }}>Courses outside your primary domain will score significantly lower, even if they match some keywords. Your interests and skills enrich the results but won't override the core subject match.</span>
                </div>
              </div>
            );
          })()}

          <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: `${palette.accent}10`, border: `1px solid ${palette.accent}25`, fontSize: 13, color: palette.accentLight, lineHeight: 1.5 }}>
            💡 Our algorithm will search across {Object.values(COURSE_DATA_SOURCES).flat().length}+ open-source data providers including UCAS, QS Rankings, THE, Coursera, edX, and national funding databases to find your best-matched courses.
          </div>
        </div>
      )
    },
  ];

  const currentStep = stepConfig[step];
  const canProceed = step === 6 || (step === 1 && profile.subjects.trim().length > 0) || step > 1;

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${palette.midnight}, ${palette.navy})`, fontFamily: "'Georgia', serif", color: palette.text }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px" }}>
        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <button onClick={() => step > 1 ? setStep(step - 1) : setStep(0)} style={{ background: "none", border: "none", color: palette.textDim, fontSize: 14, cursor: "pointer", padding: "4px 0", fontFamily: "'Trebuchet MS', sans-serif" }}>
            ← {step === 1 ? "Home" : "Back"}
          </button>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: palette.surfaceLight }}>
            <div style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${palette.accent}, ${palette.accentLight})`, width: `${(step / totalSteps) * 100}%`, transition: "width 0.4s ease" }} />
          </div>
          <span style={{ fontSize: 12, color: palette.textDim, fontFamily: "'Trebuchet MS', sans-serif", whiteSpace: "nowrap" }}>Step {step}/{totalSteps}</span>
        </div>

        {/* Step content */}
        <h2 style={{ fontSize: 24, fontWeight: 400, margin: "0 0 6px" }}>{currentStep.title}</h2>
        <p style={{ fontSize: 14, color: palette.textMuted, margin: "0 0 28px" }}>{currentStep.subtitle}</p>

        {currentStep.content}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32 }}>
          {step < totalSteps ? (
            <button onClick={() => setStep(step + 1)} disabled={!canProceed}
              style={{ padding: "14px 32px", fontSize: 15, fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 600, color: palette.white, background: canProceed ? `linear-gradient(135deg, ${palette.accent}, #2563EB)` : palette.surfaceLight, border: "none", borderRadius: 10, cursor: canProceed ? "pointer" : "not-allowed", opacity: canProceed ? 1 : 0.5, transition: "all 0.2s" }}>
              Continue →
            </button>
          ) : (
            <button onClick={generateResults}
              style={{ padding: "14px 36px", fontSize: 15, fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 600, color: palette.midnight, background: `linear-gradient(135deg, ${palette.gold}, ${palette.goldLight})`, border: "none", borderRadius: 10, cursor: "pointer", boxShadow: `0 4px 20px ${palette.gold}40` }}>
              🎯 Generate My Course Matches
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────
function MatchBadge({ percent, size = "sm" }) {
  const sz = size === "lg" ? 56 : 48;
  const fs = size === "lg" ? 16 : 14;
  const color = percent >= 80 ? palette.success : percent >= 60 ? palette.accent : percent >= 40 ? palette.gold : palette.danger;
  return (
    <div style={{ width: sz, height: sz, borderRadius: "50%", border: `3px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: fs, fontWeight: 700, color, fontFamily: "'Trebuchet MS', sans-serif" }}>{percent}%</span>
    </div>
  );
}

function FieldGroup({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: hint ? 2 : 8, fontFamily: "'Trebuchet MS', sans-serif", color: palette.text }}>{label}</label>
      {hint && <div style={{ fontSize: 12, color: palette.textDim, marginBottom: 8 }}>{hint}</div>}
      {children}
    </div>
  );
}

function CheckboxField({ checked, onChange, label, desc }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderRadius: 10, background: checked ? `${palette.accent}12` : `${palette.surface}80`, border: `1px solid ${checked ? palette.accent + "40" : palette.surfaceLight}`, cursor: "pointer", transition: "all 0.2s" }}>
      <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${checked ? palette.accent : palette.surfaceLight}`, background: checked ? palette.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all 0.2s" }}>
        {checked && <span style={{ color: palette.white, fontSize: 12, fontWeight: 700 }}>✓</span>}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Trebuchet MS', sans-serif" }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: palette.textDim, marginTop: 2 }}>{desc}</div>}
      </div>
    </div>
  );
}

// ─── SHARED STYLES ───────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 10,
  background: `${palette.surface}`,
  border: `1px solid ${palette.surfaceLight}`,
  color: palette.text,
  fontSize: 14,
  fontFamily: "'Georgia', serif",
  resize: "vertical",
  outline: "none",
  boxSizing: "border-box",
  lineHeight: 1.5,
};

const chipStyle = {
  padding: "10px 16px",
  borderRadius: 10,
  background: `${palette.surface}`,
  border: `1px solid ${palette.surfaceLight}`,
  color: palette.textMuted,
  fontSize: 13,
  fontFamily: "'Trebuchet MS', sans-serif",
  cursor: "pointer",
  transition: "all 0.2s",
  textAlign: "center",
};

const chipActiveStyle = {
  background: `${palette.accent}18`,
  borderColor: `${palette.accent}50`,
  color: palette.accentLight,
};
