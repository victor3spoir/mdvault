import { IconCircleCheck, IconExternalLink } from "@tabler/icons-react";
import Image from "next/image";
import { connection } from "next/server";
import { Button } from "@/components/ui/button";
import { getGitHubUserAction } from "../settings.actions";

const UserProfileCard = async () => {
  await connection();
  const result = await getGitHubUserAction();

  if (!result.success) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="p-6 text-center text-muted-foreground">
          {result.error}
        </div>
      </div>
    );
  }

  const user = result.data;

  return (
    <div className="rounded-xl border bg-linear-to-br from-card to-card/50 overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <Image
              src={user.avatar_url}
              alt={user.login}
              width={72}
              height={72}
              className="rounded-full border-2 border-primary/20"
              priority
            />
            <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1 border-2 border-card">
              <IconCircleCheck className="size-4 text-white" />
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold">{user.name || user.login}</h2>
                <p className="text-sm text-muted-foreground">@{user.login}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={user.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <IconExternalLink className="size-4" />
                  View Profile
                </a>
              </Button>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-sm text-muted-foreground mt-2">{user.bio}</p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              {user.location && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>📍</span>
                  <span>{user.location}</span>
                </div>
              )}
              {user.company && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>🏢</span>
                  <span>{user.company}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
