import { createContext, useContext, useReducer } from "react";

const AppContext = createContext();

const initialState = {
  profile: {
    name: "",
    nationality: "",
    residence: "",
    ukNation: "",
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
  },
  results: [],
  // Data loading state
  allCourses: [],
  institutions: [],
  costOfLiving: [],
  dataLoaded: false,
  dataLoading: false,
  dataError: null,
  stats: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_PROFILE":
      return { ...state, profile: action.payload };
    case "SET_RESULTS":
      return { ...state, results: action.payload };
    case "LOAD_DATA_START":
      return { ...state, dataLoading: true, dataError: null };
    case "LOAD_DATA_SUCCESS":
      return {
        ...state,
        allCourses: action.payload.courses,
        institutions: action.payload.institutions,
        costOfLiving: action.payload.costOfLiving,
        stats: action.payload.stats,
        dataLoaded: true,
        dataLoading: false,
      };
    case "LOAD_DATA_ERROR":
      return { ...state, dataLoading: false, dataError: action.payload };
    case "RESET":
      return {
        ...state,
        profile: initialState.profile,
        results: [],
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
