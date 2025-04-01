import { createClient } from "redis";
import { NextResponse } from "next/server";

// Create Redis client
const getRedisClient = async () => {
  const client = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
};

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Connect to Redis
    const redis = await getRedisClient();

    // Check if email already exists
    const exists = await redis.sIsMember("waitlist:emails", email);
    if (exists) {
      return NextResponse.json(
        { message: "You're already on the waitlist!" },
        { status: 200 }
      );
    }

    // Add email to Redis set
    await redis.sAdd("waitlist:emails", email);

    // Close Redis connection
    await redis.quit();

    return NextResponse.json(
      { message: "Thanks for joining our waitlist!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Waitlist submission error:", error);
    return NextResponse.json(
      { error: "Failed to join waitlist. Please try again later." },
      { status: 500 }
    );
  }
}
