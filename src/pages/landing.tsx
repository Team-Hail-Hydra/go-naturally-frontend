import GoNaturallyLogo from "../assets/Go_Naturally_SingleLine.svg";
import { supabase } from '@/utils/supabase';
import { useEffect } from "react";

const Landing = () => {
    useEffect(() => {
        // Check if user is authenticated
        const checkAuth = async () => {
            console.log('Checking authentication...');
            const { data: { session } } = await supabase.auth.getSession();
            console.log('Session data:', session);
        };
        checkAuth();    }, []);

    return (
        <div className="flex flex-col w-full">
            {/* Top Navigation */}
            <header className="w-full bg-blue-800 text-white">
                <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
                    <div className="text-xl font-bold">
                        <img
                            src={GoNaturallyLogo}
                            alt="Go Naturally Logo"
                            className="h-14"
                        >
                        </img>
                    </div>
                    <nav className="flex gap-6">
                        <a href="#">Go Wild Area</a>
                        <a href="#">News</a>
                        <a href="#">Seasons</a>
                        <a href="#">Events</a>
                        <a href="#">Community</a>
                        <a href="#">Leaderboard</a>
                        <a href="#">Shop</a>
                    </nav>
                    <button className="bg-yellow-400 px-4 py-2 rounded">Sign In</button>
                </div>
            </header>

            {/* Hero Section with Video/Image */}
            <section className="w-full bg-blue-900 text-center py-12">
                <div className="max-w-5xl mx-auto border-4 border-gray-300">
                    <div className="h-96 flex items-center justify-center text-white">
                        Hero Image / Video Placeholder
                    </div>
                </div>
            </section>

            {/* Latest News */}
            <section className="w-full bg-white py-12">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-8">Latest News</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="h-48 bg-gray-200 flex items-center justify-center">
                            News Item 1
                        </div>
                        <div className="h-48 bg-gray-200 flex items-center justify-center">
                            News Item 2
                        </div>
                        <div className="h-48 bg-gray-200 flex items-center justify-center">
                            News Item 3
                        </div>
                    </div>
                    <div className="text-center mt-6">
                        <button className="px-6 py-2 bg-blue-800 text-white rounded">
                            More News
                        </button>
                    </div>
                </div>
            </section>

            {/* Catch Pokémon Section */}
            <section className="w-full bg-blue-700 text-white py-12">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex items-center justify-center">
                        <p className="text-lg">
                            Catch Pokémon
                            <br />
                            <span className="text-2xl font-bold">Find your buddy!</span>
                        </p>
                    </div>
                    <div className="h-64 bg-gray-200 flex items-center justify-center text-black">
                        Image Placeholder
                    </div>
                </div>
            </section>

            {/* Items for Your Adventure */}
            <section className="w-full bg-white py-12">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4">Items for Your Adventure</h2>
                    <p className="mb-8">
                        Placeholder text for description of items for your adventure.
                    </p>
                    <div className="h-96 bg-gray-200 flex items-center justify-center">
                        Image Placeholder
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="w-full bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold mb-4">Team Section</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-6 bg-gray-800 rounded">
                            Placeholder text for Team GO Rocket description
                        </div>
                        <div className="h-64 bg-gray-200 flex items-center justify-center text-black">
                            Image Placeholder
                        </div>
                    </div>
                </div>
            </section>

            {/* Download Section */}
            <section className="w-full bg-gradient-to-r from-green-300 to-blue-300 py-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Get Up and GO! Download Today</h2>
                <div className="flex justify-center gap-4">
                    <button className="px-6 py-3 bg-black text-white rounded">App Store</button>
                    <button className="px-6 py-3 bg-black text-white rounded">Google Play</button>
                    <button className="px-6 py-3 bg-black text-white rounded">Galaxy Store</button>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full bg-gray-800 text-white py-8">
                <div className="max-w-7xl mx-auto text-center">
                    <p>Footer Links / Placeholder Text</p>
                    <div className="mt-4 flex justify-center gap-4">
                        <a href="#">Terms of Service</a>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Copyright Policy</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
