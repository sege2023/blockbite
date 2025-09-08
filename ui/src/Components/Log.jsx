import React from "react";
import { useNavigate } from "react-router-dom"
import Arrow from "../assets/arrow_prev_ui.png"


const Log = () => {
  const navigate = useNavigate();

  return (
    <div className="main">
      <div>
        <img
          src={Arrow}
          alt="arrow"
          className="arrow cursor-pointer"
          onClick={() => navigate("/")} 
        />
        
      </div>
    </div>
  );
};

export default Log;
