import React from "react";
import { useNavigate } from "react-router-dom"
import Arrow from "../assets/arrow_prev_ui.png"


const Log = () => {
  const navigate = useNavigate();

  return (
    <div >
      <div className="main">
        <img
          src={Arrow}
          alt="arrow"
          className="arrow cursor-pointer"
          onClick={() => navigate("/")} 
        />
        <h1>Blockbite</h1>
        
      </div>
    </div>
  );
};

export default Log;
