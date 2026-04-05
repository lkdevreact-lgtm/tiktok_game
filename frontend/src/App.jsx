import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import { ROUTE_URLS } from "./utils/constant";

const App = () => {
  return (
    <div>
      <main>
        <Routes>
          <Route path={ROUTE_URLS.HOME} element={<HomePage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
