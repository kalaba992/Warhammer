import React from "react";
import { Routes, Route } from "react-router-dom";

function Home() {
  return <div>Audit-grade HS Classification App</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
