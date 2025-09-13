import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Route } from "react-router";
import { Routes } from "react-router";
import Login from "./Components/Login";
import Chat from "./Components/Chat";
import Sidebar from "./Components/sidebar";
function App() {
return(
  <>
 <Routes>
  <Route element={<Login></Login>} path="/"></Route>
  <Route element={<Chat></Chat>} path="/chat"></Route>
  <Route element={<Sidebar></Sidebar>} path="sidebar"></Route>
  
  
  </Routes> 
  
  </>
)

}

export default App;
