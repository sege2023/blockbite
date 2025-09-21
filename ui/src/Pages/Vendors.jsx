import React, { useState } from 'react';
import Nav1 from '../Components/Nav1.jsx';
import '../Styles/Vendors.scss';
import Header from '../Components/Header.jsx';
import MenuPage from '../Components/menuu.jsx';
import Footer from '../Components/Footer.jsx';

const Vendors = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div>
      <Nav1/>
      <Header
        onSearch={(q) => setSearchQuery(q)}
        onFilter={(f) => setActiveFilter(f)}
      />
      <MenuPage searchQuery={searchQuery} activeFilter={activeFilter}/>
      <Footer/>
    </div>
  );
};

export default Vendors;
