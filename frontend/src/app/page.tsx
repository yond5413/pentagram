"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Sparkles } from "lucide-react";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to generate image");
      }

      if (data.imageUrl) {
        const img = new Image();
        img.onload = () => {
          setImageUrl(data.imageUrl);
          setIsLoading(false);
        };
        img.src = data.imageUrl;
      } else {
        setIsLoading(false);
      }

      setInputText("");
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
      // Ideally show toast error here
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col items-center justify-center space-y-8 text-center min-h-[60vh]">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Create AI Art <span className="text-primary">Instantly</span>
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Describe your vision and watch it come to life with our state-of-the-art diffusion model.
          </p>
        </div>

        {/* Image Display Area */}
        <Card className="w-full max-w-2xl overflow-hidden aspect-square flex items-center justify-center bg-muted/50 border-dashed">
          <CardContent className="p-0 flex items-center justify-center w-full h-full relative">
            {isLoading ? (
              <div className="flex flex-col items-center space-y-4 w-full h-full justify-center p-8">
                <Skeleton className="w-full h-full absolute inset-0 opacity-20" />
                <div className="z-10 animate-pulse flex flex-col items-center">
                  <Sparkles className="h-12 w-12 text-primary animate-spin-slow mb-4" />
                  <p className="text-muted-foreground">Dreaming up your image...</p>
                </div>
              </div>
            ) : imageUrl ? (
              <div className="relative w-full h-full group">
                <img
                  src={imageUrl}
                  alt="Generated Art"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Sparkles className="h-16 w-16 mb-4 opacity-20" />
                <p>Your masterpiece will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl flex gap-x-2">
          <Input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="A cyberpunk street market in Tokyo at night, neon lights..."
            disabled={isLoading}
            className="h-12 text-base shadow-sm"
          />
          <Button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="h-12 px-8 font-semibold shadow-md shrink-0"
          >
            {isLoading ? (
              "Generating..."
            ) : (
              <>
                Generate <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}