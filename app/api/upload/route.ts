import { auth } from "@/lib/auth";
import { generateUploadSignature } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

// Returns a signed upload signature for the client to upload directly to Cloudinary.
// The API secret never leaves the server.
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const signatureData = generateUploadSignature("linkedin-posts");
    return NextResponse.json(signatureData);
  } catch {
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
