export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  profile_url: string;
  public_repos: number;
  company: string | null;
  location: string | null;
}
