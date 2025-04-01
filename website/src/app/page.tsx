import { WaitlistForm } from "@/components/WaitlistForm";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Waitlist UI */}
      <div className="w-full md:w-1/2 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="max-w-md w-full">
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-4 font-nunito">
                Brainrot Copilot
              </h1>
              <p className="text-lg text-gray-600 mb-4 dark:text-gray-300 font-pt-sans">
                Never lose focus while watching a lecture again.
              </p>
              <WaitlistForm />
            </div>

            <div className="mb-10">
              <video
                src="/student-timelapse.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full rounded-lg shadow-lg bg-black/5 dark:bg-white/5"
                style={{ maxHeight: "300px", objectFit: "contain" }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 flex flex-col items-center gap-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" className="font-pt-sans h-10" asChild>
            <a
              href="https://github.com/3eif/brainrot-copilot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              View Source Code
            </a>
          </Button>

          <div className="flex gap-4 text-sm text-gray-500 font-pt-sans">
            <a
              href="https://twitter.com/sabziz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors inline-flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
              Twitter
            </a>
            <span className="text-gray-300 dark:text-gray-700">•</span>
            <a
              href="https://linkedin.com/in/seifabdelaziz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors inline-flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      {/* Right side - Ghibli background image */}
      <div
        className="hidden md:block w-1/2 bg-cover bg-center"
        style={{ backgroundImage: 'url("/ghibli-background.png")' }}
      />
    </div>
  );
}
