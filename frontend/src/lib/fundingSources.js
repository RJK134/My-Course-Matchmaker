import { resolveNat } from "./nationalityResolver";

export function getFund(co, fs, nat) {
  const nc = resolveNat(nat);
  const s = [];

  if (co === "UK" || co === "Scotland") {
    if (fs === "home") {
      s.push({ t: "Student Finance England — loans up to £9,250/yr tuition + maintenance", u: "https://www.gov.uk/student-finance" });
      s.push({ t: "SAAS (Scotland) — Scottish-domiciled: NO tuition fees", u: "https://www.saas.gov.uk/" });
      s.push({ t: "Student Finance Wales", u: "https://www.studentfinancewales.co.uk/" });
      s.push({ t: "UCAS — scholarships, grants & bursaries", u: "https://www.ucas.com/student-finance-england/scholarships-grants-and-bursaries" });
      s.push({ t: "Save the Student — grants guide", u: "https://www.savethestudent.org/student-finance/grants-bursaries.html" });
      s.push({ t: "Disabled Students' Allowance", u: "https://www.gov.uk/disabled-students-allowance-dsa" });
    } else {
      s.push({ t: "Chevening Scholarships (fully funded)", u: "https://www.chevening.org/" });
      s.push({ t: "Commonwealth Scholarships", u: "https://cscuk.fcdo.gov.uk/scholarships/" });
      s.push({ t: "GREAT Scholarships", u: "https://study-uk.britishcouncil.org/scholarships/great-scholarships" });
      s.push({ t: "British Council — study in UK", u: "https://study-uk.britishcouncil.org/scholarships" });
    }
  } else if (co === "USA") {
    if (fs === "home") {
      s.push({ t: "Federal Student Aid (FAFSA)", u: "https://studentaid.gov/" });
      s.push({ t: "Federal Pell Grants", u: "https://studentaid.gov/understand-aid/types/grants/pell" });
    } else {
      s.push({ t: "Fulbright Program", u: "https://fulbrightprogram.org/" });
      s.push({ t: "Scholarships.com", u: "https://www.scholarships.com/" });
      s.push({ t: "Funding for US Study", u: "https://www.fundingusstudy.org/" });
    }
  } else if (co === "Canada") {
    s.push({ t: "Canada Student Grants & Loans", u: "https://www.canada.ca/en/services/benefits/education/student-aid.html" });
    if (fs !== "home") s.push({ t: "EduCanada scholarships", u: "https://www.educanada.ca/scholarships-bourses/index.aspx" });
  } else if (co === "Australia") {
    if (fs === "home") s.push({ t: "HECS-HELP loan", u: "https://www.studyassist.gov.au/help-loans/hecs-help" });
    else s.push({ t: "Australia Awards", u: "https://www.dfat.gov.au/people-to-people/australia-awards" });
    s.push({ t: "Study Australia scholarships", u: "https://www.studyaustralia.gov.au/en/plan-your-studies/scholarships" });
  } else if (co === "Germany") {
    s.push({ t: "DAAD Scholarships", u: "https://www.daad.de/en/study-and-research-in-germany/scholarships/" });
    s.push({ t: "No tuition fees at public universities", u: "https://www.study-in-germany.de/en/plan-your-studies/costs-funding/" });
    s.push({ t: "Deutschlandstipendium", u: "https://www.deutschlandstipendium.de/en/" });
  } else if (co === "France") {
    s.push({ t: "Campus France scholarships", u: "https://www.campusfrance.org/en/scholarships" });
    s.push({ t: "Eiffel Excellence Scholarship", u: "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence" });
  } else if (co === "Netherlands") {
    s.push({ t: "Holland Scholarship", u: "https://www.studyinholland.nl/finances/scholarships/find-a-scholarship/holland-scholarship" });
    s.push({ t: "DUO student finance (EU/EEA)", u: "https://duo.nl/particulier/student-finance/" });
  } else if (co === "Denmark" || co === "Sweden" || co === "Finland" || co === "Norway") {
    s.push({ t: "Free tuition for EU/EEA/Swiss students", u: "https://www.study.eu/article/study-in-europe-for-free-or-low-tuition-fees" });
    if (co === "Sweden") s.push({ t: "Swedish Institute Scholarships", u: "https://si.se/en/apply/scholarships/" });
    if (co === "Norway") s.push({ t: "Lånekassen", u: "https://lanekassen.no/en-US/" });
  } else if (co === "Switzerland") {
    s.push({ t: "Swiss Government Excellence Scholarships", u: "https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants.html" });
    s.push({ t: "ETH/EPFL — same low fees for all", u: "https://ethz.ch/en/studies/financial/tuition-fees.html" });
  } else if (co === "Italy") {
    s.push({ t: "Study in Italy scholarships", u: "https://www.studiare-in-italia.it/studentistranieri/" });
  }

  if (co === "Online") {
    s.push({ t: "Coursera Financial Aid", u: "https://www.coursera.org/financial-aid" });
    s.push({ t: "edX Financial Assistance", u: "https://support.edx.org/hc/en-us/articles/215167857" });
    s.push({ t: "FutureLearn free courses", u: "https://www.futurelearn.com/courses?filter_category=free" });
  }

  s.push({ t: "QS Scholarships — global search", u: "https://www.topuniversities.com/scholarships" });
  s.push({ t: "The Scholarship Hub", u: "https://www.thescholarshiphub.org.uk/" });

  if (nc === "UK" && co !== "UK" && co !== "Scotland") {
    s.push({ t: "Turing Scheme — UK govt study abroad funding", u: "https://www.gov.uk/guidance/turing-scheme-apply-for-funding-for-international-placements" });
  }

  return s;
}
