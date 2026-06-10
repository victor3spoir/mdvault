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

export interface SettingsRepositoryInfo {
	owner: string;
	repo: string;
	branch: string;
}

export interface SettingsSiteInfo {
	name: string;
	url: string;
}

export interface SettingsPageData {
	user: GitHubUser;
	repository: SettingsRepositoryInfo;
	site: SettingsSiteInfo;
}
