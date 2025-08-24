// import { useEffect, useState } from "react";
// import { postMessage, subscribeMessage } from "../lib/vscodeBridge";
// import { FromWebview, ToWebview } from "../../../src/constants/messageTypes";

import Header from "../components/Header";
import Tabs from "../components/Tabs";
import Footer from "../components/Footer";
import { useAppContext } from "../context/AppContext";
import Workflow from "./Workflow";
import Settings from "./Settings";

const Home = () => {
    const { activeTab } = useAppContext();

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <Header />
            {/* Tabs */}
            <Tabs />
            {/* Content */}
            <div className="p-6 flex-1">
                {/* {activeTab === "dashboard" && <div>Dashboard Content</div>} */}
                {activeTab === "workflow" && <Workflow />}
                {activeTab === "settings" && <Settings />}
            </div>
            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Home;
