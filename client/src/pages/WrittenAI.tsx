import { Button } from "@/components/ui/button";

export default function WrittenAI() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-black flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-white mb-6">Written Event AI Grader</h1>
        <p className="text-xl text-gray-300 mb-12">Get detailed feedback on your written event submission. Upload your work and receive comprehensive analysis.</p>
        <Button
          onClick={() => window.open("https://chhsdeca-9shazsx7.manus.space/", "_blank")}
          className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-6 text-lg font-semibold rounded-lg"
        >
          Open Written Event AI Grader
        </Button>
      </div>
    </div>
  );
}
