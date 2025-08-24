import { Github, Linkedin, Twitter, Mail } from "lucide-react";

const Footer = () => {
    const handleEmailClick = (e: React.MouseEvent) => {
        e.preventDefault();
        
        const email = "umangdalvadi8@gmail.com";
        
        // Create Gmail compose URL with only recipient email
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
        
        // Open Gmail in new tab
        window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    };

    const socialLinks = [
        {
            name: "GitHub",
            icon: Github,
            url: "https://github.com/UmangDalvadi",
            color: "hover:text-gray-300",
            isEmail: false
        },
        {
            name: "LinkedIn",
            icon: Linkedin,
            url: "https://www.linkedin.com/in/umang-dalvadi",
            color: "hover:text-blue-400",
            isEmail: false
        },
        {
            name: "Twitter",
            icon: Twitter,
            url: "https://twitter.com/umang_dalvadi",
            color: "hover:text-blue-400",
            isEmail: false
        },
        {
            name: "Email",
            icon: Mail,
            url: "#",
            color: "hover:text-green-400",
            isEmail: true
        }
    ];

    return (
        <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
            <div className="px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Left side - Project info */}
                    <div className="text-center md:text-left">
                        <p className="text-gray-400 text-sm">
                            © 2025 Jira to Code Extension. Built with ❤️ for developers.
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                            Streamline your workflow from Jira tickets to production code
                        </p>
                    </div>

                    {/* Right side - Social media links */}
                    <div className="flex items-center gap-4">
                        <span className="text-gray-500 text-sm hidden md:block">Connect with us:</span>
                        <div className="flex items-center gap-3">
                            {socialLinks.map((link) => (
                                link.isEmail ? (
                                    <button
                                        key={link.name}
                                        onClick={handleEmailClick}
                                        className={`p-2 rounded-lg bg-gray-700 text-gray-400 transition-all duration-200 ${link.color} hover:bg-gray-600 hover:scale-105 cursor-pointer border-0 outline-none`}
                                        aria-label="Copy email details"
                                        title="Copy email details to clipboard"
                                        type="button"
                                    >
                                        <link.icon size={18} />
                                    </button>
                                ) : (
                                    <a
                                        key={link.name}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`p-2 rounded-lg bg-gray-700 text-gray-400 transition-all duration-200 ${link.color} hover:bg-gray-600 hover:scale-105 cursor-pointer`}
                                        aria-label={`Visit our ${link.name}`}
                                        title={`Visit our ${link.name}`}
                                    >
                                        <link.icon size={18} />
                                    </a>
                                )
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom section - Additional links */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-gray-300 transition-colors">Documentation</a>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Version 1.0.0</span>
                            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                            <span>Made with VS Code Extension API</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
