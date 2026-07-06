import { Button } from "@/components/ui/button";

export default function RoleplayAI() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-black flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-white mb-6">Roleplay Event AI</h1>
        <p className="text-xl text-gray-300 mb-12">Get AI-powered feedback on your roleplay performance. Record your speech and receive detailed analysis.</p>
        <Button
          onClick={() => window.open("https://chhsdeca-hn7kwxwp.manus.space", "_blank")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 text-lg font-semibold rounded-lg"
        >
          Open Roleplay Event AI
        </Button>
      </div>
    </div>
  );
}
