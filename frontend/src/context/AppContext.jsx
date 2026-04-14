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
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_PROFILE":
      return { ...state, profile: action.payload };
    case "SET_RESULTS":
      return { ...state, results: action.payload };
    case "RESET":
      return initialState;
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
