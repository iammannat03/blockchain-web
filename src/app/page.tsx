"use client";

import { Bot, Brain, ChartLine } from "lucide-react";
import React, { useCallback, useState } from "react";
import Search from "@/components/Search";
import { debounce } from "ts-debounce";
import Link from "next/link";

type Project = {
  title: string;
  description: string;
  link: string;
};

const projects: Project[] = [
  {
    title: "Crowdfunding App",
    description:
      "A crowdfunding app for Ethereum blockchain(Ethers.js).",
    link: "/crowdfunding-app",
  },

  // ... Add more projects as needed
];

const Page = () => {
  const [search, setSearch] = useState("");

  // server action yet to be implemented
  const searchProjects = async (query: string) => {
    console.log("Searching for: ", query);
  };

  //   Create a debounced version of the search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchProjects(query);
    }, 1000),
    []
  );

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 flex flex-col justify-center items-center">
        <h1 className="text-5xl max-sm:text-4xl font-bold mb-6 text-white">
          Blockchain Solutions Hub
        </h1>
        <p className="text-lg max-sm:text-base text-gray-300 max-w-2xl text-center">
          These are some of my Blockchain projects. I'll
          keep adding more as I learn new stuffs
        </p>
      </section>

      {/* Search Section */}
      <section className="container mx-auto py-8">
        <Search
          value={search}
          setSearch={setSearch}
          debouncedSearch={debouncedSearch}
        />
      </section>

      {/* Projects Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">
          Featured Projects
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <Link
              href={project.link}
              key={index}
              className="bg-white/10 rounded-lg p-6 transition-all hover:bg-white/15"
            >
              <h3 className="text-xl font-bold mb-2">
                {project.title}
              </h3>
              <p className="text-gray-300">
                {project.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Page;
