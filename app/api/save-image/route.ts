import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

// API route handler for POST requests to /api/save-image
export async function POST(req: Request) {
  try {
    // Parse the JSON body from the request
    const data = await req.json();
    const { image } = data;

    // Generate a secure random filename to prevent collisions
    // Uses 16 bytes of random data converted to hexadecimal (32 characters)
    const randomName = crypto.randomBytes(16).toString("hex");
    const fileName = `${randomName}.png`;

    // Remove the data URL prefix from the base64 string
    // Example prefix: "data:image/png;base64,"
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Convert the base64 string to a buffer for file writing
    const buffer = Buffer.from(base64Data, "base64");

    // Construct the path to save the file
    // process.cwd() gets the current working directory
    // Files are saved to public/captured-photos for easy access via URL
    const publicPath = join(process.cwd(), "public", "captured-photos");

    // Write the file to disk
    await writeFile(join(publicPath, fileName), buffer);

    // Return success response with the generated filename
    return NextResponse.json({ success: true, fileName });
  } catch (error) {
    // Log the error for debugging
    console.error("Error saving image:", error);

    // Return error response with 500 status code
    return NextResponse.json(
      { success: false, error: "Failed to save image" },
      { status: 500 }
    );
  }
}
