import React from 'react';
import {
    PenTool,
    Sparkles,
    TrendingUp,
    Calendar,
    ArrowRight
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const stats = [
        { label: 'Posts Generated', value: '124', change: '+12%', icon: PenTool, color: 'text-blue-400' },
        { label: 'Credits Left', value: '850', change: '-150', icon: Sparkles, color: 'text-yellow-400' },
        { label: 'Avg. Engagement', value: '4.8%', change: '+0.5%', icon: TrendingUp, color: 'text-green-400' },
    ];

    const recentPosts = [
        { title: "5 Tips for AI Marketing", platform: "LinkedIn", date: "2 hours ago", status: "Draft" },
        { title: "Why Python is eating the world", platform: "Twitter", date: "5 hours ago", status: "Published" },
        { title: "React 19 Features Explained", platform: "Blog", date: "1 day ago", status: "Scheduled" },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Good Afternoon, Aditya</h1>
                    <p className="text-gray-400">Ready to create some viral content today?</p>
                </div>
                <Link to="/">
                    <Button size="lg" className="bg-gradient-to-r from-primary to-violet-600">
                        <Sparkles className="w-5 h-5 mr-2" />
                        Create New Post
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <GlassCard key={index} hoverEffect>
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                    </GlassCard>
                ))}
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                        <Button variant="ghost" size="sm">View All</Button>
                    </div>

                    <div className="space-y-4">
                        {recentPosts.map((post, i) => (
                            <GlassCard key={i} className="flex items-center justify-between group cursor-pointer hover:border-primary/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                                        <PenTool className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium group-hover:text-primary transition-colors">{post.title}</h4>
                                        <p className="text-sm text-gray-500">{post.platform} • {post.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-xs px-2 py-1 rounded-md ${post.status === 'Published' ? 'bg-green-500/10 text-green-400' :
                                            post.status === 'Scheduled' ? 'bg-blue-500/10 text-blue-400' :
                                                'bg-gray-500/10 text-gray-400'
                                        }`}>
                                        {post.status}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>

                {/* Quick Plan / Calendar */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white">Content Calendar</h2>
                    <GlassCard className="h-[300px] flex items-center justify-center text-gray-500 flex-col gap-4">
                        <Calendar className="w-12 h-12 opacity-50" />
                        <p>No posts scheduled for tomorrow</p>
                        <Button variant="secondary" size="sm">Schedule Post</Button>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
