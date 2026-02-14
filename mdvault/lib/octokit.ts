import { Octokit } from "@octokit/rest";
import getenv from "./env";

const { GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN } = getenv();


const octokit = new Octokit({
  auth: GITHUB_TOKEN??"placeholder",
});

export const githubRepoInfo = {
  owner: GITHUB_OWNER,
  repo: GITHUB_REPO,
  ARTICLES_PATH: "articles",
  POSTS_PATH: "posts",
  MEDIA_PATH: "media",
};

export default octokit;
