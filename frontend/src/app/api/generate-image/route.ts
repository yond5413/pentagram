import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, negative_prompt, aspect_ratio, steps, guidance_scale } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log("Generating image with prompt:", prompt);
    const url = new URL("https://yd2696--sd-demo-model-generate.modal.run");
    url.searchParams.set("prompt", prompt);
    if (negative_prompt) {
      url.searchParams.set("negative_prompt", negative_prompt);
    }
    if (aspect_ratio) {
      url.searchParams.set("aspect_ratio", aspect_ratio);
    }
    if (steps) {
      url.searchParams.set("steps", steps.toString());
    }
    if (guidance_scale) {
      url.searchParams.set("guidance_scale", guidance_scale.toString());
    }
    console.log("Requesting url: ", url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-API-Key": process.env.API_KEY || "",
        Accept: "image/jpeg",
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.log("API response: ", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }
    /////
    const imageBuffer = await response.arrayBuffer();
    const filename = `${crypto.randomUUID()}.jpg`
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: "image/jpeg",
      allowOverwrite: true, // not worth irl but for this it is fine
    });
    /////
    return NextResponse.json({
      success: true,
      imageUrl: blob.url,

    });
  } catch (error) {
    console.error("Error in generate-image route:", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to process request";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}