
import { Link } from 'react-router-dom';
import heroBg from '../assets/hero_bg.webp';

const Landing = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div
                className="relative bg-cover bg-center h-[500px] text-white flex items-center justify-center"
                style={{ backgroundImage: `url(${heroBg})` }}
            >
                <div className="absolute inset-0 bg-black opacity-50"></div>
                <div className="relative z-10 text-center px-4">
                    <h1 className="text-5xl font-bold mb-4 drop-shadow-md">Welcome to Project Bot</h1>
                    <p className="text-xl mb-8 drop-shadow-sm max-w-2xl mx-auto">
                        Orchestrating workflows and managing assessments with a powerful micro-frontend architecture.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            to="/app"
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition shadow-lg"
                        >
                            Go to User App
                        </Link>
                        <Link
                            to="/logic-modeller"
                            className="px-8 py-3 bg-white text-gray-900 hover:bg-gray-100 rounded-lg font-semibold transition shadow-lg"
                        >
                            Go to Logic Modeller
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-6xl mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Choose Your Path</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    {/* User App Card */}
                    <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition border border-gray-100 group">
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition">
                            <span className="text-2xl">👤</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">User Assessment</h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Start a guided assessment flow. Answer questions, get instant feedback, and navigate through a personalized path tailored to your needs.
                        </p>
                        <Link to="/app" className="text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-2">
                            Launch App <span>→</span>
                        </Link>
                    </div>

                    {/* Admin App Card */}
                    <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition border border-gray-100 group">
                        <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition">
                            <span className="text-2xl">⚙️</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">Logic Modeller</h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Design and manage your workflows. Use the visual node editor to create, update, and organize question paths and document dependencies.
                        </p>
                        <Link to="/logic-modeller" className="text-purple-600 font-semibold hover:text-purple-800 flex items-center gap-2">
                            Open Logic Modeller <span>→</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-800 text-gray-300 py-8 text-center mt-auto">
                <p>© 2026 Project Bot. Built with React, Vite & Module Federation.</p>
            </footer>
        </div>
    );
};

export default Landing;
