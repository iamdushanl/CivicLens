"use client"

import { useState, useEffect } from "react"
import {
    User, FileWarning, CheckCircle2, Clock, MapPin, Edit3,
    Save, X, Trash2, Award, TrendingUp, Eye, Plus, ChevronRight,
} from "lucide-react"
import {
    getUserProfile, saveUserProfile, getMyReports, clearMyReports,
    getFollowedIssues, getUpvotedIssues, type UserProfile, type MyReport,
} from "@/lib/local-store"
import { getTimeAgo } from "@/lib/category-helpers"
import { cn } from "@/lib/utils"

const AVATAR_EMOJIS = ["🧑‍💼", "👩‍💼", "🧑‍🔧", "👩‍🔧", "🧑‍💻", "👩‍💻", "🧑", "👩", "👨", "🦸", "🦸‍♀️", "🌟"]

const DISTRICTS = [
    "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
    "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
    "Mullaitivu", "Vavuniya", "Trincomalee", "Batticaloa", "Ampara",
    "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
    "Monaragala", "Ratnapura", "Kegalle",
]

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    open: { label: "Open", color: "text-violet-500", icon: FileWarning },
    "in-progress": { label: "In Progress", color: "text-amber-500", icon: Clock },
    resolved: { label: "Resolved", color: "text-emerald-500", icon: CheckCircle2 },
}

interface MyReportsScreenProps {
    onReportIssue: () => void
}

