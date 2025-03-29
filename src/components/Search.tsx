"use client";

import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  debouncedSearch: (query: string) => void;
};

const Search = ({
  value,
  setSearch,
  debouncedSearch,
}: Props) => {
  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.value;
    setSearch(newValue);
    debouncedSearch(newValue);
  };
  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <Input
        type="text"
        placeholder="Search AI projects..."
        value={value}
        onChange={handleSearchChange}
        className="bg-white/10 border-white/10 text-white placeholder:text-gray-400 focus-visible:ring-0"
      />
    </div>
  );
};

export default Search;
