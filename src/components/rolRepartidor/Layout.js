import React, { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavigation from "./TopNavigation";

const Layout = ({ children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex">
      <Sidebar open={open} setOpen={setOpen} />
      <div className="w-full app-container">
        <TopNavigation open={open} setOpen={setOpen} />
        {children}
      </div>
    </div>
  );
};

export default Layout;
