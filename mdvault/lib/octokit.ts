import { Octokit } from "@octokit/rest";
import getenv from "./env";

const {
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_TOKEN,
  ARTICLES_PATH,
  POSTS_PATH,
  MEDIA_PATH,
} = getenv();

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

export const githubRepoInfo = {
  owner: GITHUB_OWNER,
  repo: GITHUB_REPO,
  ARTICLES_PATH: ARTICLES_PATH,
  POSTS_PATH: POSTS_PATH,
  MEDIA_PATH: MEDIA_PATH,
};

export default octokit;
