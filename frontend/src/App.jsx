import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { calculateMatch } from "./lib/matching";
import { detFeeStatus } from "./lib/nationalityResolver";
import { api } from "./lib/api";

// Static JSON fallback for when API is unavailable
import coursesJson from "./data/courses.json";
import institutionsJson from "./data/institutions.json";
import costOfLivingJson from "./data/costOfLiving.json";

import Landing from "./components/Landing";
import Questionnaire from "./components/Questionnaire";
import LoadingScreen from "./components/LoadingScreen";
import Results from "./components/Results";
import CourseExplorer from "./components/CourseExplorer";

const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));
const StagingReview = lazy(() => import("./components/admin/StagingReview"));

function DataLoader({ children }) {
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    if (state.dataLoaded || state.dataLoading) return;

    dispatch({ type: "LOAD_DATA_START" });

    // Try API first, fall back to JSON imports
    Promise.all([
      api.courses.list().catch(() => coursesJson),
      api.institutions.list().catch(() => institutionsJson),
      api.col.list().catch(() => costOfLivingJson),
      api.admin.stats().catch(() => ({
        totalCourses: coursesJson.length,
        totalInstitutions: institutionsJson.length,
        totalCities: costOfLivingJson.length,
        pendingReview: 0,
      })),
    ])
      .then(([courses, institutions, costOfLiving, stats]) => {
        dispatch({
          type: "LOAD_DATA_SUCCESS",
          payload: { courses, institutions, costOfLiving, stats },
        });
      })
      .catch((err) => {
        // Final fallback: use JSON imports directly
        dispatch({
          type: "LOAD_DATA_SUCCESS",
          payload: {
            courses: coursesJson,
            institutions: institutionsJson,
            costOfLiving: costOfLivingJson,
            stats: {
              totalCourses: coursesJson.length,
              totalInstitutions: institutionsJson.length,
              totalCities: costOfLivingJson.length,
              pendingReview: 0,
            },
          },
        });
      });
  }, [state.dataLoaded, state.dataLoading, dispatch]);

  if (!state.dataLoaded) {
    return (
      <LoadingScreen name="Data" />
    );
  }

  return children;
}

function AppRoutes() {
  const { state, dispatch } = useAppContext();
  const { profile, results, allCourses, stats } = state;
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
      // BUG-002 fix: Hard-filter by level before scoring (unless "any")
      let filtered = allCourses;
      if (profile.level && profile.level !== "any") {
        filtered = filtered.filter((c) => c.level === profile.level);
      }

      // Score the filtered set
      const scored = filtered.map((c) => ({
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

      // BUG-001 fix: Hard-filter by location (keep worldwide in separate set)
      let locationFiltered = scored;
      if (profile.locations && profile.locations.trim()) {
        const locTokens = profile.locations.toLowerCase().split(/[\s,;]+/).filter(Boolean);
        locationFiltered = scored.filter((c) => {
          const cl = (c.country + " " + c.city).toLowerCase();
          return locTokens.some((t) => cl.includes(t));
        });
        // Fall back to soft scoring if fewer than 10 location-matched results
        if (locationFiltered.length < 10) {
          locationFiltered = scored;
        }
      }

      // Eliminate low-quality noise: minimum 30% match threshold
      const thresholded = locationFiltered.filter((c) => c.matchPercent >= 30);

      dispatch({ type: "SET_RESULTS", payload: thresholded.slice(0, 30) });
      setLoading(false);
    }, 2400);
  }, [profile, allCourses, dispatch, navigate]);

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
            matchPercent: alt.matchPercent || calculateMatch(alt, profile),
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
            courseCount={stats?.totalCourses || allCourses.length}
            institutionCount={stats?.totalInstitutions || 0}
            cityCount={stats?.totalCities || 0}
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
      <Route
        path="/admin"
        element={
          <Suspense fallback={<LoadingScreen name="Admin" />}>
            <AdminDashboard />
          </Suspense>
        }
      />
      <Route
        path="/admin/staging"
        element={
          <Suspense fallback={<LoadingScreen name="Staging" />}>
            <StagingReview />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <DataLoader>
          <AppRoutes />
        </DataLoader>
      </BrowserRouter>
    </AppProvider>
  );
}
