import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { calculateMatch } from "./lib/matching";
import { detFeeStatus } from "./lib/nationalityResolver";
import courses from "./data/courses.json";
import institutions from "./data/institutions.json";
import costOfLiving from "./data/costOfLiving.json";

import Landing from "./components/Landing";
import Questionnaire from "./components/Questionnaire";
import LoadingScreen from "./components/LoadingScreen";
import Results from "./components/Results";
import CourseExplorer from "./components/CourseExplorer";

function AppRoutes() {
  const { state, dispatch } = useAppContext();
  const { profile, results } = state;
  const [loading, setLoading] = useState(false);
  const [explorer, setExplorer] = useState(null);
  const navigate = useNavigate();

  const dName = profile.name.trim()
    ? profile.name.trim().split(/\s+/)[0]
    : "Student";

  const generate = useCallback(() => {
    setLoading(true);
    navigate("/results");
    setTimeout(() => {
      const scored = courses.map((c) => ({
        ...c,
        matchPercent: calculateMatch(c, profile),
        feeStatus: detFeeStatus(
          profile.nationality,
          profile.residence,
          c.country,
          profile.ukNation
        ),
      }));
      scored.sort((a, b) => b.matchPercent - a.matchPercent);
      dispatch({ type: "SET_RESULTS", payload: scored.slice(0, 30) });
      setLoading(false);
    }, 2400);
  }, [profile, dispatch, navigate]);

  if (explorer) {
    return (
      <CourseExplorer
        course={explorer}
        profile={profile}
        allCourses={results}
        onBack={() => setExplorer(null)}
        onSelectAlt={(alt) =>
          setExplorer({
            ...alt,
            matchPercent:
              alt.matchPercent || calculateMatch(alt, profile),
            feeStatus: detFeeStatus(
              profile.nationality,
              profile.residence,
              alt.country,
              profile.ukNation
            ),
          })
        }
      />
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Landing
            onStart={() => navigate("/questionnaire")}
            courseCount={courses.length}
            institutionCount={institutions.length}
            cityCount={costOfLiving.length}
          />
        }
      />
      <Route
        path="/questionnaire"
        element={
          <Questionnaire
            profile={profile}
            onUpdate={(p) => dispatch({ type: "SET_PROFILE", payload: p })}
            onGenerate={generate}
            onBack={() => navigate("/")}
          />
        }
      />
      <Route
        path="/results"
        element={
          loading ? (
            <LoadingScreen name={dName} />
          ) : (
            <Results
              results={results}
              profile={profile}
              onNewSearch={() => {
                dispatch({ type: "RESET" });
                navigate("/questionnaire");
              }}
              onExplore={(c) => setExplorer(c)}
            />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
