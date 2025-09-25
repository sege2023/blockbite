import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";

const Nav = () => {
  const text = "Weelcome back to Blockbite";
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(typingInterval);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <div className="body text-center block">
      <img src={logo} alt="logo" className="mx-auto " />
      <h1 className="text-white text-3xl font-bold mt-4 inline-block type">
        {displayedText}
        <span className="cursor"></span>
      </h1>
    </div>
  );
};

export default Nav;
