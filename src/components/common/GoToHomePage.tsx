"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import {
  ArrowBigLeft,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";

const GoToHomePage = () => {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push("/")}
      className="cursor-pointer mb-4 bg-black text-white/70 hover:text-white/90 hover:bg-white/5 hover:border-white/30 self-start"
    >
      <ArrowLeft />
      Back to Home
    </Button>
  );
};

export default GoToHomePage;
