import { NextResponse } from "next/server";
import {put} from "@vercel/blob";
import crypto from "crypto";
import { blob } from "stream/consumers";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    // TODO: Call your Image Generation API here
    // For now, we'll just echo back the text
    
    console.log(text);
    const url = new URL("https://yd2696--sd-demo-model-generate.modal.run");
    url.searchParams.set("prompt",text)
    console.log("Requesting url: ", url.toString());
    
    const response = await fetch(url.toString(),{
      method: "GET",
      headers:{
        "X-API-Key":process.env.API_KEY || "",
        Accept: "image/jpeg",
      },
    }); 
    if (!response.ok){
      const errorText = await response.text();
      console.log("API resonse: ",errorText );
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }
    /////
    const imageBuffer = await response.arrayBuffer();
    const filename = `${crypto.randomUUID()}.jpg`
    const blob = await put(filename,imageBuffer,{
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
    console.log(error)
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}