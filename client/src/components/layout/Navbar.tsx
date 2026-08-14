import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase,
  Sun,
  Moon,
  Bell,
  LogOut,
  User,
  LayoutDashboard,
  FileText,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-110">
            <Briefcase className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">JobFinder</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Browse Jobs
          </Link>
          {user?.role === "employer" && (
            <>
              <Link
                to="/employer/dashboard"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                to="/employer/jobs"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                My Jobs
              </Link>
            </>
          )}
          {user?.role === "candidate" && (
            <Link
              to="/my-applications"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              My Applications
            </Link>
          )}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <Button
            id="theme-toggle"
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
            className="h-9 w-9 rounded-lg"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {user ? (
            <>
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  id="user-menu-trigger"
                  className="flex h-9 items-center gap-2 rounded-lg px-2 hover:bg-accent transition-colors"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.profileImage} />
                    <AvatarFallback className="text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:block max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {user.role === "candidate" && (
                    <>
                      <DropdownMenuItem
                        id="nav-profile"
                        onClick={() => navigate("/profile")}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        id="nav-applications"
                        onClick={() => navigate("/my-applications")}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        My Applications
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.role === "employer" && (
                    <>
                      <DropdownMenuItem
                        id="nav-dashboard"
                        onClick={() => navigate("/employer/dashboard")}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        id="nav-my-jobs"
                        onClick={() => navigate("/employer/jobs")}
                      >
                        <Briefcase className="mr-2 h-4 w-4" />
                        My Jobs
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    id="nav-logout"
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                id="nav-login"
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button
                id="nav-register"
                size="sm"
                onClick={() => navigate("/register")}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
