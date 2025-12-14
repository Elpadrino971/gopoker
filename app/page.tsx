export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">
          ♠️ GPoker
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Gestion de tournois, cash games et clubs de poker
        </p>
        <div className="pt-4">
          <span className="inline-block px-4 py-2 bg-green-500 text-white rounded-lg font-semibold">
            Setup en cours...
          </span>
        </div>
      </div>
    </div>
  );
}
