import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const CNav = () => {
  const navigate = useNavigate();

  return (
    <div className="container">
      
      <button className="back" onClick={() => navigate(-1)}>
        <FaArrowLeft size={20} />
      </button>
      
      <h1 className="title">Blockbite</h1>
    </div>
  );
};

export default CNav;
