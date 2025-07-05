import React from 'react';


const SearchBar = ({ placeholder = "Search...", onChange }) => {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  );
};

export default SearchBar;
