import React from 'react';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = React.useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSearch} className="flex justify-center items-center p-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-1/2 p-2 border border-gray-300 rounded"
        placeholder="Search flagged content"
      />
      <button type="submit" className="ml-2 bg-blue-600 text-white px-6 py-2 rounded">
        Search
      </button>
    </form>
  );
};

export default SearchBar;
