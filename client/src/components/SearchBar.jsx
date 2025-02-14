import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSearch = () => {
    onSearch(query);
  };

  return (
    <div className="flex items-center bg-gray-700 p-2 rounded-xl w-full max-w-lg mx-auto">
      <input
        type="text"
        className="bg-transparent text-white placeholder-gray-400 w-full p-2 rounded-l-lg"
        placeholder="Search past analyses"
        value={query}
        onChange={handleChange}
      />
      <button
        onClick={handleSearch}
        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-r-lg"
      >
        Search
      </button>
    </div>
  );
};

export default SearchBar;
