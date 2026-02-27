import { Link } from "react-router-dom";
import { User, ChevronRight, Calendar, Clock, MapPin } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getStoredProfile } from "@/lib/profile";
import { Reveal } from "@/components/animate-ui/primitives/effects/reveal";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";

interface UserContextBannerProps {
  className?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function UserContextBanner({ className }: UserContextBannerProps) {
  const { user } = useAuth();
  const profile = getStoredProfile();

  if (!user || !profile) return null;

  return (
    <Reveal from="up" offset={18}>
      <Link
        to="/profile"
        className={cn(
          "group flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-soft px-4 py-3 transition-all duration-200 hover:border-primary/30 hover:shadow-sm cursor-pointer",
          className
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-white">
          <User className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate text-sm font-semibold text-foreground">
            <GradientText text={profile.fullName} />
          </p>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {profile.dateOfBirth && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 shrink-0 text-primary/60" />
                <span className="truncate">{formatDate(profile.dateOfBirth)}</span>
              </div>
            )}
            {profile.timeOfBirth && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 shrink-0 text-primary/60" />
                <span className="truncate">{profile.timeOfBirth}</span>
              </div>
            )}
            {profile.placeOfBirth && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
                <span className="truncate">{profile.placeOfBirth}</span>
              </div>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    </Reveal>
  );
}