export function MyReportsScreen({ onReportIssue }: MyReportsScreenProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [myReports, setMyReports] = useState<MyReport[]>([])
    const [editing, setEditing] = useState(false)
    const [editName, setEditName] = useState("")
    const [editDistrict, setEditDistrict] = useState("")
    const [editEmoji, setEditEmoji] = useState("🧑‍💼")
    const [followedCount, setFollowedCount] = useState(0)
    const [upvotedCount, setUpvotedCount] = useState(0)
    const [confirmClear, setConfirmClear] = useState(false)

    const refresh = () => {
        const p = getUserProfile()
        setProfile(p)
        setMyReports(getMyReports())
        setFollowedCount(getFollowedIssues().length)
        setUpvotedCount(getUpvotedIssues().length)
        if (p) { setEditName(p.displayName); setEditDistrict(p.district); setEditEmoji(p.avatarEmoji) }
    }

    useEffect(() => { refresh() }, [])

    const handleSaveProfile = () => {
        if (!editName.trim()) return
        saveUserProfile({ displayName: editName.trim(), district: editDistrict, avatarEmoji: editEmoji, reportCount: myReports.length })
        setEditing(false)
        refresh()
    }

    const handleClearReports = () => {
        clearMyReports()
        setConfirmClear(false)
        refresh()
    }

    // First-time: no profile
    if (!profile && !editing) {
        return (
            <div className="flex flex-col items-center gap-6 page-shell py-16">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-8 text-center text-white w-full">
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative flex flex-col items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 text-4xl backdrop-blur-sm">
                            🧑‍💼
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Welcome to CivicLens!</h1>
                            <p className="mt-1 text-sm text-white/75">Create a local profile to track your reports</p>
                        </div>
                        <button
                            onClick={() => setEditing(true)}
                            className="mt-2 flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-violet-700 shadow-lg hover:bg-white/90"
                        >
                            <Plus className="h-4 w-4" /> Set Up Profile
                        </button>
                    </div>
                </div>

                <div className="section-card w-full flex flex-col items-center gap-3 py-12 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                        <Eye className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No reports yet</p>
                    <p className="text-xs text-muted-foreground">Your submitted reports will appear here</p>
                    <button onClick={onReportIssue} className="mt-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md">
                        <FileWarning className="h-3.5 w-3.5" /> Report an Issue
                    </button>
                </div>
            </div>
        )
    }

    // Edit profile form
    if (editing) {
        return (
            <div className="flex flex-col gap-6 page-shell">
                <div className="flex items-center gap-3">
                    <button onClick={() => { setEditing(false) }} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card hover:bg-muted">
                        <X className="h-4 w-4" />
                    </button>
                    <h1 className="text-base font-bold text-foreground">{profile ? "Edit Profile" : "Create Profile"}</h1>
                </div>

                {/* Avatar picker */}
                <div className="section-card flex flex-col gap-4 p-5">
                    <p className="text-sm font-bold text-foreground">Choose your avatar</p>
                    <div className="grid grid-cols-6 gap-2">
                        {AVATAR_EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => setEditEmoji(emoji)}
                                className={cn(
                                    "flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-all",
                                    editEmoji === emoji ? "bg-gradient-to-br from-violet-500 to-indigo-500 shadow-md ring-2 ring-violet-500 ring-offset-1" : "bg-muted hover:bg-muted/80"
                                )}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-foreground">Display Name</label>
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. Kamal Perera"
                        maxLength={40}
                        className="premium-input"
                    />
                </div>

                {/* District */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-foreground">Your District</label>
                    <select
                        value={editDistrict}
                        onChange={(e) => setEditDistrict(e.target.value)}
                        className="premium-input"
                    >
                        <option value="">Select district…</option>
                        {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                <button
                    onClick={handleSaveProfile}
                    disabled={!editName.trim()}
                    className="btn-primary min-h-12 disabled:opacity-50"
                >
                    <Save className="h-4 w-4" /> Save Profile
                </button>
            </div>
        )
    }

    // Main screen  
    return (
        <div className="flex flex-col gap-6 page-shell">
            {/* Profile Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 text-white">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex items-center gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-3xl bg-white/20 text-3xl backdrop-blur-sm">
                        {profile!.avatarEmoji}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">{profile!.displayName}</h1>
                        {profile!.district && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
                                <MapPin className="h-3 w-3" /> {profile!.district} District
                            </div>
                        )}
                        <div className="mt-1.5 text-[10px] text-white/60">
                            Member since {new Date(profile!.joinedAt).toLocaleDateString("en-LK", { month: "long", year: "numeric" })}
                        </div>
                    </div>
                    <button
                        onClick={() => setEditing(true)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30"
                    >
                        <Edit3 className="h-4 w-4 text-white" />
                    </button>
                </div>

                {/* Stats */}
                <div className="relative mt-5 grid grid-cols-3 gap-3">
                    {[
                        { label: "Reports", value: myReports.length, icon: "📝" },
                        { label: "Following", value: followedCount, icon: "🔔" },
                        { label: "Upvoted", value: upvotedCount, icon: "👍" },
                    ].map((stat) => (
                        <div key={stat.label} className="flex flex-col items-center gap-1 rounded-xl bg-white/15 py-3 backdrop-blur-sm">
                            <span className="text-lg">{stat.icon}</span>
                            <span className="text-lg font-black">{stat.value}</span>
                            <span className="text-[10px] text-white/70">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Achievement Badge */}
            {myReports.length >= 1 && (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/5 px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20">
                        <Award className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-foreground">
                            {myReports.length >= 10 ? "Super Reporter 🏆" : myReports.length >= 5 ? "Active Reporter 🌟" : "Civic Hero 🦸"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            {myReports.length >= 10 ? "10+ reports submitted" : myReports.length >= 5 ? "5+ reports submitted" : "First report submitted!"}
                        </p>
                    </div>
                </div>
            )}

            {/* My Reports List */}
            <section className="section-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-bold text-foreground">My Reports</h2>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{myReports.length}</span>
                    </div>
                    {myReports.length > 0 && (
                        <button onClick={() => setConfirmClear(true)} className="text-[11px] text-muted-foreground hover:text-destructive">
                            Clear all
                        </button>
                    )}
                </div>

                {myReports.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 py-14 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                            <FileWarning className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">No reports yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Issues you submit will appear here</p>
                        </div>
                        <button onClick={onReportIssue} className="mt-1 flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md">
                            <FileWarning className="h-3.5 w-3.5" /> Report an Issue
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y divide-border/60">
                        {myReports.map((report) => {
                            const cfg = statusConfig[report.status] || statusConfig.open
                            const Icon = cfg.icon
                            return (
                                <div key={report.id} className="flex items-center gap-3 px-5 py-4">
                                    <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-muted")}>
                                        <Icon className={cn("h-4 w-4", cfg.color)} />
                                    </div>
                                    <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                                        <p className="truncate text-sm font-semibold text-foreground">{report.title}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("text-[10px] font-bold", cfg.color)}>{cfg.label}</span>
                                            <span className="text-[10px] text-muted-foreground">·</span>
                                            <span className="text-[10px] text-muted-foreground truncate">{report.location}</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">{getTimeAgo(report.submittedAt)}</p>
                                    </div>
                                    <div className="flex-shrink-0 text-[10px] font-mono text-muted-foreground">{report.id.slice(0, 8)}</div>
                                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* Clear confirm */}
            {confirmClear && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmClear(false)} />
                    <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                                <Trash2 className="h-6 w-6 text-destructive" />
                            </div>
                            <div>
                                <p className="font-bold text-foreground">Clear all reports?</p>
                                <p className="mt-1 text-xs text-muted-foreground">This only removes them from your local history, not from the platform.</p>
                            </div>
                            <div className="flex w-full gap-3">
                                <button onClick={() => setConfirmClear(false)} className="btn-secondary flex-1">Cancel</button>
                                <button onClick={handleClearReports} className="flex-1 rounded-2xl bg-destructive py-2.5 text-sm font-bold text-destructive-foreground">Clear</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
