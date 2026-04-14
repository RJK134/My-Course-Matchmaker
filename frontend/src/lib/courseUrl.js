import institutions from "../data/institutions.json";

const INST_LOOKUP = Object.fromEntries(institutions.map((i) => [i.key, i]));

export function getCourseUrl(course) {
  const inst = INST_LOOKUP[course.institution];
  if (inst && inst.apply) return inst.apply;

  if (course.online) {
    if (course.institution.includes("Coursera"))
      return "https://www.coursera.org/search?query=" + encodeURIComponent(course.title);
    if (course.institution.includes("edX"))
      return "https://www.edx.org/search?q=" + encodeURIComponent(course.title);
    if (course.institution.includes("FutureLearn"))
      return "https://www.futurelearn.com/search?q=" + encodeURIComponent(course.title);
    if (course.institution.includes("Khan"))
      return "https://www.khanacademy.org";
    if (course.institution.includes("Odin"))
      return "https://www.theodinproject.com";
    if (course.institution.includes("MasterClass"))
      return "https://www.masterclass.com";
    if (course.institution.includes("Berklee Online"))
      return "https://online.berklee.edu";
    if (course.institution.includes("MIT"))
      return "https://ocw.mit.edu";
  }

  return (
    "https://www.google.com/search?q=" +
    encodeURIComponent(course.title + " " + course.institution + " apply")
  );
}

export function getInstData(institutionKey) {
  return INST_LOOKUP[institutionKey] || {};
}
